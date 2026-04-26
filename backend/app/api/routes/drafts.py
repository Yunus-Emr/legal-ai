import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.db.postgres import get_db
from app.db.repository import DraftRepository
from app.core.security import get_current_user
from app.db.models import User

router = APIRouter()

class DraftCreate(BaseModel):
    title: str
    content: Optional[str] = None

class DraftUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None

class DraftResponse(BaseModel):
    id: str
    user_id: str
    title: str
    content: Optional[str]
    
    class Config:
        from_attributes = True

@router.get("/", response_model=List[DraftResponse])
async def list_drafts(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    repo = DraftRepository(db)
    drafts = await repo.list_by_user(current_user.id)
    return drafts

@router.post("/", response_model=DraftResponse)
async def create_draft(draft_in: DraftCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    repo = DraftRepository(db)
    draft_data = {
        "id": str(uuid.uuid4()),
        "user_id": current_user.id,
        "title": draft_in.title,
        "content": draft_in.content
    }
    draft = await repo.create(draft_data)
    return draft

@router.put("/{draft_id}", response_model=DraftResponse)
async def update_draft(draft_id: str, draft_in: DraftUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    repo = DraftRepository(db)
    updates = {k: v for k, v in draft_in.dict().items() if v is not None}
    draft = await repo.update(draft_id, updates)
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    return draft

@router.delete("/{draft_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_draft(draft_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    repo = DraftRepository(db)
    await repo.delete(draft_id)
