import { type CookieOptions, createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { publicEnv } from "@/lib/env";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient<unknown>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: Array<{
            name: string;
            value: string;
            options?: CookieOptions;
          }>,
        ) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Skip auth checks in development mode (for easier development)
  const isDevelopment = process.env.NODE_ENV === "development";
  const skipAuth = process.env.SKIP_AUTH_CHECK === "true";

  if (!isDevelopment && !skipAuth) {
    // Protect /me and /admin routes
    if (
      request.nextUrl.pathname.startsWith("/me") ||
      request.nextUrl.pathname.startsWith("/admin")
    ) {
      if (!user) {
        return NextResponse.redirect(new URL("/login", request.url));
      }
    }

    // Protect /admin routes with email allowlist (if configured)
    if (request.nextUrl.pathname.startsWith("/admin") && user) {
      const adminAllowlist = process.env.ADMIN_EMAIL_ALLOWLIST?.split(",").map(
        (email) => email.trim(),
      );
      if (
        adminAllowlist &&
        adminAllowlist.length > 0 &&
        !adminAllowlist.includes(user.email ?? "")
      ) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
