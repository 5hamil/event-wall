import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const initialRequestHeaders = new Headers(request.headers);
  initialRequestHeaders.set("x-event-wall-path", pathname);
  let response = NextResponse.next({ request: { headers: initialRequestHeaders } });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return response;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Keep the request cookie jar current for downstream Route Handlers and layouts.
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));

        const requestHeaders = new Headers(request.headers);
        requestHeaders.set("x-event-wall-path", pathname);
        response = NextResponse.next({ request: { headers: requestHeaders } });

        // Persist refreshed tokens in the browser for the next request.
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // getUser validates the token and refreshes it when needed. Its cookie changes
  // flow through setAll above to both the current request and the browser response.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/club/:path*", "/api/club/:path*"],
};
