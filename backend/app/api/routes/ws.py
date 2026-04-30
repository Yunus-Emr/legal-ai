"""
WebSocket Endpoint — Gerçek zamanlı chat ve doküman işleme durumu
"""
import asyncio
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.core.logger import get_logger

logger = get_logger(__name__)
router = APIRouter()

# Active connections map: session_id -> WebSocket
_connections: dict[str, WebSocket] = {}


@router.websocket("/ws/chat/{session_id}")
async def ws_chat(websocket: WebSocket, session_id: str):
    """
    Chat WebSocket — istemci bağlanır, mesaj gönderir, yanıt alır.
    Mesaj formatı: { "type": "message", "query": "..." }
    """
    await websocket.accept()
    _connections[session_id] = websocket
    logger.info(f"[WS] Bağlantı: {session_id}")

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                await websocket.send_json({"type": "error", "message": "Geçersiz JSON"})
                continue

            if data.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
                continue

            if data.get("type") == "message":
                query = data.get("query", "").strip()
                if not query:
                    continue

                # Send typing indicator
                await websocket.send_json({"type": "typing", "session_id": session_id})

                try:
                    from app.services.rag_service import rag_service
                    result = await rag_service.ask(query=query, session_id=session_id)
                    await websocket.send_json({
                        "type": "answer",
                        "answer": result["answer"],
                        "sources": result["sources"],
                        "session_id": session_id,
                    })
                except Exception as e:
                    logger.error(f"[WS] RAG hatası: {e}")
                    await websocket.send_json({"type": "error", "message": str(e)})

    except WebSocketDisconnect:
        logger.info(f"[WS] Bağlantı kesildi: {session_id}")
    finally:
        _connections.pop(session_id, None)


@router.websocket("/ws/processing/{doc_id}")
async def ws_processing(websocket: WebSocket, doc_id: str):
    """
    Doküman işleme durumu WebSocket.
    Sunucu, belge chunk → embed → index tamamlanana kadar progress event'leri gönderir.
    """
    await websocket.accept()
    logger.info(f"[WS-Processing] Bağlantı: {doc_id}")

    try:
        # Poll document status from DB every second and push updates
        from app.services.document_service import document_service
        stages = [
            ("parsing",   10, 0.5),
            ("chunking",  30, 0.8),
            ("embedding", 60, 1.5),
            ("indexing",  85, 1.0),
        ]

        for stage, progress, delay in stages:
            await websocket.send_json({
                "type": "progress",
                "doc_id": doc_id,
                "stage": stage,
                "progress": progress,
            })
            await asyncio.sleep(delay)

        # Check actual status
        status = await document_service.get_status(doc_id)
        if status:
            final_stage = status.get("status", "done")
            await websocket.send_json({
                "type": "complete",
                "doc_id": doc_id,
                "stage": final_stage,
                "progress": 100,
                "chunk_count": status.get("chunk_count", 0),
            })
        else:
            await websocket.send_json({
                "type": "complete",
                "doc_id": doc_id,
                "stage": "done",
                "progress": 100,
            })

    except WebSocketDisconnect:
        logger.info(f"[WS-Processing] Bağlantı kesildi: {doc_id}")
    except Exception as e:
        logger.error(f"[WS-Processing] Hata: {e}")
        try:
            await websocket.send_json({"type": "error", "doc_id": doc_id, "message": str(e)})
        except Exception:
            pass
