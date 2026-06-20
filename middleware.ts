import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

const PROTECTED_PREFIXES = ["/dashboard", "/journal", "/vocabulary", "/settings"]
const AUTH_ROUTES = ["/login", "/signup"]

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  )
  const isAuthRoute = AUTH_ROUTES.includes(pathname)

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return redirectWithCookies(url, response)
  }

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    return redirectWithCookies(url, response)
  }

  return response
}

function redirectWithCookies(url: URL, source: NextResponse) {
  const redirect = NextResponse.redirect(url)
  source.cookies.getAll().forEach((cookie) => {
    redirect.cookies.set(cookie)
  })
  return redirect
}

export const config = {
  // Skip /api/* — those routes self-authenticate via `requireUser()`. Running
  // the middleware's own `auth.getUser()` on every API call doubled the cost
  // of every Supabase Auth round-trip and made transient upstream slowness
  // surface as long hangs on data fetches like /api/entries/search.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
