import { type CookieOptions, createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { publicEnv, serverEnv } from "@/lib/env";

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
  const isDevelopment = serverEnv.NODE_ENV === "development";
  const skipAuth = serverEnv.SKIP_AUTH_CHECK;

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

    // Protect /admin routes with admin check
    if (request.nextUrl.pathname.startsWith("/admin") && user) {
      const userIsAdmin = await isAdmin(user.id);
      if (!userIsAdmin) {
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
