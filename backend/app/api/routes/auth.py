import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.db.postgres import get_db
from app.db.repository import UserRepository
from app.db.models import User
from app.services.auth_service import get_password_hash, verify_password, create_access_token
from app.core.security import get_current_user as get_current_user_from_auth

router = APIRouter()

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: str

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    repo = UserRepository(db)
    existing = await repo.get_by_email(user_in.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pwd = get_password_hash(user_in.password)
    user_id = str(uuid.uuid4())
    user_data = {
        "id": user_id,
        "name": user_in.name,
        "email": user_in.email,
        "hashed_password": hashed_pwd,
        "is_active": True
    }
    user = await repo.create(user_data)
    
    # ── Automatically assign 'user' role ──────────────────────
    from app.db.models import UserRole
    db.add(UserRole(user_id=user.id, role="user"))
    await db.commit()
    # ──────────────────────────────────────────────────────────
    
    access_token = create_access_token(data={"sub": user.id})
    return {"access_token": access_token, "token_type": "bearer", "user_id": user.id}

@router.post("/login", response_model=Token)
async def login(user_in: UserLogin, db: AsyncSession = Depends(get_db)):
    repo = UserRepository(db)
    user = await repo.get_by_email(user_in.email)
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.id})
    return {"access_token": access_token, "token_type": "bearer", "user_id": user.id}


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: str
    is_active: bool


@router.get("/me", response_model=UserOut)
async def get_me(
    current_user: User = Depends(get_current_user_from_auth),  # noqa: F821
    db: AsyncSession = Depends(get_db),
):
    """Authenticated kullanıcının profilini ve rolünü döner."""
    from sqlalchemy import select
    from app.db.models import UserRole
    result = await db.execute(
        select(UserRole.role).where(UserRole.user_id == current_user.id)
    )
    roles = [r for (r,) in result.all()]
    role = "admin" if "admin" in roles else "user"
    return UserOut(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        role=role,
        is_active=current_user.is_active,
    )
