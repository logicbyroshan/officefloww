import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from apps.api.app.core.websockets import ws_manager

router = APIRouter(tags=["Realtime WebSockets"])


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            data_text = await websocket.receive_text()
            try:
                msg = json.loads(data_text)
                action = msg.get("action")
                channel = msg.get("channel")
                if action == "subscribe" and channel:
                    ws_manager.subscribe(websocket, channel)
                    await websocket.send_json({"status": "subscribed", "channel": channel})
                elif action == "unsubscribe" and channel:
                    ws_manager.unsubscribe(websocket, channel)
                    await websocket.send_json({"status": "unsubscribed", "channel": channel})
                elif action == "ping":
                    await websocket.send_json({"status": "pong"})
            except json.JSONDecodeError:
                await websocket.send_json({"error": "Invalid JSON format"})
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
