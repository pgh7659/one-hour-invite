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
  // Optional: 개발/테스트용 인증 체크 스킵 (true일 때만 스킵)
  SKIP_AUTH_CHECK: z.string().optional(),
});

const env = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
  ADMIN_EMAIL_ALLOWLIST: process.env.ADMIN_EMAIL_ALLOWLIST,
  SKIP_AUTH_CHECK: process.env.SKIP_AUTH_CHECK,
});

// Public env (can be imported in client components)
export const publicEnv = {
  NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
} as const;

// Server-only env (must be imported only in server code)
// NODE_ENV는 Next.js가 자동으로 설정하므로 별도 검증 불필요
export const serverEnv = {
  SUPABASE_SECRET_KEY: env.SUPABASE_SECRET_KEY,
  ADMIN_EMAIL_ALLOWLIST: env.ADMIN_EMAIL_ALLOWLIST
    ? env.ADMIN_EMAIL_ALLOWLIST.split(",").map((email) => email.trim())
    : [],
  NODE_ENV: (process.env.NODE_ENV ?? "development") as
    | "development"
    | "production"
    | "test",
  SKIP_AUTH_CHECK: env.SKIP_AUTH_CHECK === "true",
} as const;
