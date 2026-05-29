#!/bin/sh
set -e

echo "⏳  Running Prisma migrations..."
node_modules/.bin/prisma migrate deploy

if [ "${SEED}" = "true" ]; then
  echo "🌱  Running seed..."
  node_modules/.bin/prisma db seed
fi

echo "🚀  Starting SoukClick (Next.js standalone)..."
exec node server.js
