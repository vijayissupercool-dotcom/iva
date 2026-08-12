import 'dotenv/config';
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "schema.prisma",
  experimental: {
    externalTables: true,
  },
  migrations: {
    initShadowDb: `CREATE SCHEMA IF NOT EXISTS auth; CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid AS $$ SELECT gen_random_uuid() $$ LANGUAGE SQL;`,
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
