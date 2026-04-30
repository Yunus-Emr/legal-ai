from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Any, Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.postgres import get_db
from app.core.security import get_current_user
from app.db.models import User, UserRole

router = APIRouter()

# ── RBAC Guard ─────────────────────────────────────────────────────────────
async def require_admin(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    result = await db.execute(
        select(UserRole.role).where(UserRole.user_id == current_user.id)
    )
    roles = [r for (r,) in result.all()]
    if "admin" not in roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin yetkisi gerekli")
    return current_user


# ── Users ──────────────────────────────────────────────────────────────────
@router.get("/users")
async def get_users(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User))
    users = []
    for u in result.scalars().all():
        # Get role
        role_result = await db.execute(select(UserRole.role).where(UserRole.user_id == u.id))
        roles = [r for (r,) in role_result.all()]
        users.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": "admin" if "admin" in roles else "user",
            "isActive": u.is_active,
            "created_at": u.created_at.isoformat(),
        })
    return users


class UserUpdate(BaseModel):
    is_active: Optional[bool] = None
    role: Optional[str] = None


@router.patch("/users/{user_id}")
async def update_user(
    user_id: str,
    update: UserUpdate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")

    if update.is_active is not None:
        user.is_active = update.is_active

    if update.role is not None:
        # Remove existing roles and re-assign
        await db.execute(
            __import__("sqlalchemy", fromlist=["delete"]).delete(UserRole).where(UserRole.user_id == user_id)
        )
        db.add(UserRole(user_id=user_id, role=update.role))

    await db.commit()
    return {"updated": user_id}


# ── System Config ──────────────────────────────────────────────────────────
_config_store: Dict[str, Any] = {
    "llm_model": "TinyLlama/TinyLlama-1.1B-Chat-v1.0",
    "llm_provider": "huggingface",
    "temperature": 0.1,
    "max_tokens": 1024,
    "chunk_size": 512,
    "chunk_overlap": 64,
    "top_k": 5,
    "embedding_model": "intfloat/e5-large",
}


@router.get("/config")
async def get_config(admin: User = Depends(require_admin)):
    return _config_store


class ConfigUpdate(BaseModel):
    values: Dict[str, Any]


@router.post("/config")
async def update_config(body: ConfigUpdate, admin: User = Depends(require_admin)):
    _config_store.update(body.values)
    return {"updated": list(body.values.keys())}

