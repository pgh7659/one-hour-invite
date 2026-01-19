import { z } from "zod";

const envSchema = z.object({
  // Public env (can be used in client)
  // Use Publishable key from Supabase dashboard (new key system)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),

  // Server-only env
  // Use Secret key from Supabase dashboard (new key system)
  SUPABASE_SECRET_KEY: z.string().min(1).optional(),
  ADMIN_EMAIL_ALLOWLIST: z.string().optional(),
});

const env = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
  ADMIN_EMAIL_ALLOWLIST: process.env.ADMIN_EMAIL_ALLOWLIST,
});

// Public env (can be imported in client components)
export const publicEnv = {
  NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
} as const;

// Server-only env (must be imported only in server code)
export const serverEnv = {
  SUPABASE_SECRET_KEY: env.SUPABASE_SECRET_KEY,
  ADMIN_EMAIL_ALLOWLIST: env.ADMIN_EMAIL_ALLOWLIST
    ? env.ADMIN_EMAIL_ALLOWLIST.split(",").map((email) => email.trim())
    : [],
} as const;
