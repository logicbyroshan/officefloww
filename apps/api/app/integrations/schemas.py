from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class GoogleSheetsImportRequest(BaseModel):
    entity_type: str  # CLIENTS, STOCK_ITEMS, HISTORICAL_ORDERS
    rows: List[Dict[str, Any]]


class GoogleSheetsImportSummary(BaseModel):
    entity_type: str
    total_rows: int
    imported_count: int
    skipped_count: int
    errors: List[str] = []


class TrelloMigrationRequest(BaseModel):
    board_name: str
    lists: List[Dict[str, Any]]
    cards: List[Dict[str, Any]]
    members: List[Dict[str, Any]] = []


class TrelloMigrationSummary(BaseModel):
    board_name: str
    tasks_imported: int
    comments_imported: int
    members_mapped: int
    errors: List[str] = []
