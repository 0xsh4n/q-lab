#!/usr/bin/env sh
set -eu
docker compose down -v --remove-orphans
docker compose up --build -d
echo "Lab reset. Run ./scripts/setup-model.sh if the local model is not installed."