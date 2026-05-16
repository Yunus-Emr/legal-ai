"""
Repository — DB query abstraction layer
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, func, update
from app.db.models import Document, ChatHistory, QueryLog, User, Draft, AuditLog, UserRole
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
    """
    NOT: Bu repository şu an aktif kullanılmıyor.
    chat.py rotaları doğrudan db.add_all() ile ChatHistory kayıt atıyor.
    Gelecekteki refactoring'de bu sınıf kullanılacak.
    """
    def __init__(self, db: AsyncSession):
        self.db = db

    async def add_message(
        self, session_id: str, role: str, content: str
    ) -> ChatHistory:
        msg = ChatHistory(
            id=str(uuid.uuid4()),
            session_id=session_id,
            role=role,
            content=content,
        )
        self.db.add(msg)
        await self.db.flush()
        return msg

    async def get_history(self, session_id: str) -> List[ChatHistory]:
        result = await self.db.execute(
            select(ChatHistory)
            .where(ChatHistory.session_id == session_id)
            .order_by(ChatHistory.created_at)
        )
        return list(result.scalars().all())


class QueryLogRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def log(
        self,
        session_id: str,
        query: str,
        answer: str,
        response_time_ms: int,
    ) -> QueryLog:
        entry = QueryLog(
            id=str(uuid.uuid4()),
            session_id=session_id,
            query=query,
            answer=answer,
            response_time_ms=response_time_ms,
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
