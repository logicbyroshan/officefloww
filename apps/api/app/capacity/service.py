import uuid
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from typing import Dict, List, Optional
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from apps.api.app.core.exceptions import (
    BusinessRuleViolationError,
    EntityNotFoundError,
)
from apps.api.app.users.models import User, UserRole
from apps.api.app.tasks.models import Task, TaskStatus, TaskPriority
from apps.api.app.production.models import Machine, ProductionBatch, ProductionBatchStatus
from apps.api.app.capacity.models import (
    CapacityLog,
    AbsenceRecord,
    AbsenceStatus,
)
from apps.api.app.capacity.schemas import (
    AbsenceCreate,
    HandoverPlan,
    HandoverTaskItem,
    CapacityMetrics,
    PriorityExplanation,
)


class CapacityService:
    @staticmethod
    async def get_machine_capacity_metrics(db: AsyncSession) -> List[CapacityMetrics]:
        machines = (await db.scalars(select(Machine).where(Machine.is_active == True))).all()
        metrics = []

        for m in machines:
            batches = (
                await db.scalars(
                    select(ProductionBatch).where(
                        ProductionBatch.machine_id == m.id,
                        ProductionBatch.status.in_([ProductionBatchStatus.PLANNED, ProductionBatchStatus.IN_PROGRESS]),
                    )
                )
            ).all()

            # Estimate hours based on 500 units/hour
            allocated_hours = sum(b.input_quantity / 500.0 for b in batches)
            total_hours = 8.0  # standard 8hr shift
            available_hours = max(0.0, total_hours - allocated_hours)
            utilization = (allocated_hours / total_hours) * 100.0 if total_hours > 0 else 0.0

            status_str = "NORMAL"
            if utilization >= 100.0:
                status_str = "OVERLOADED"
            elif utilization >= 75.0:
                status_str = "HIGH"

            metrics.append(
                CapacityMetrics(
                    resource_type="MACHINE",
                    resource_id=m.id,
                    resource_name=m.name,
                    total_capacity_hours=total_hours,
                    allocated_hours=round(allocated_hours, 1),
                    available_hours=round(available_hours, 1),
                    utilization_percentage=round(utilization, 1),
                    status=status_str,
                )
            )

        return metrics

    @staticmethod
    async def get_employee_workload_metrics(db: AsyncSession) -> List[CapacityMetrics]:
        users = (await db.scalars(select(User).where(User.is_active == True))).all()
        metrics = []

        for u in users:
            active_tasks = (
                await db.scalars(
                    select(Task).where(
                        Task.assigned_user_id == u.id,
                        Task.status.in_([TaskStatus.READY, TaskStatus.IN_PROGRESS, TaskStatus.BLOCKED]),
                    )
                )
            ).all()

            # Each task estimated at ~1.5 hours
            allocated_hours = len(active_tasks) * 1.5
            total_hours = 8.0
            available_hours = max(0.0, total_hours - allocated_hours)
            utilization = (allocated_hours / total_hours) * 100.0

            status_str = "NORMAL"
            if len(active_tasks) >= 6:
                status_str = "OVERLOADED"
            elif len(active_tasks) >= 4:
                status_str = "HIGH"

            metrics.append(
                CapacityMetrics(
                    resource_type="EMPLOYEE",
                    resource_id=u.id,
                    resource_name=u.full_name,
                    total_capacity_hours=total_hours,
                    allocated_hours=round(allocated_hours, 1),
                    available_hours=round(available_hours, 1),
                    utilization_percentage=round(utilization, 1),
                    status=status_str,
                )
            )

        return metrics

    @staticmethod
    def calculate_priority_explanation(
        task: Task, hours_until_due: Optional[float] = None, is_downstream_blocker: bool = False
    ) -> PriorityExplanation:
        score = 1.0
        calculated_priority = TaskPriority.NORMAL.value
        explanation = "Standard routine task in scheduled workflow."

        if hours_until_due is not None and hours_until_due < 6.0:
            calculated_priority = TaskPriority.CRITICAL.value
            score = 10.0
            explanation = f"CRITICAL: Due in {hours_until_due:.1f} hours! Immediate action required to prevent order delay."
        elif is_downstream_blocker or (hours_until_due is not None and hours_until_due < 24.0):
            calculated_priority = TaskPriority.HIGH.value
            score = 5.0
            explanation = (
                f"HIGH: Due in {hours_until_due or 24:.0f} hours and directly blocks downstream printing/packing steps."
            )

        return PriorityExplanation(
            task_id=task.id,
            calculated_priority=calculated_priority,
            score=score,
            explanation=explanation,
        )

    @staticmethod
    async def create_absence_and_plan_handover(
        db: AsyncSession, data: AbsenceCreate, manager_id: Optional[uuid.UUID] = None
    ) -> HandoverPlan:
        user = await db.scalar(select(User).where(User.id == data.user_id))
        if not user:
            raise EntityNotFoundError("User", str(data.user_id))

        # Query all active tasks assigned to user
        active_tasks = (
            await db.scalars(
                select(Task).where(
                    Task.assigned_user_id == user.id,
                    Task.status.in_([TaskStatus.READY, TaskStatus.IN_PROGRESS, TaskStatus.BLOCKED]),
                )
            )
        ).all()

        # Find candidate substitutes with the same role (excluding absent user)
        candidates = (
            await db.scalars(
                select(User).where(User.role == user.role, User.id != user.id, User.is_active == True)
            )
        ).all()

        if not candidates:
            # Fallback: search for any manager/admin
            candidates = (
                await db.scalars(
                    select(User).where(
                        User.role.in_([UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER]),
                        User.id != user.id,
                        User.is_active == True,
                    )
                )
            ).all()

        handover_items = []
        for idx, task in enumerate(active_tasks):
            # Distribute across candidate workers
            substitute = candidates[idx % len(candidates)] if candidates else user
            reason = f"Reassigned during {user.full_name}'s absence to maintain delivery SLA."

            handover_items.append(
                HandoverTaskItem(
                    task_id=task.id,
                    task_code=task.task_code,
                    title=task.title,
                    current_assignee_id=user.id,
                    recommended_assignee_id=substitute.id,
                    recommended_assignee_name=substitute.full_name,
                    priority=task.priority.value,
                    due_date=task.due_date,
                    reason=reason,
                )
            )

        absence = AbsenceRecord(
            user_id=user.id,
            start_date=data.start_date,
            end_date=data.end_date,
            reason=data.reason,
            status=AbsenceStatus.PENDING,
            handover_recommendations_json={"tasks": [h.model_dump(mode="json") for h in handover_items]},
            approved_by_id=manager_id,
        )
        db.add(absence)
        await db.commit()
        await db.refresh(absence)

        return HandoverPlan(
            absence_id=absence.id,
            absent_user_id=user.id,
            absent_user_name=user.full_name,
            active_tasks_count=len(active_tasks),
            tasks_to_handover=handover_items,
        )

    @staticmethod
    async def execute_handover(db: AsyncSession, absence_id: uuid.UUID, manager_id: uuid.UUID) -> int:
        absence = await db.scalar(select(AbsenceRecord).where(AbsenceRecord.id == absence_id))
        if not absence:
            raise EntityNotFoundError("AbsenceRecord", str(absence_id))

        handover_data = absence.handover_recommendations_json or {}
        tasks_list = handover_data.get("tasks", [])
        reassigned_count = 0

        for item in tasks_list:
            task_id = uuid.UUID(item["task_id"])
            rec_id = uuid.UUID(item["recommended_assignee_id"])

            task = await db.scalar(select(Task).where(Task.id == task_id))
            if task and task.status not in (TaskStatus.COMPLETED, TaskStatus.CANCELLED):
                task.assigned_user_id = rec_id
                task.instructions = (task.instructions or "") + f"\n[Handover: Reassigned from {absence.user_id}]"
                reassigned_count += 1

        absence.status = AbsenceStatus.HANDOVER_EXECUTED
        absence.approved_by_id = manager_id
        await db.commit()
        return reassigned_count

    @staticmethod
    async def get_absence_handover_summary(db: AsyncSession, absence_id: uuid.UUID) -> dict:
        absence = await db.scalar(
            select(AbsenceRecord).where(AbsenceRecord.id == absence_id)
        )
        if not absence:
            raise EntityNotFoundError("AbsenceRecord", str(absence_id))

        user = await db.scalar(select(User).where(User.id == absence.user_id))
        user_name = user.full_name if user else "Unknown"

        handover_data = absence.handover_recommendations_json or {}
        tasks_list = handover_data.get("tasks", [])

        return {
            "absence_id": str(absence.id),
            "absent_user_id": str(absence.user_id),
            "absent_user_name": user_name,
            "start_date": absence.start_date.isoformat(),
            "end_date": absence.end_date.isoformat(),
            "reason": absence.reason,
            "status": absence.status.value,
            "tasks_count": len(tasks_list),
            "handover_tasks": tasks_list,
        }


