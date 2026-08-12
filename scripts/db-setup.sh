#!/bin/bash
set -e

echo "Starting local Supabase..."
npx supabase start

echo "Applying Prisma Migrations (creates tables)..."
cd packages/db
npx prisma migrate dev
cd ../..

echo "Applying Row Level Security policies..."
CONTAINER=$(docker ps --format "{{.Names}}" | grep db)
docker exec -i $CONTAINER psql -U postgres -d postgres < supabase/migrations/20260812000000_rls_policies.sql

echo "Database setup complete."
