import uuid
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response, Cookie
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import Optional

from app.db.postgres import get_db
from app.db.repository import UserRepository
from app.db.models import User, UserRole, PasswordResetToken
from app.services.auth_service import (
    get_password_hash, verify_password,
    create_access_token, create_refresh_token,
    generate_reset_token, hash_reset_token,
    REFRESH_TOKEN_EXPIRE_DAYS,
)
from app.core.security import get_current_user as get_current_user_from_auth
from app.services.email_service import email_service
from app.core.config import settings
from app.core.logger import get_logger
from app.core.rate_limit import limiter  # Circular import önlendi — ayrı modülde

logger = get_logger(__name__)
router = APIRouter()

# ── Cookie ayarları ─────────────────────────────────────────────────────────
COOKIE_KWARGS = dict(
    httponly=True,
    samesite="lax",
    secure=(settings.ENV == "production"),  # Production'da HTTPS zorunlu
)


# ── Şemalar ─────────────────────────────────────────────────────────────────
class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, description="En az 8 karakter, 1 rakam")

    def model_post_init(self, __context):
        if not any(c.isdigit() for c in self.password):
            raise ValueError("Şifre en az 1 rakam içermeli")


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: str


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: str
    is_active: bool


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)


# ── Register ────────────────────────────────────────────────────────────────
@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def register(request: Request, response: Response, user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    repo = UserRepository(db)
    existing = await repo.get_by_email(user_in.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = str(uuid.uuid4())
    user = await repo.create({
        "id": user_id,
        "name": user_in.name,
        "email": user_in.email,
        "hashed_password": get_password_hash(user_in.password),
        "is_active": True,
    })
    db.add(UserRole(user_id=user.id, role="user"))
    await db.commit()

    access_token = create_access_token({"sub": user.id})
    refresh_token = create_refresh_token({"sub": user.id})

    response.set_cookie("lexai_token", access_token, max_age=3600, **COOKIE_KWARGS)
    response.set_cookie("lexai_refresh", refresh_token, max_age=REFRESH_TOKEN_EXPIRE_DAYS * 86400, **COOKIE_KWARGS)

    return {"access_token": access_token, "token_type": "bearer", "user_id": user.id}


# ── Login ────────────────────────────────────────────────────────────────────
@router.post("/login", response_model=Token)
@limiter.limit("10/minute")
async def login(request: Request, response: Response, user_in: UserLogin, db: AsyncSession = Depends(get_db)):
    repo = UserRepository(db)
    user = await repo.get_by_email(user_in.email)
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token({"sub": user.id})
    refresh_token = create_refresh_token({"sub": user.id})

    response.set_cookie("lexai_token", access_token, max_age=3600, **COOKIE_KWARGS)
    response.set_cookie("lexai_refresh", refresh_token, max_age=REFRESH_TOKEN_EXPIRE_DAYS * 86400, **COOKIE_KWARGS)

    return {"access_token": access_token, "token_type": "bearer", "user_id": user.id}


# ── Refresh Token ────────────────────────────────────────────────────────────
@router.post("/refresh", response_model=Token)
async def refresh_token(
    response: Response,
    db: AsyncSession = Depends(get_db),
    lexai_refresh: Optional[str] = Cookie(default=None),
):
    """Refresh token cookie'den yeni access token üretir."""
    from jose import jwt, JWTError
    from app.services.auth_service import SECRET_KEY, ALGORITHM

    if not lexai_refresh:
        raise HTTPException(status_code=401, detail="Refresh token bulunamadı")

    try:
        payload = jwt.decode(lexai_refresh, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Geçersiz token tipi")
        user_id: str = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Geçersiz refresh token")

    repo = UserRepository(db)
    user = await repo.get(user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Kullanıcı bulunamadı")

    new_access = create_access_token({"sub": user_id})
    response.set_cookie("lexai_token", new_access, max_age=3600, **COOKIE_KWARGS)

    return {"access_token": new_access, "token_type": "bearer", "user_id": user_id}


# ── Logout ───────────────────────────────────────────────────────────────────
@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("lexai_token")
    response.delete_cookie("lexai_refresh")
    return {"message": "Çıkış yapıldı"}


# ── Me ───────────────────────────────────────────────────────────────────────
@router.get("/me", response_model=UserOut)
async def get_me(
    current_user: User = Depends(get_current_user_from_auth),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(UserRole.role).where(UserRole.user_id == current_user.id))
    roles = [r for (r,) in result.all()]
    return UserOut(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        role="admin" if "admin" in roles else "user",
        is_active=current_user.is_active,
    )


# ── Forgot Password ──────────────────────────────────────────────────────────
@router.post("/forgot-password", status_code=status.HTTP_202_ACCEPTED)
@limiter.limit("3/minute")
async def forgot_password(request: Request, body: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """
    Her zaman 202 döner (timing attack'ı önler).
    Email kayıtlıysa sıfırlama linki gönderilir, değilse sessizce geçilir.
    """
    repo = UserRepository(db)
    user = await repo.get_by_email(body.email)

    if user and user.is_active:
        # Eski tokenları temizle
        await db.execute(delete(PasswordResetToken).where(PasswordResetToken.user_id == user.id))

        raw_token, hashed = generate_reset_token()
        expires_at = datetime.utcnow() + timedelta(minutes=15)

        db.add(PasswordResetToken(
            id=str(uuid.uuid4()),
            user_id=user.id,
            token_hash=hashed,
            expires_at=expires_at,
        ))
        await db.commit()

        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={raw_token}"
        await email_service.send_password_reset(user.email, reset_url)
        logger.info(f"[Auth] Şifre sıfırlama emaili gönderildi: {user.email}")

    return {"message": "Eğer bu email kayıtlıysa sıfırlama linki gönderildi."}


# ── Reset Password ───────────────────────────────────────────────────────────
@router.post("/reset-password")
@limiter.limit("5/minute")
async def reset_password(request: Request, body: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    token_hash = hash_reset_token(body.token)

    result = await db.execute(
        select(PasswordResetToken).where(
            PasswordResetToken.token_hash == token_hash,
            PasswordResetToken.used == False,  # noqa: E712
            PasswordResetToken.expires_at > datetime.utcnow(),
        )
    )
    reset_token = result.scalar_one_or_none()

    if not reset_token:
        raise HTTPException(status_code=400, detail="Geçersiz veya süresi dolmuş token")

    # Şifreyi güncelle
    result2 = await db.execute(select(User).where(User.id == reset_token.user_id))
    user = result2.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=400, detail="Kullanıcı bulunamadı")

    user.hashed_password = get_password_hash(body.new_password)
    reset_token.used = True
    await db.commit()

    logger.info(f"[Auth] Şifre sıfırlandı: {user.email}")
    return {"message": "Şifre başarıyla güncellendi"}
