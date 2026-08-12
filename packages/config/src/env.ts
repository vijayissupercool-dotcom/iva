import { z } from "zod";

export const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string(),
  // SUPABASE_SERVICE_ROLE_KEY: z.string(), // server only
  REDIS_URL: z.string().url().default("redis://localhost:6379"),
  SENTRY_DSN: z.string().url().optional(),
  POSTHOG_API_KEY: z.string().optional(),
});

// A helper that attempts to parse process.env
// and throws loud errors if invalid.
export const validateEnv = (env: Record<string, any>) => {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    console.error("Invalid environment variables:", parsed.error.format());
    throw new Error("Invalid environment variables");
  }
  return parsed.data;
};
