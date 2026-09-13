#!/usr/bin/env sh
set -eu

MODEL="${OLLAMA_MODEL:-phi3:mini}"
echo "Pulling local Ollama model: ${MODEL}"
docker compose exec ollama ollama pull "${MODEL}"
echo "Model ready."