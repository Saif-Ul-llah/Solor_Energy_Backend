#!/bin/sh

# Force DATABASE_URL to use postgres service name (not localhost) when running in Docker
# Replace localhost/127.0.0.1 with postgres service name if present
if [ -n "$DATABASE_URL" ]; then
  export DATABASE_URL=$(echo "$DATABASE_URL" | sed 's/localhost/postgres/g' | sed 's/127\.0\.0\.1/postgres/g')
else
  export DATABASE_URL="postgresql://postgres:${POSTGRES_PASSWORD:-postgres}@postgres:5432/postgres"
fi

# Run Prisma migration
npx prisma migrate deploy

# Start the app
npm start
