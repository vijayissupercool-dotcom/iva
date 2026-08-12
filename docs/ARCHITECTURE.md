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

## Object Storage

All raw and processed media files (video chunks, processed videos, screenshots) are stored in an S3-compatible object store.
- **Local Development**: We use a standalone **MinIO** container spun up via the root `docker-compose.yml` to perfectly emulate S3.
- **Production**: We use **Cloudflare R2** via the identical standard AWS S3 API. 
The application accesses storage universally via `@aws-sdk/client-s3` in `apps/web/src/lib/s3.ts`, configured via environment variables (`S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`). No code changes are required when switching environments.
