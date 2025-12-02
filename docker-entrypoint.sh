#!/bin/sh
set -e

echo "Starting Supermark self-hosted instance..."

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL..."
# Simple wait - rely on Docker healthchecks and retry logic in Prisma
sleep 10

# Run database migrations
echo "Running database migrations..."
cd prisma && ../node_modules/.bin/prisma migrate deploy --schema=./schema/schema.prisma && cd .. || {
  echo "Migration failed, but continuing... (this is expected on first run)"
  cd ..
}

echo "Starting application..."
exec "$@"
