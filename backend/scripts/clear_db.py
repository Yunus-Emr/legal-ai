import asyncio
from sqlalchemy import text
from app.db.postgres import SessionLocal

async def clear_db():
    async with SessionLocal() as db:
        await db.execute(text("DELETE FROM documents"))
        await db.execute(text("DELETE FROM audit_logs"))
        await db.commit()
    print("Database cleared.")

if __name__ == "__main__":
    import os
    import sys
    sys.path.append(os.getcwd())
    asyncio.run(clear_db())
