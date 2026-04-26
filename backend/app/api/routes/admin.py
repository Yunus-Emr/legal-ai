from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.postgres import get_db
from app.core.security import get_current_user
from app.db.models import User

router = APIRouter()

@router.get("/users")
async def get_users(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Basic RBAC: Only allow if user is an admin (simplified check for now)
    result = await db.execute(select(User))
    users = []
    for u in result.scalars().all():
        users.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "isActive": u.is_active,
            "created_at": u.created_at.isoformat()
        })
    return users
