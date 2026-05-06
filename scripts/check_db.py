import asyncio
from sqlalchemy import create_engine, text
from sqlalchemy.ext.asyncio import create_async_engine

async def check_db():
    url = "postgresql+asyncpg://postgres:postgres@localhost:5432/legalai"
    engine = create_async_engine(url)
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT id, filename, status FROM documents"))
        rows = result.fetchall()
        print(f"Total documents in DB: {len(rows)}")
        for r in rows:
            print(f" - {r.filename} [{r.status}]")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check_db())
