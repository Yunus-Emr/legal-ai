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
    Auth: ws://host/ws/chat/{session_id}?token={jwt_access_token}
    Mesaj formatı: { "type": "message", "query": "..." }
    """
    # ── JWT Doğrulama ────────────────────────────────────────
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=1008, reason="Unauthorized: token gerekli")
        return
    try:
        from jose import jwt as _jwt, JWTError
        from app.services.auth_service import SECRET_KEY, ALGORITHM
        payload = _jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") == "refresh":
            raise ValueError("Refresh token ile WS auth olmaz")
        ws_user_id = payload.get("sub")
        if not ws_user_id:
            raise ValueError("sub claim yok")
    except Exception as e:
        logger.warning(f"[WS] Geçersiz token: {e}")
        await websocket.close(code=1008, reason="Unauthorized: geçersiz token")
        return
    # ─────────────────────────────────────────────────────────

    await websocket.accept()
    _connections[session_id] = websocket
    logger.info(f"[WS] Bağlantı: {session_id} user={ws_user_id}")

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
    Belge işleme durumu için WebSocket.
    DB üzerinden document statüsünü anlık olarak okur.
    """
    await websocket.accept()
    logger.info(f"[WS] Processing izleme: {doc_id}")
    
    from app.services.document_service import document_service
    import asyncio

    try:
        while True:
            status_data = await document_service.get_status(doc_id)
            if not status_data:
                await websocket.send_json({"progress": 100, "status": "not_found", "message": "Doküman bulunamadı"})
                break

            status = status_data["status"]
            if status == "processing":
                await websocket.send_json({"progress": 50, "status": "processing", "message": "İşleniyor..."})
            elif status == "indexed":
                await websocket.send_json({
                    "progress": 100, 
                    "status": "indexed", 
                    "message": "Tamamlandı",
                    "chunk_count": status_data.get("chunk_count", 0)
                })
                break
            elif status == "error":
                await websocket.send_json({"progress": 100, "status": "error", "message": "Hata oluştu"})
                break
            
            await asyncio.sleep(1.0)
    except WebSocketDisconnect:
        logger.info(f"[WS] İzleme bağlantısı koptu: {doc_id}")
    except Exception as e:
        logger.warning(f"[WS] İzleme bağlantısı hatası: {e}")
        try:
            await websocket.close()
        except Exception:
            pass
