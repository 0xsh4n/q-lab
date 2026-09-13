# Backend notes

The Replit preview uses `artifacts/api-server` as the live API service. The Docker image in that directory is the same route surface used by `docker compose up --build`.

The starter lab uses deterministic synthetic fixtures so students can begin without provisioning a database or commercial AI account. Docker Compose still includes PostgreSQL, Qdrant, Ollama, the internal-only service, and the simulated MCP server so the deployment topology and trust boundaries are inspectable.