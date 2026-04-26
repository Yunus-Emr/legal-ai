# Legal AI - Orion

A comprehensive AI-assisted legal workspace leveraging Retrieval-Augmented Generation (RAG) powered by Postgres and OpenSearch to assist attorneys in document scanning, history fetching, query logging, and draft compiling.

## System Architecture
* **Frontend**: React (Vite) + Tailwind CSS + TypeScript
* **Backend**: Python FastAPI with `intfloat/e5-large` sentence embedding service via memory.
* **Database**: PostgreSQL (SQLAlchemy ORM) connected via JWT bearer validations.
* **Vector Store**: OpenSearch on Docker for quick similarity search.

## Setup Instructions

Make sure `docker-compose` is running locally for the OpenSearch instances.
You can bootstrap the development environment using `make setup`, and boot the backend utilizing the `make run-backend` command scripts.

Consult the API documentation under `http://localhost:8000/docs` to test endpoints ranging from authentication to Document CRUD functionality.
