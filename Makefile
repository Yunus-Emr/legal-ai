.PHONY: setup run-backend start-opensearch seed docker-up docker-up-gpu docker-down

setup:
	@echo "Setting up Legal AI project..."
	cd backend && pip install -r requirements.txt
	cd frontend-next && npm install

run-backend:
	@echo "Starting FastAPI RAG server..."
	cd backend && . venv/bin/activate && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

start-opensearch:
	@echo "Starting infrastructure containers..."
	docker-compose up -d opensearch

run-frontend:
	@echo "Starting Next.js frontend server..."
	cd frontend-next && npm run dev

seed:
	@echo "Running initial DB seed script (assumes SQL setup)..."
	psql -U admin -d legal_db -f sql/seed.sql

docker-up:
	@echo "Starting Docker containers in CPU mode..."
	docker compose up --build -d

docker-up-gpu:
	@echo "Starting Docker containers in GPU mode (NVIDIA CUDA)..."
	docker compose -f docker-compose.yml -f docker-compose.gpu.yml up --build -d

docker-down:
	@echo "Stopping Docker containers..."
	docker compose down

