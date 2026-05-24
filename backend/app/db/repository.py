"""
Repository — DB query abstraction layer

Tüm veritabanı sorguları bu modüldeki Repository sınıfları üzerinden yapılmalıdır.
Doğrudan db.add / db.execute çağrıları route katmanında olmamalıdır.
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, func, update, distinct
from app.db.models import Document, ChatHistory, QueryLog, User, Draft, AuditLog, UserRole, Matter
import uuid
from datetime import datetime


class DocumentRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: Dict[str, Any]) -> Document:
        doc = Document(**data)
        self.db.add(doc)
        await self.db.flush()
        return doc

    async def list_all(self) -> List[Document]:
        result = await self.db.execute(select(Document).order_by(Document.created_at.desc()))
        return list(result.scalars().all())

    async def get(self, doc_id: str) -> Optional[Document]:
        result = await self.db.execute(select(Document).where(Document.id == doc_id))
        return result.scalar_one_or_none()

    async def delete(self, doc_id: str) -> None:
        await self.db.execute(delete(Document).where(Document.id == doc_id))


class ChatRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def add_message(
        self, session_id: str, role: str, content: str, user_id: str
    ) -> ChatHistory:
        msg = ChatHistory(
            id=str(uuid.uuid4()),
            session_id=session_id,
            role=role,
            content=content,
            user_id=user_id,
        )
        self.db.add(msg)
        return msg

    async def get_recent_history(self, session_id: str, limit: int = 8) -> List[Dict[str, str]]:
        result = await self.db.execute(
            select(ChatHistory.role, ChatHistory.content)
            .where(ChatHistory.session_id == session_id)
            .order_by(ChatHistory.created_at.desc())
            .limit(limit)
        )
        return [{"role": r, "content": c} for r, c in reversed(result.all())]

    async def get_sessions_by_user(self, user_id: str) -> List[Dict[str, Any]]:
        result = await self.db.execute(
            select(ChatHistory.session_id, ChatHistory.created_at)
            .where(ChatHistory.user_id == user_id)
            .order_by(ChatHistory.created_at.desc())
        )
        sessions = []
        seen = set()
        for row in result.all():
            if row.session_id not in seen:
                seen.add(row.session_id)
                sessions.append({"session_id": row.session_id, "last_activity": row.created_at})
        return sessions

    async def get_full_history(self, session_id: str, user_id: str) -> List[Dict[str, Any]]:
        result = await self.db.execute(
            select(ChatHistory)
            .where((ChatHistory.session_id == session_id) & (ChatHistory.user_id == user_id))
            .order_by(ChatHistory.created_at.asc())
        )
        return [{"role": h.role, "content": h.content, "created_at": h.created_at} for h in result.scalars().all()]



class QueryLogRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def log(
        self,
        session_id: str,
        query: str,
        answer: str,
        response_time_ms: int,
        sources: Optional[List[Dict[str, Any]]] = None,
    ) -> QueryLog:
        entry = QueryLog(
            id=str(uuid.uuid4()),
            session_id=session_id,
            query=query,
            answer=answer,
            response_time_ms=response_time_ms,
            sources=sources or [],
        )
        self.db.add(entry)
        await self.db.flush()
        return entry

    async def get_stats(self) -> Dict[str, Any]:
        total = await self.db.execute(select(func.count(QueryLog.id)))
        avg_time = await self.db.execute(select(func.avg(QueryLog.response_time_ms)))
        return {
            "total_queries": total.scalar() or 0,
            "avg_response_time_ms": round(avg_time.scalar() or 0),
        }

class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: Dict[str, Any]) -> User:
        user = User(**data)
        self.db.add(user)
        await self.db.flush()
        return user

    async def get_by_email(self, email: str) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get(self, user_id: str) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

class DraftRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: Dict[str, Any]) -> Draft:
        draft = Draft(**data)
        self.db.add(draft)
        await self.db.flush()
        return draft

    async def list_by_user(self, user_id: str) -> List[Draft]:
        result = await self.db.execute(
            select(Draft).where(Draft.user_id == user_id).order_by(Draft.updated_at.desc())
        )
        return list(result.scalars().all())

    async def get(self, draft_id: str) -> Optional[Draft]:
        result = await self.db.execute(select(Draft).where(Draft.id == draft_id))
        return result.scalar_one_or_none()

    async def update(self, draft_id: str, updates: Dict[str, Any]) -> Optional[Draft]:
        updates["updated_at"] = datetime.utcnow()
        await self.db.execute(
            update(Draft).where(Draft.id == draft_id).values(**updates)
        )
        await self.db.flush()
        return await self.get(draft_id)

    async def delete(self, draft_id: str) -> None:
        await self.db.execute(delete(Draft).where(Draft.id == draft_id))
        await self.db.flush()


class AuditLogRepository:
    """Kullanıcı aksiyonlarını loglama — güvenlik ve uyumluluk için."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def log(
        self,
        action: str,
        user_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ) -> AuditLog:
        entry = AuditLog(
            id=str(uuid.uuid4()),
            user_id=user_id,
            action=action,
            details=details or {},
        )
        self.db.add(entry)
        await self.db.flush()
        return entry

    async def get_recent(
        self,
        limit: int = 100,
        user_id: Optional[str] = None,
    ) -> List[AuditLog]:
        stmt = (
            select(AuditLog)
            .order_by(AuditLog.created_at.desc())
            .limit(limit)
        )
        if user_id:
            stmt = stmt.where(AuditLog.user_id == user_id)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())


class MatterRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: Dict[str, Any]) -> Matter:
        matter = Matter(**data)
        self.db.add(matter)
        await self.db.flush()
        return matter

    async def list_all(self) -> List[Matter]:
        result = await self.db.execute(select(Matter).order_by(Matter.created_at.desc()))
        return list(result.scalars().all())

    async def list_by_user(self, user_id: str) -> List[Matter]:
        result = await self.db.execute(
            select(Matter).where(Matter.user_id == user_id).order_by(Matter.created_at.desc())
        )
        return list(result.scalars().all())

    async def get(self, id: str) -> Optional[Matter]:
        result = await self.db.execute(select(Matter).where(Matter.id == id))
        return result.scalar_one_or_none()

    async def update(self, id: str, updates: Dict[str, Any]) -> Optional[Matter]:
        await self.db.execute(
            update(Matter).where(Matter.id == id).values(**updates)
        )
        await self.db.flush()
        return await self.get(id)

    async def delete(self, id: str) -> None:
        await self.db.execute(delete(Matter).where(Matter.id == id))
        await self.db.flush()


# ── Dependency Injection Factory ──────────────────────────────────────────────
# Route'larda şu şekilde kullanın:
#
#   from app.db.repository import get_repositories
#   @router.post("/chat")
#   async def chat(repos = Depends(get_repositories), ...):
#       history = await repos.chat.get_recent_history(session_id)

class Repositories:
    """Tüm repository'leri tek bir nesne altında toplar — DI için."""
    def __init__(self, db: AsyncSession):
        self.document  = DocumentRepository(db)
        self.chat      = ChatRepository(db)
        self.query_log = QueryLogRepository(db)
        self.user      = UserRepository(db)
        self.draft     = DraftRepository(db)
        self.audit     = AuditLogRepository(db)
        self.matter    = MatterRepository(db)


async def get_repositories(db: AsyncSession) -> Repositories:  # type: ignore[return]
    """FastAPI Depends ile kullanılmak üzere repositories factory."""
    return Repositories(db)
