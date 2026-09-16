#!/usr/bin/env sh
set -eu

command -v docker >/dev/null 2>&1 || { echo "Docker is required."; exit 1; }
docker compose version >/dev/null 2>&1 || { echo "Docker Compose is required."; exit 1; }
docker compose up --build -d
echo "Waiting for services..."
attempt=0
until curl -fsS http://localhost:8080/api/healthz >/dev/null 2>&1; do
  attempt=$((attempt + 1))
  [ "$attempt" -lt 60 ] || { echo "TechDesk AI did not become healthy."; exit 1; }
  sleep 2
done
if [ "${SKIP_MODEL_PULL:-false}" != "true" ]; then
  ./scripts/setup-model.sh
fi
echo "TechDesk AI is ready at http://localhost:8080"