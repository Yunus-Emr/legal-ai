from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Any, Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
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
    """N+1 sorunu düzeltildi — tek JOIN sorgusuyla kullanıcı+rol çekiliyor."""
    result = await db.execute(
        select(User, UserRole.role)
        .outerjoin(UserRole, User.id == UserRole.user_id)
        .order_by(User.created_at.desc())
    )
    # Bir kullanıcının birden fazla rolü olabilir — dict ile deduplicate et
    users_map: Dict[str, Dict] = {}
    for user, role in result.all():
        if user.id not in users_map:
            users_map[user.id] = {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "roles": [],
                "isActive": user.is_active,
                "created_at": user.created_at.isoformat(),
            }
        if role:
            users_map[user.id]["roles"].append(role)

    # Role'ü tek string'e indir (admin varsa admin, yoksa user)
    users = []
    for u in users_map.values():
        u["role"] = "admin" if "admin" in u["roles"] else "user"
        del u["roles"]
        users.append(u)
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
        # Mevcut rolleri temizle ve yenisini ata — düzgün import ile
        await db.execute(delete(UserRole).where(UserRole.user_id == user_id))
        db.add(UserRole(user_id=user_id, role=update.role))

    await db.commit()
    return {"updated": user_id}


# ── System Config ───────────────────────────────────────────
DEFAULT_CONFIG = {
    "llm_model": "gpt-4o",
    "llm_provider": "openai",
    "temperature": 0.1,
    "max_tokens": 1024,
    "chunk_size": 512,
    "chunk_overlap": 64,
    "top_k": 5,
    "embedding_model": "text-embedding-3-small",
}

@router.get("/config")
async def get_config(admin: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    from app.db.models import SystemConfig
    result = await db.execute(select(SystemConfig))
    configs = result.scalars().all()

    config_dict = DEFAULT_CONFIG.copy()
    for c in configs:
        config_dict[c.key] = c.value

    return config_dict

class ConfigUpdate(BaseModel):
    values: Dict[str, Any]

@router.post("/config")
async def update_config(body: ConfigUpdate, admin: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    from app.db.models import SystemConfig
    from sqlalchemy.dialects.postgresql import insert

    for key, value in body.values.items():
        stmt = insert(SystemConfig).values(key=key, value=value)
        stmt = stmt.on_conflict_do_update(
            index_elements=['key'],
            set_=dict(value=stmt.excluded.value)
        )
        await db.execute(stmt)

    await db.commit()
    return {"updated": list(body.values.keys())}
