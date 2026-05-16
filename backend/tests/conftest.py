"""
Pytest Fixtures — async client, in-memory DB, test users
"""
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.postgres import get_db
from app.db.models import Base, User, UserRole
from app.services.auth_service import get_password_hash, create_access_token

# ── In-Memory SQLite (test izolasyonu) ──────────────────────────────────────
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"


@pytest_asyncio.fixture(scope="session")
async def test_engine():
    engine = create_async_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def db_session(test_engine):
    SessionLocal = async_sessionmaker(test_engine, expire_on_commit=False)
    async with SessionLocal() as session:
        yield session


@pytest_asyncio.fixture(scope="function")
async def client(db_session):
    """App üzerinde test HTTP client, gerçek DB yerine in-memory SQLite kullanır."""
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest_asyncio.fixture(scope="function")
async def test_user(db_session) -> User:
    """Kayıtlı test kullanıcısı oluşturur."""
    import uuid
    user = User(
        id=str(uuid.uuid4()),
        name="Test Kullanıcı",
        email="test@legalai.com",
        hashed_password=get_password_hash("testpass123"),
        is_active=True,
    )
    db_session.add(user)
    db_session.add(UserRole(user_id=user.id, role="user"))
    await db_session.commit()
    return user


@pytest_asyncio.fixture(scope="function")
async def admin_user(db_session) -> User:
    """Admin test kullanıcısı."""
    import uuid
    user = User(
        id=str(uuid.uuid4()),
        name="Admin",
        email="admin@legalai.com",
        hashed_password=get_password_hash("adminpass123"),
        is_active=True,
    )
    db_session.add(user)
    db_session.add(UserRole(user_id=user.id, role="admin"))
    await db_session.commit()
    return user


@pytest.fixture
def auth_headers(test_user) -> dict:
    """Bearer token header'ı döner."""
    token = create_access_token({"sub": test_user.id})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_headers(admin_user) -> dict:
    token = create_access_token({"sub": admin_user.id})
    return {"Authorization": f"Bearer {token}"}
