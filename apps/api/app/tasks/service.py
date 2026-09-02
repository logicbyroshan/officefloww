import uuid
from datetime import datetime, timezone
from typing import List, Optional, Tuple
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from apps.api.app.core.exceptions import EntityNotFoundError, BusinessRuleViolationError
from apps.api.app.tasks.models import Task, TaskBlocker, TaskComment, TaskPriority, TaskStatus
from apps.api.app.tasks.schemas import TaskCreate, TaskUpdate, TaskCompleteRequest
from apps.api.app.workflows.models import WorkflowStepInstance, StepStatus
from apps.api.app.users.models import UserRole


class TaskService:
    @staticmethod
    async def generate_task_for_step(
        db: AsyncSession,
        order_id: uuid.UUID,
        order_item_id: uuid.UUID,
        workflow_instance_id: uuid.UUID,
        step_instance: WorkflowStepInstance,
    ) -> Task:
        # Generate unique task code, e.g. TSK-<random 6 hex>
        code_suffix = uuid.uuid4().hex[:6].upper()
        task_code = f"TSK-{step_instance.step_type.value[:3]}-{code_suffix}"

        task = Task(
            task_code=task_code,
            title=f"{step_instance.name}",
            description=f"Task for operational step: {step_instance.name}",
            instructions=step_instance.notes,
            order_id=order_id,
            order_item_id=order_item_id,
            workflow_instance_id=workflow_instance_id,
            workflow_step_instance_id=step_instance.id,
            assigned_user_id=step_instance.assigned_user_id,
            assigned_role=step_instance.required_role,
            priority=TaskPriority.NORMAL,
            priority_score=1.0,
            status=TaskStatus.READY,
            started_at=datetime.now(timezone.utc),
        )
        db.add(task)
        await db.flush()
        return task

    @staticmethod
    async def list_tasks(
        db: AsyncSession,
        page: int = 1,
        page_size: int = 20,
        order_id: Optional[uuid.UUID] = None,
        status: Optional[TaskStatus] = None,
        assigned_user_id: Optional[uuid.UUID] = None,
        assigned_role: Optional[UserRole] = None,
        search: Optional[str] = None,
    ) -> Tuple[List[Task], int]:
        query = select(Task).options(
            selectinload(Task.blockers),
            selectinload(Task.comments),
        )
        if order_id:
            query = query.where(Task.order_id == order_id)
        if status:
            query = query.where(Task.status == status)
        if assigned_user_id:
            query = query.where(Task.assigned_user_id == assigned_user_id)
        if assigned_role:
            query = query.where(Task.assigned_role == assigned_role)
        if search:
            pattern = f"%{search}%"
            query = query.where((Task.title.ilike(pattern)) | (Task.task_code.ilike(pattern)))

        total = await db.scalar(select(func.count()).select_from(query.subquery())) or 0
        query = query.order_by(Task.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        result = await db.execute(query)
        tasks = result.scalars().all()
        return list(tasks), total

    @staticmethod
    async def get_task(db: AsyncSession, task_id: uuid.UUID) -> Task:
        query = (
            select(Task)
            .options(
                selectinload(Task.blockers),
                selectinload(Task.comments),
            )
            .where(Task.id == task_id)
        )
        result = await db.execute(query)
        task = result.scalar_one_or_none()
        if not task:
            raise EntityNotFoundError("Task", task_id)
        return task

    @staticmethod
    async def update_task(db: AsyncSession, task_id: uuid.UUID, data: TaskUpdate) -> Task:
        task = await TaskService.get_task(db, task_id)
        if data.title is not None:
            task.title = data.title
        if data.description is not None:
            task.description = data.description
        if data.instructions is not None:
            task.instructions = data.instructions
        if data.assigned_user_id is not None:
            task.assigned_user_id = data.assigned_user_id
        if data.assigned_role is not None:
            task.assigned_role = data.assigned_role
        if data.priority is not None:
            task.priority = data.priority
        if data.priority_score is not None:
            task.priority_score = data.priority_score
        if data.status is not None:
            task.status = data.status
        if data.due_date is not None:
            task.due_date = data.due_date

        await db.commit()
        await db.refresh(task)
        return task

    @staticmethod
    async def complete_task(
        db: AsyncSession,
        task_id: uuid.UUID,
        user_id: uuid.UUID,
        data: Optional[TaskCompleteRequest] = None,
    ) -> Task:
        task = await TaskService.get_task(db, task_id)
        if task.status == TaskStatus.COMPLETED:
            return task
        if task.status == TaskStatus.BLOCKED:
            raise BusinessRuleViolationError("Cannot complete a task that is currently blocked.")

        task.status = TaskStatus.COMPLETED
        task.completed_at = datetime.now(timezone.utc)
        task.completed_by_id = user_id

        # Update and advance corresponding workflow step
        step_inst = await db.scalar(
            select(WorkflowStepInstance).where(
                WorkflowStepInstance.id == task.workflow_step_instance_id
            )
        )
        if step_inst:
            from apps.api.app.workflows.service import WorkflowService
            await WorkflowService.advance_workflow_after_step_completed(db, step_inst)

        # Audit Log
        from apps.api.app.audit.models import AuditLog
        audit = AuditLog(
            actor_id=user_id,
            action="TASK_COMPLETED",
            entity="Task",
            entity_id=str(task.id),
            old_values_json={"status": TaskStatus.READY.value},
            new_values_json={"status": TaskStatus.COMPLETED.value, "notes": data.notes if data else None},
            reason="Task completed by operator",
        )
        db.add(audit)

        await db.commit()
        await db.refresh(task)
        return task

    @staticmethod
    async def add_blocker(db: AsyncSession, task_id: uuid.UUID, reason: str, user_id: uuid.UUID) -> TaskBlocker:
        task = await TaskService.get_task(db, task_id)
        blocker = TaskBlocker(
            task_id=task.id,
            reason=reason,
            blocked_by_user_id=user_id,
        )
        task.status = TaskStatus.BLOCKED
        db.add(blocker)
        await db.commit()
        await db.refresh(blocker)
        return blocker

    @staticmethod
    async def resolve_blocker(db: AsyncSession, blocker_id: uuid.UUID, user_id: uuid.UUID) -> TaskBlocker:
        blocker = await db.scalar(select(TaskBlocker).where(TaskBlocker.id == blocker_id))
        if not blocker:
            raise EntityNotFoundError("TaskBlocker", blocker_id)

        blocker.resolved_at = datetime.now(timezone.utc)
        blocker.resolved_by_user_id = user_id

        # Check if there are other unresolved blockers on this task
        unresolved = await db.scalar(
            select(func.count())
            .select_from(TaskBlocker)
            .where(
                TaskBlocker.task_id == blocker.task_id,
                TaskBlocker.id != blocker_id,
                TaskBlocker.resolved_at.is_(None),
            )
        )
        if unresolved == 0:
            task = await TaskService.get_task(db, blocker.task_id)
            task.status = TaskStatus.READY

        await db.commit()
        await db.refresh(blocker)
        return blocker

    @staticmethod
    async def add_comment(db: AsyncSession, task_id: uuid.UUID, user_id: uuid.UUID, message: str) -> TaskComment:
        task = await TaskService.get_task(db, task_id)
        comment = TaskComment(
            task_id=task.id,
            user_id=user_id,
            message=message,
        )
        db.add(comment)
        await db.commit()
        await db.refresh(comment)
        return comment
