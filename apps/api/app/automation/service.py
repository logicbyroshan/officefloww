import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.app.core.exceptions import (
    BusinessRuleViolationError,
    EntityNotFoundError,
)
from apps.api.app.automation.models import (
    AutomationRule,
    AutomationLog,
    AutomationStatus,
    IdempotencyRecord,
)
from apps.api.app.automation.schemas import AutomationRuleCreate


class AutomationService:
    @staticmethod
    async def create_rule(db: AsyncSession, data: AutomationRuleCreate) -> AutomationRule:
        rule = AutomationRule(
            name=data.name,
            description=data.description,
            trigger_event=data.trigger_event,
            conditions_json=data.conditions_json or {},
            actions_json=data.actions_json or {},
            is_active=data.is_active,
        )
        db.add(rule)
        await db.commit()
        await db.refresh(rule)
        return rule

    @staticmethod
    async def list_rules(db: AsyncSession) -> List[AutomationRule]:
        return list((await db.scalars(select(AutomationRule).order_by(AutomationRule.created_at.desc()))).all())

    @staticmethod
    async def list_logs(db: AsyncSession, limit: int = 50) -> List[AutomationLog]:
        query = select(AutomationLog).order_by(AutomationLog.created_at.desc()).limit(limit)
        return list((await db.scalars(query)).all())

    @staticmethod
    async def process_event(
        db: AsyncSession, event_name: str, payload: Dict[str, Any], idempotency_key: Optional[str] = None
    ) -> Dict[str, Any]:
        # 1. Idempotency Check
        if idempotency_key:
            existing = await db.scalar(
                select(IdempotencyRecord).where(IdempotencyRecord.idempotency_key == idempotency_key)
            )
            if existing:
                return {
                    "status": "IDEMPOTENT_SUPPRESSED",
                    "message": f"Event {event_name} already processed under key {idempotency_key}.",
                    "cached_response": existing.response_json,
                }

        # 2. Query matching active rules
        rules = (
            await db.scalars(
                select(AutomationRule).where(
                    AutomationRule.trigger_event == event_name,
                    AutomationRule.is_active == True,
                )
            )
        ).all()

        actions_taken = []
        executed_rules_count = 0

        for rule in rules:
            conditions = rule.conditions_json or {}
            conditions_met = True

            # Evaluate simple key-value condition equality
            for cond_key, cond_val in conditions.items():
                if payload.get(cond_key) != cond_val:
                    conditions_met = False
                    break

            if conditions_met:
                actions = rule.actions_json or {}
                actions_taken.append({
                    "rule_id": str(rule.id),
                    "rule_name": rule.name,
                    "actions": actions,
                })
                rule.execution_count += 1
                executed_rules_count += 1

                log = AutomationLog(
                    rule_id=rule.id,
                    event_name=event_name,
                    idempotency_key=idempotency_key,
                    status=AutomationStatus.SUCCESS,
                    payload_json=payload,
                    actions_executed_json=actions,
                )
                db.add(log)

        # Record Idempotency key if provided
        result_payload = {
            "event_name": event_name,
            "rules_matched": len(rules),
            "rules_executed": executed_rules_count,
            "actions": actions_taken,
            "processed_at": datetime.now(timezone.utc).isoformat(),
        }

        if idempotency_key:
            record = IdempotencyRecord(
                idempotency_key=idempotency_key,
                scope=event_name,
                response_json=result_payload,
            )
            db.add(record)

        await db.commit()
        return result_payload
