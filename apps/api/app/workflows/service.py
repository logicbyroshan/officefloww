import uuid
from datetime import datetime, timezone
from typing import List, Optional, Tuple
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from apps.api.app.core.exceptions import EntityNotFoundError, ConflictError, WorkflowTransitionError
from apps.api.app.workflows.models import (
    WorkflowTemplate,
    WorkflowStepTemplate,
    WorkflowStepDependency,
    WorkflowInstance,
    WorkflowStepInstance,
    WorkflowStepInstanceDependency,
    WorkflowStatus,
    StepStatus,
    StepType,
)
from apps.api.app.workflows.schemas import WorkflowTemplateCreate


class WorkflowService:
    @staticmethod
    async def list_templates(db: AsyncSession) -> List[WorkflowTemplate]:
        query = select(WorkflowTemplate).options(
            selectinload(WorkflowTemplate.step_templates).selectinload(WorkflowStepTemplate.dependencies)
        ).order_by(WorkflowTemplate.name.asc())
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_template(db: AsyncSession, template_id: uuid.UUID) -> WorkflowTemplate:
        query = (
            select(WorkflowTemplate)
            .options(
                selectinload(WorkflowTemplate.step_templates).selectinload(WorkflowStepTemplate.dependencies)
            )
            .where(WorkflowTemplate.id == template_id)
        )
        result = await db.execute(query)
        template = result.scalar_one_or_none()
        if not template:
            raise EntityNotFoundError("WorkflowTemplate", template_id)
        return template

    @staticmethod
    async def create_template(db: AsyncSession, data: WorkflowTemplateCreate) -> WorkflowTemplate:
        existing = await db.scalar(
            select(WorkflowTemplate).where(WorkflowTemplate.code == data.code.upper().strip())
        )
        if existing:
            raise ConflictError(f"Workflow template with code '{data.code}' already exists.")

        template = WorkflowTemplate(
            code=data.code.upper().strip(),
            name=data.name.strip(),
            description=data.description,
            is_active=data.is_active,
        )
        db.add(template)
        await db.flush()

        # Create steps
        created_steps: List[WorkflowStepTemplate] = []
        for s in data.steps:
            step = WorkflowStepTemplate(
                template_id=template.id,
                name=s.name,
                step_type=s.step_type,
                sequence_order=s.sequence_order,
                required_role=s.required_role,
                is_optional=s.is_optional,
                instructions=s.instructions,
                estimated_duration_minutes=s.estimated_duration_minutes,
                sla_hours=s.sla_hours,
                required_files_json=s.required_files_json or [],
                required_inputs_json=s.required_inputs_json or {},
                completion_rules_json=s.completion_rules_json or {},
                metadata_json=s.metadata_json or {},
            )
            db.add(step)
            created_steps.append(step)

        await db.flush()

        # Link dependencies based on step indices
        for idx, s in enumerate(data.steps):
            if s.depends_on_indices:
                curr_step = created_steps[idx]
                for dep_idx in s.depends_on_indices:
                    if 0 <= dep_idx < len(created_steps):
                        dep = WorkflowStepDependency(
                            step_id=curr_step.id,
                            depends_on_step_id=created_steps[dep_idx].id,
                        )
                        db.add(dep)

        await db.commit()
        return await WorkflowService.get_template(db, template.id)

    @staticmethod
    async def instantiate_workflow(
        db: AsyncSession,
        order_id: uuid.UUID,
        order_item_id: uuid.UUID,
        template_id: uuid.UUID,
    ) -> WorkflowInstance:
        template = await WorkflowService.get_template(db, template_id)

        wf_instance = WorkflowInstance(
            order_item_id=order_item_id,
            template_id=template.id,
            status=WorkflowStatus.IN_PROGRESS,
            started_at=datetime.now(timezone.utc),
        )
        db.add(wf_instance)
        await db.flush()

        # Step template id -> step instance mapping
        template_to_instance_map = {}
        step_instances: List[WorkflowStepInstance] = []

        for step_tmpl in template.step_templates:
            step_inst = WorkflowStepInstance(
                workflow_instance_id=wf_instance.id,
                step_template_id=step_tmpl.id,
                step_type=step_tmpl.step_type,
                name=step_tmpl.name,
                sequence_order=step_tmpl.sequence_order,
                status=StepStatus.PENDING,
                required_role=step_tmpl.required_role,
                notes=step_tmpl.instructions,
            )
            db.add(step_inst)
            step_instances.append(step_inst)
            template_to_instance_map[step_tmpl.id] = step_inst

        await db.flush()

        # Clone step instance dependencies
        for step_tmpl in template.step_templates:
            curr_inst = template_to_instance_map[step_tmpl.id]
            for dep in step_tmpl.dependencies:
                if dep.depends_on_step_id in template_to_instance_map:
                    dep_inst = template_to_instance_map[dep.depends_on_step_id]
                    inst_dep = WorkflowStepInstanceDependency(
                        step_instance_id=curr_inst.id,
                        depends_on_step_instance_id=dep_inst.id,
                    )
                    db.add(inst_dep)

        await db.flush()

        # Determine initially READY steps (those with zero dependencies)
        # Import TaskService dynamically or lazily to avoid circular imports
        from apps.api.app.tasks.service import TaskService

        for step_inst in step_instances:
            # Query dependencies of this step_inst
            deps = await db.scalars(
                select(WorkflowStepInstanceDependency).where(
                    WorkflowStepInstanceDependency.step_instance_id == step_inst.id
                )
            )
            dep_list = deps.all()
            if len(dep_list) == 0:
                # No upstream dependencies -> Ready immediately!
                step_inst.status = StepStatus.READY
                step_inst.started_at = datetime.now(timezone.utc)
                # Generate corresponding task
                await TaskService.generate_task_for_step(db, order_id, order_item_id, wf_instance.id, step_inst)

        return wf_instance

    @staticmethod
    async def advance_workflow_after_step_completed(
        db: AsyncSession,
        step_instance: WorkflowStepInstance,
    ) -> None:
        step_instance.status = StepStatus.COMPLETED
        step_instance.completed_at = datetime.now(timezone.utc)
        await db.flush()

        # Find downstream steps in this workflow instance that depend on step_instance
        downstream_deps = (
            await db.scalars(
                select(WorkflowStepInstanceDependency).where(
                    WorkflowStepInstanceDependency.depends_on_step_instance_id == step_instance.id
                )
            )
        ).all()

        from apps.api.app.tasks.service import TaskService

        for dep in downstream_deps:
            downstream_step = await db.scalar(
                select(WorkflowStepInstance)
                .options(selectinload(WorkflowStepInstance.workflow_instance))
                .where(WorkflowStepInstance.id == dep.step_instance_id)
            )
            if not downstream_step or downstream_step.status != StepStatus.PENDING:
                continue

            # Check if ALL dependencies of downstream_step are completed
            all_deps = (
                await db.scalars(
                    select(WorkflowStepInstanceDependency).where(
                        WorkflowStepInstanceDependency.step_instance_id == downstream_step.id
                    )
                )
            ).all()

            all_satisfied = True
            for d in all_deps:
                upstream = await db.scalar(
                    select(WorkflowStepInstance).where(
                        WorkflowStepInstance.id == d.depends_on_step_instance_id
                    )
                )
                if not upstream or upstream.status != StepStatus.COMPLETED:
                    all_satisfied = False
                    break

            if all_satisfied:
                downstream_step.status = StepStatus.READY
                downstream_step.started_at = datetime.now(timezone.utc)
                wf_inst = downstream_step.workflow_instance
                # Generate task for the newly ready downstream step
                from apps.api.app.orders.models import OrderItem
                item = await db.scalar(select(OrderItem).where(OrderItem.id == wf_inst.order_item_id))
                if item:
                    await TaskService.generate_task_for_step(
                        db, item.order_id, item.id, wf_inst.id, downstream_step
                    )

        # Check if entire workflow instance is complete
        all_wf_steps = (
            await db.scalars(
                select(WorkflowStepInstance).where(
                    WorkflowStepInstance.workflow_instance_id == step_instance.workflow_instance_id
                )
            )
        ).all()

        if all(s.status in (StepStatus.COMPLETED, StepStatus.SKIPPED) for s in all_wf_steps):
            wf = await db.scalar(
                select(WorkflowInstance).where(WorkflowInstance.id == step_instance.workflow_instance_id)
            )
            if wf:
                wf.status = WorkflowStatus.COMPLETED
                wf.completed_at = datetime.now(timezone.utc)

                # Update OrderItem status
                from apps.api.app.orders.models import OrderItem, OrderItemStatus
                item = await db.scalar(select(OrderItem).where(OrderItem.id == wf.order_item_id))
                if item:
                    item.status = OrderItemStatus.COMPLETED
