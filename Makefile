.PHONY: setup run-backend start-opensearch seed

setup:
	@echo "Setting up Legal AI project..."
	cd backend && pip install -r requirements.txt
	cd frontend && npm install

run-backend:
	@echo "Starting FastAPI RAG server..."
	cd backend && . venv/bin/activate && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

start-opensearch:
	@echo "Starting infrastructure containers..."
	docker-compose up -d opensearch

run-frontend:
	@echo "Starting React Vite server..."
	cd frontend && npm run dev

seed:
	@echo "Running initial DB seed script (assumes SQL setup)..."
	psql -U admin -d legal_db -f sql/seed.sql
