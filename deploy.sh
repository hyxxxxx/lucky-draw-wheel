#!/usr/bin/env bash
set -euo pipefail

IMAGE_NAME="${IMAGE_NAME:-lucky-draw-wheel:latest}"
CONTAINER_NAME="${CONTAINER_NAME:-lucky-draw-wheel}"
HOST_PORT="${HOST_PORT:-3009}"
CONTAINER_PORT=3009

docker build -t "$IMAGE_NAME" .

if docker ps -a --format '{{.Names}}' | grep -Fxq "$CONTAINER_NAME"; then
  docker rm -f "$CONTAINER_NAME"
fi

docker run -d \
  --name "$CONTAINER_NAME" \
  --restart unless-stopped \
  -p "${HOST_PORT}:${CONTAINER_PORT}" \
  "$IMAGE_NAME"

echo "Service is running at http://localhost:${HOST_PORT}"
