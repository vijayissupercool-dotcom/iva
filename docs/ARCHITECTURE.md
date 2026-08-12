# Architecture Overview

## Database & Migrations

The database is managed through two separate migration systems, which must be run in a specific order:
1. **Prisma**: Manages all table schemas and structure (`packages/db/prisma/migrations/`).
2. **Supabase**: Manages Row Level Security (RLS) policies and functions (`supabase/migrations/`).

**Why this separation?**
Prisma generates migrations by comparing against a shadow database. Since the shadow database does not inherit Supabase's internal schemas (like `auth`), any custom SQL utilizing `auth.uid()` or modifying Supabase internal schemas would fail Prisma's validation, or fail upon application due to `postgres` role permissions. By separating the structure (Prisma) from the policies (Supabase SQL), we avoid these limitations.

**Execution Order**
To ensure a fresh database is set up correctly, use the provided setup script:
```bash
./scripts/db-setup.sh
```
This script strictly enforces:
1. Starting Supabase
2. Running `npx prisma migrate dev`
3. Executing the RLS SQL manually against the Postgres container.
