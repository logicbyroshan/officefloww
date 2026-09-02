from datetime import datetime, timezone
from typing import Any, Dict, List
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.app.ai.tools import ManagementAITools
from apps.api.app.ai.schemas import AIQueryRequest, AIQueryResponse, DailyBriefingResponse


class ManagementAIAssistant:
    @staticmethod
    async def process_query(db: AsyncSession, request: AIQueryRequest) -> AIQueryResponse:
        q_lower = request.query.lower()
        intent = "GENERAL"
        answer = ""
        evidence = {}
        recommendations = []

        if "risk" in q_lower or "delay" in q_lower or "attention" in q_lower or "block" in q_lower:
            intent = "ORDERS_AT_RISK"
            risks = await ManagementAITools.get_orders_at_risk(db)
            evidence = {"orders_at_risk": risks}
            if risks:
                answer = f"Found {len(risks)} order(s) currently at risk due to blocked operational tasks."
                recommendations.append("Review blocked tasks with production supervisor.")
            else:
                answer = "All active orders are progressing on schedule without critical blockers."

        elif "stock" in q_lower or "material" in q_lower or "run out" in q_lower or "shortage" in q_lower:
            intent = "LOW_STOCK"
            low_stock = await ManagementAITools.get_low_stock(db)
            evidence = {"low_stock_items": low_stock}
            if low_stock:
                answer = f"Attention: {len(low_stock)} raw material item(s) are at or below minimum threshold."
                for item in low_stock:
                    recommendations.append(f"Generate Purchase Recommendation for {item['item_name']}.")
            else:
                answer = "Raw material stock levels are healthy across all tracked items."

        elif "workload" in q_lower or "overload" in q_lower or "capacity" in q_lower or "employee" in q_lower:
            intent = "EMPLOYEE_WORKLOAD"
            workload = await ManagementAITools.get_employee_workload_summary(db)
            overloaded = [w for w in workload if w["status"] in ("OVERLOADED", "HIGH")]
            evidence = {"workload": workload}
            if overloaded:
                answer = f"{len(overloaded)} employee(s) have high or overloaded task queues."
                recommendations.append("Consider initiating task handover or reallocating tasks.")
            else:
                answer = "Employee workloads are evenly distributed within normal shift capacity."

        elif "labour" in q_lower or "worker" in q_lower or "fitting" in q_lower or "quality" in q_lower:
            intent = "LABOUR_PERFORMANCE"
            labour_perf = await ManagementAITools.get_labour_performance_summary(db)
            evidence = {"labour_performance": labour_perf}
            answer = f"Retrieved performance history across {len(labour_perf)} registered outside contractors."

        elif "payment" in q_lower or "owe" in q_lower or "money" in q_lower or "invoice" in q_lower:
            intent = "PENDING_PAYMENTS"
            pending = await ManagementAITools.get_pending_payments_summary(db)
            evidence = pending
            answer = f"There are {pending['pending_invoices_count']} pending client invoice(s) totaling INR {pending['total_outstanding_amount']:,.2f}."

        else:
            intent = "GENERAL_SUMMARY"
            answer = (
                "OfficeFloww AI Management Assistant is ready. You can inquire about orders at risk, "
                "raw material stock shortages, employee workloads, contractor quality scores, or outstanding receivables."
            )

        return AIQueryResponse(
            query=request.query,
            intent_detected=intent,
            answer=answer,
            data_evidence=evidence,
            recommendations=recommendations,
        )

    @staticmethod
    async def generate_daily_briefing(db: AsyncSession) -> DailyBriefingResponse:
        today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        risks = await ManagementAITools.get_orders_at_risk(db)
        low_stock = await ManagementAITools.get_low_stock(db)
        workload = await ManagementAITools.get_employee_workload_summary(db)
        overloaded = [w for w in workload if w["status"] in ("OVERLOADED", "HIGH")]
        pending = await ManagementAITools.get_pending_payments_summary(db)

        actions = []
        if risks:
            actions.append(f"Clear blockers for {len(risks)} delayed order(s).")
        if low_stock:
            actions.append(f"Approve procurement for {len(low_stock)} depleted material(s).")
        if overloaded:
            actions.append(f"Rebalance tasks for {len(overloaded)} overloaded operator(s).")

        summary = (
            f"Daily Briefing for {today_str}: {len(risks)} orders at risk, "
            f"{len(low_stock)} low stock alerts, and INR {pending['total_outstanding_amount']:,.2f} in outstanding invoices."
        )

        return DailyBriefingResponse(
            date=today_str,
            summary=summary,
            orders_at_risk=risks,
            low_stock_alerts=low_stock,
            overloaded_employees=overloaded,
            pending_receivables_inr=pending["total_outstanding_amount"],
            action_items=actions,
        )
