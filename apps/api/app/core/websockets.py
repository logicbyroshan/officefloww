from typing import Dict, List, Set
from fastapi import WebSocket
import logging

logger = logging.getLogger("officefloww")


class ConnectionManager:
    def __init__(self):
        # Map channel -> Set of WebSockets
        self.channels: Dict[str, Set[WebSocket]] = {}
        # Active connections
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Total clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        for channel, sockets in list(self.channels.items()):
            if websocket in sockets:
                sockets.remove(websocket)
                if not sockets:
                    del self.channels[channel]
        logger.info(f"WebSocket client disconnected. Remaining: {len(self.active_connections)}")

    def subscribe(self, websocket: WebSocket, channel: str):
        if channel not in self.channels:
            self.channels[channel] = set()
        self.channels[channel].add(websocket)
        logger.debug(f"Client subscribed to channel: {channel}")

    def unsubscribe(self, websocket: WebSocket, channel: str):
        if channel in self.channels and websocket in self.channels[channel]:
            self.channels[channel].remove(websocket)
            if not self.channels[channel]:
                del self.channels[channel]

    async def broadcast_to_channel(self, channel: str, message: dict):
        if channel in self.channels:
            disconnected = []
            for connection in self.channels[channel]:
                try:
                    await connection.send_json(message)
                except Exception:
                    disconnected.append(connection)
            for dead_conn in disconnected:
                self.disconnect(dead_conn)

    async def broadcast_all(self, message: dict):
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.append(connection)
        for dead_conn in disconnected:
            self.disconnect(dead_conn)


ws_manager = ConnectionManager()
