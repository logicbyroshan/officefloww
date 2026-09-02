import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.app.tasks.models import Task, TaskStatus, TaskPriority, TaskComment
from apps.api.app.integrations.schemas import TrelloMigrationRequest, TrelloMigrationSummary


class TrelloMigrator:
    @staticmethod
    async def migrate_trello_board(
        db: AsyncSession, request: TrelloMigrationRequest, user_id: uuid.UUID
    ) -> TrelloMigrationSummary:
        tasks_count = 0
        comments_count = 0
        errors = []

        # Create map of lists to statuses
        list_map = {}
        for l in request.lists:
            name_lower = l.get("name", "").lower()
            if "done" in name_lower or "complete" in name_lower:
                list_map[l.get("id")] = TaskStatus.COMPLETED
            elif "progress" in name_lower or "doing" in name_lower:
                list_map[l.get("id")] = TaskStatus.IN_PROGRESS
            elif "block" in name_lower:
                list_map[l.get("id")] = TaskStatus.BLOCKED
            else:
                list_map[l.get("id")] = TaskStatus.READY

        for card in request.cards:
            title = card.get("name", "Untitled Trello Card")
            desc = card.get("desc", "")
            list_id = card.get("idList")
            task_status = list_map.get(list_id, TaskStatus.READY)

            task_code = f"TRL-{uuid.uuid4().hex[:6].upper()}"
            task = Task(
                task_code=task_code,
                title=title,
                description=desc or f"Imported from Trello Board: {request.board_name}",
                instructions=f"Original Trello Card ID: {card.get('id')}",
                status=task_status,
                priority=TaskPriority.NORMAL,
                assigned_user_id=user_id,
            )
            db.add(task)
            await db.flush()
            tasks_count += 1

            # Check comments / checklists
            for comment_text in card.get("comments", []):
                cmt = TaskComment(
                    task_id=task.id,
                    user_id=user_id,
                    comment=comment_text if isinstance(comment_text, str) else comment_text.get("text", ""),
                )
                db.add(cmt)
                comments_count += 1

        await db.commit()
        return TrelloMigrationSummary(
            board_name=request.board_name,
            tasks_imported=tasks_count,
            comments_imported=comments_count,
            members_mapped=len(request.members),
            errors=errors,
        )
