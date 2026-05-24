import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.db.postgres import get_db
from app.db.repository import MatterRepository, AuditLogRepository
from app.core.security import get_current_user
from app.db.models import User

router = APIRouter()

class MatterCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    client: str = Field(..., min_length=1, max_length=255)
    type: str = Field(..., min_length=1, max_length=100)
    status: Optional[str] = "Pending"
    risk: Optional[str] = "Low"
    attorney: Optional[str] = None
    due_date: Optional[str] = None

class MatterUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    client: Optional[str] = Field(None, min_length=1, max_length=255)
    type: Optional[str] = Field(None, min_length=1, max_length=100)
    status: Optional[str] = None
    risk: Optional[str] = None
    attorney: Optional[str] = None
    due_date: Optional[str] = None

class MatterResponse(BaseModel):
    id: str
    title: str
    client: str
    type: str
    status: str
    risk: str
    attorney: Optional[str] = None
    due_date: Optional[str] = None
    user_id: Optional[str] = None

    class Config:
        from_attributes = True

@router.get("/", response_model=List[MatterResponse])
async def list_matters(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    repo = MatterRepository(db)
    # Return all matters for admin, user-specific for regular users
    from app.db.models import UserRole
    from sqlalchemy import select
    res = await db.execute(select(UserRole.role).where(UserRole.user_id == current_user.id))
    roles = [r for (r,) in res.all()]
    if "admin" in roles:
        return await repo.list_all()
    else:
        return await repo.list_by_user(current_user.id)

@router.post("/", response_model=MatterResponse)
async def create_matter(matter_in: MatterCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    repo = MatterRepository(db)
    audit = AuditLogRepository(db)
    
    # Simple risk classification helper based on title keywords
    risk = matter_in.risk or "Low"
    title_lower = matter_in.title.lower()
    if "dava" in title_lower or "uymamazlik" in title_lower or "ceza" in title_lower or "breach" in title_lower or "conflict" in title_lower:
        risk = "High"
    elif "agreement" in title_lower or "sozlesme" in title_lower or "vendor" in title_lower:
        risk = "Medium"

    matter_data = {
        "id": f"MAT-2026-{str(uuid.uuid4())[:8].upper()}",
        "user_id": current_user.id,
        "title": matter_in.title,
        "client": matter_in.client,
        "type": matter_in.type,
        "status": matter_in.status or "Pending",
        "risk": risk,
        "attorney": matter_in.attorney or current_user.name,
        "due_date": matter_in.due_date,
    }
    matter = await repo.create(matter_data)
    
    await audit.log(
        action="create_matter",
        user_id=current_user.id,
        details={"matter_id": matter.id, "title": matter.title}
    )
    return matter

@router.put("/{matter_id}", response_model=MatterResponse)
async def update_matter(matter_id: str, matter_in: MatterUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    repo = MatterRepository(db)
    audit = AuditLogRepository(db)
    
    matter = await repo.get(matter_id)
    if not matter:
        raise HTTPException(status_code=404, detail="Matter not found")
        
    # Check ownership unless admin
    from app.db.models import UserRole
    from sqlalchemy import select
    res = await db.execute(select(UserRole.role).where(UserRole.user_id == current_user.id))
    roles = [r for (r,) in res.all()]
    if "admin" not in roles and matter.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Bu matter üzerinde değişiklik yetkiniz yok")

    updates = {k: v for k, v in matter_in.dict().items() if v is not None}
    
    # Recalculate risk on title change if risk is not explicitly updated
    if "title" in updates and "risk" not in updates:
        title_lower = updates["title"].lower()
        if "dava" in title_lower or "uymamazlik" in title_lower or "ceza" in title_lower or "conflict" in title_lower:
            updates["risk"] = "High"
        elif "agreement" in title_lower or "sozlesme" in title_lower:
            updates["risk"] = "Medium"
            
    updated = await repo.update(matter_id, updates)
    
    await audit.log(
        action="update_matter",
        user_id=current_user.id,
        details={"matter_id": matter_id, "updates": updates}
    )
    return updated

@router.delete("/{matter_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_matter(matter_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    repo = MatterRepository(db)
    audit = AuditLogRepository(db)
    
    matter = await repo.get(matter_id)
    if not matter:
        raise HTTPException(status_code=404, detail="Matter not found")
        
    # Check ownership unless admin
    from app.db.models import UserRole
    from sqlalchemy import select
    res = await db.execute(select(UserRole.role).where(UserRole.user_id == current_user.id))
    roles = [r for (r,) in res.all()]
    if "admin" not in roles and matter.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Bu matter üzerinde silme yetkiniz yok")
        
    await repo.delete(matter_id)
    await audit.log(
        action="delete_matter",
        user_id=current_user.id,
        details={"matter_id": matter_id}
    )
