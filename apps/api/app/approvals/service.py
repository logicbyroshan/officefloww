import uuid
from datetime import datetime, timezone
from typing import List, Optional, Tuple
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.app.core.exceptions import EntityNotFoundError, BusinessRuleViolationError
from apps.api.app.approvals.models import Approval, ApprovalStatus
from apps.api.app.files.models import FileVersion, FileApprovalStatus
from apps.api.app.audit.models import AuditLog


class ApprovalService:
    @staticmethod
    async def request_approval(
        db: AsyncSession,
        order_id: uuid.UUID,
        user_id: uuid.UUID,
        order_item_id: Optional[uuid.UUID] = None,
        workflow_step_instance_id: Optional[uuid.UUID] = None,
        file_version_id: Optional[uuid.UUID] = None,
        comments: Optional[str] = None,
    ) -> Approval:
        if file_version_id:
            version = await db.scalar(select(FileVersion).where(FileVersion.id == file_version_id))
            if not version:
                raise EntityNotFoundError("FileVersion", file_version_id)
            version.approval_state = FileApprovalStatus.PENDING_REVIEW

        approval = Approval(
            order_id=order_id,
            order_item_id=order_item_id,
            workflow_step_instance_id=workflow_step_instance_id,
            file_version_id=file_version_id,
            requested_by_id=user_id,
            status=ApprovalStatus.PENDING,
            comments=comments,
        )
        db.add(approval)

        audit = AuditLog(
            actor_id=user_id,
            action="APPROVAL_REQUESTED",
            entity="Approval",
            entity_id=str(approval.id),
            new_values_json={
                "order_id": str(order_id),
                "file_version_id": str(file_version_id) if file_version_id else None,
                "status": ApprovalStatus.PENDING.value,
            },
            reason="Approval requested for artwork / production step",
        )
        db.add(audit)

        await db.commit()
        await db.refresh(approval)
        return approval

    @staticmethod
    async def decide_approval(
        db: AsyncSession,
        approval_id: uuid.UUID,
        user_id: uuid.UUID,
        decision: ApprovalStatus,
        comments: Optional[str] = None,
    ) -> Approval:
        approval = await db.scalar(select(Approval).where(Approval.id == approval_id))
        if not approval:
            raise EntityNotFoundError("Approval", approval_id)
        if approval.status != ApprovalStatus.PENDING:
            raise BusinessRuleViolationError(f"Approval is already finalized with status: {approval.status.value}")

        approval.status = decision
        approval.approved_by_id = user_id
        approval.responded_at = datetime.now(timezone.utc)
        if comments:
            approval.comments = f"{approval.comments or ''}\nDecision notes: {comments}".strip()

        # Update linked FileVersion state
        if approval.file_version_id:
            version = await db.scalar(select(FileVersion).where(FileVersion.id == approval.file_version_id))
            if version:
                if decision == ApprovalStatus.APPROVED:
                    version.approval_state = FileApprovalStatus.APPROVED
                elif decision == ApprovalStatus.REJECTED:
                    version.approval_state = FileApprovalStatus.REJECTED
                elif decision == ApprovalStatus.CHANGES_REQUESTED:
                    version.approval_state = FileApprovalStatus.DRAFT

        # If approved and tied to a workflow step, advance it!
        if decision == ApprovalStatus.APPROVED and approval.workflow_step_instance_id:
            from apps.api.app.workflows.models import WorkflowStepInstance, StepStatus
            step_inst = await db.scalar(
                select(WorkflowStepInstance).where(
                    WorkflowStepInstance.id == approval.workflow_step_instance_id
                )
            )
            if step_inst and step_inst.status in (StepStatus.READY, StepStatus.IN_PROGRESS, StepStatus.WAITING):
                from apps.api.app.workflows.service import WorkflowService
                await WorkflowService.advance_workflow_after_step_completed(db, step_inst)

        # Audit record
        audit = AuditLog(
            actor_id=user_id,
            action=f"APPROVAL_{decision.value}",
            entity="Approval",
            entity_id=str(approval.id),
            old_values_json={"status": ApprovalStatus.PENDING.value},
            new_values_json={"status": decision.value, "comments": comments},
            reason=f"Approval decision made: {decision.value}",
        )
        db.add(audit)

        await db.commit()
        await db.refresh(approval)
        return approval

    @staticmethod
    async def list_approvals(
        db: AsyncSession,
        order_id: Optional[uuid.UUID] = None,
        status: Optional[ApprovalStatus] = None,
    ) -> List[Approval]:
        query = select(Approval)
        if order_id:
            query = query.where(Approval.order_id == order_id)
        if status:
            query = query.where(Approval.status == status)
        query = query.order_by(Approval.requested_at.desc())
        result = await db.execute(query)
        return list(result.scalars().all())
