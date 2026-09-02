import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from sqlalchemy import Boolean, DateTime, Enum as SAEnum, ForeignKey, Integer, String, Text, Uuid, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from apps.api.app.core.database import Base, TimestampMixin, UUIDPrimaryKeyMixin
from apps.api.app.users.models import UserRole


class StepType(str, Enum):
    DATA = "DATA"
    PHOTOGRAPHY = "PHOTOGRAPHY"
    DESIGN = "DESIGN"
    APPROVAL = "APPROVAL"
    PRINTING = "PRINTING"
    PRODUCTION = "PRODUCTION"
    FITTING = "FITTING"
    PACKING = "PACKING"
    DISPATCH = "DISPATCH"
    BILLING = "BILLING"
    PAYMENT = "PAYMENT"
    CUSTOM = "CUSTOM"


class WorkflowStatus(str, Enum):
    PENDING = "PENDING"
    READY = "READY"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class StepStatus(str, Enum):
    PENDING = "PENDING"
    READY = "READY"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    WAITING = "WAITING"
    BLOCKED = "BLOCKED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    SKIPPED = "SKIPPED"


class WorkflowTemplate(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "workflow_templates"

    code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    step_templates: Mapped[List["WorkflowStepTemplate"]] = relationship(
        "WorkflowStepTemplate",
        back_populates="template",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="WorkflowStepTemplate.sequence_order",
    )


class WorkflowStepTemplate(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "workflow_step_templates"

    template_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("workflow_templates.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    step_type: Mapped[StepType] = mapped_column(
        SAEnum(StepType, native_enum=False, length=50),
        nullable=False,
    )
    sequence_order: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    required_role: Mapped[Optional[UserRole]] = mapped_column(
        SAEnum(UserRole, native_enum=False, length=50),
        nullable=True,
    )
    is_optional: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    instructions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    estimated_duration_minutes: Mapped[int] = mapped_column(Integer, default=60, nullable=False)
    sla_hours: Mapped[Optional[int]] = mapped_column(Integer, default=24, nullable=True)

    required_files_json: Mapped[Optional[List[str]]] = mapped_column(JSON, default=list, nullable=True)
    required_inputs_json: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, default=dict, nullable=True)
    completion_rules_json: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, default=dict, nullable=True)
    metadata_json: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, default=dict, nullable=True)

    template: Mapped["WorkflowTemplate"] = relationship("WorkflowTemplate", back_populates="step_templates")
    dependencies: Mapped[List["WorkflowStepDependency"]] = relationship(
        "WorkflowStepDependency",
        foreign_keys="WorkflowStepDependency.step_id",
        back_populates="step",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class WorkflowStepDependency(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "workflow_step_dependencies"

    step_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("workflow_step_templates.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    depends_on_step_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("workflow_step_templates.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    step: Mapped["WorkflowStepTemplate"] = relationship(
        "WorkflowStepTemplate",
        foreign_keys=[step_id],
        back_populates="dependencies",
    )


class WorkflowInstance(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "workflow_instances"

    order_item_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), unique=True, index=True, nullable=False)
    template_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("workflow_templates.id", ondelete="RESTRICT"),
        nullable=False,
    )
    status: Mapped[WorkflowStatus] = mapped_column(
        SAEnum(WorkflowStatus, native_enum=False, length=50),
        default=WorkflowStatus.PENDING,
        nullable=False,
    )
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    step_instances: Mapped[List["WorkflowStepInstance"]] = relationship(
        "WorkflowStepInstance",
        back_populates="workflow_instance",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="WorkflowStepInstance.sequence_order",
    )


class WorkflowStepInstance(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "workflow_step_instances"

    workflow_instance_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("workflow_instances.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    step_template_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid(as_uuid=True), nullable=True)
    step_type: Mapped[StepType] = mapped_column(
        SAEnum(StepType, native_enum=False, length=50),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    sequence_order: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[StepStatus] = mapped_column(
        SAEnum(StepStatus, native_enum=False, length=50),
        default=StepStatus.PENDING,
        nullable=False,
    )
    required_role: Mapped[Optional[UserRole]] = mapped_column(
        SAEnum(UserRole, native_enum=False, length=50),
        nullable=True,
    )
    assigned_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid(as_uuid=True), nullable=True)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    workflow_instance: Mapped["WorkflowInstance"] = relationship("WorkflowInstance", back_populates="step_instances")
    dependencies: Mapped[List["WorkflowStepInstanceDependency"]] = relationship(
        "WorkflowStepInstanceDependency",
        foreign_keys="WorkflowStepInstanceDependency.step_instance_id",
        back_populates="step_instance",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class WorkflowStepInstanceDependency(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "workflow_step_instance_dependencies"

    step_instance_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("workflow_step_instances.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    depends_on_step_instance_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("workflow_step_instances.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    step_instance: Mapped["WorkflowStepInstance"] = relationship(
        "WorkflowStepInstance",
        foreign_keys=[step_instance_id],
        back_populates="dependencies",
    )
