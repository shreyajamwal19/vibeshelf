#!/usr/bin/env bash
# Start the Vibeshelf backend with GROQ env vars loaded from a .env file if present.
# Place your secret values in backend/vibeshelf-backend/.env (this file is ignored by git).

set -euo pipefail

BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$BASE_DIR/.env"

if [ -f "$ENV_FILE" ]; then
  echo "Sourcing $ENV_FILE"
  # shellcheck disable=SC1090
  set -a
  # load env file (KEY=VALUE lines)
  . "$ENV_FILE"
  set +a
else
  echo "No $ENV_FILE found. You can create one to store GROQ_API_KEY and GROQ_API_URL."
fi

echo "Starting vibeshelf backend..."
cd "$BASE_DIR"

if [ -f target/vibeshelf-backend-0.0.1-SNAPSHOT.jar ]; then
  echo "Found packaged jar, running java -jar"
  exec java -jar target/vibeshelf-backend-0.0.1-SNAPSHOT.jar
else
  echo "No jar found. Running via Maven (dev)."
  exec mvn -DskipTests spring-boot:run
fi
