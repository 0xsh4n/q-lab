#!/usr/bin/env sh
set -eu
docker compose ps
echo
printf "Application: "
curl -fsS http://localhost:8080/api/healthz || true
echo
printf "Ollama models: "
docker compose exec -T ollama ollama list 2>/dev/null || true