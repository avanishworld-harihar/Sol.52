import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE_NAME, isAdminEnabled } from "@/lib/admin-access";
import { APP_SESSION_COOKIE, isAuthLoginRequired } from "@/lib/auth/constants";

function isAdminPath(pathname: string): boolean {
  return pathname.startsWith("/admin");
}

function isAdminApiPath(pathname: string): boolean {
  return pathname.startsWith("/api/admin");
}

function isPublicInstallerPath(pathname: string): boolean {
  if (pathname === "/login") return true;
  if (pathname.startsWith("/api/auth/")) return true;
  if (pathname.startsWith("/proposal/")) return true;
  if (pathname.startsWith("/api/webhooks/")) return true;
  if (pathname.startsWith("/_next/")) return true;
  if (pathname.startsWith("/icons/")) return true;
  if (pathname === "/favicon.ico" || pathname === "/manifest.webmanifest" || pathname === "/sw.js") {
    return true;
  }
  return false;
}

/** App areas that require subscriber session when AUTH_REQUIRE_LOGIN=true. */
function isProtectedInstallerPath(pathname: string): boolean {
  if (isPublicInstallerPath(pathname)) return false;
  if (isAdminPath(pathname) || isAdminApiPath(pathname)) return false;
  const roots = [
    "/customers",
    "/projects",
    "/proposals",
    "/proposal",
    "/quotation",
    "/billing",
    "/more",
    "/workspace",
    "/api/customers",
    "/api/projects",
    "/api/proposals",
    "/api/billing",
    "/api/team",
    "/api/analyze-bill",
  ];
  return roots.some((r) => pathname === r || pathname.startsWith(`${r}/`)) || pathname === "/";
}

function handleAdminGuard(req: NextRequest): NextResponse | null {
  const { pathname, search } = req.nextUrl;

  if (!isAdminPath(pathname) && !isAdminApiPath(pathname)) {
    return null;
  }

  if (pathname === "/admin/login" || pathname === "/api/admin/session") {
    return NextResponse.next();
  }

  if (!isAdminEnabled()) {
    if (isAdminApiPath(pathname)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Admin access not configured. Set SUPABASE_SERVICE_ROLE_KEY and RBAC user role.",
        },
        { status: 503 }
      );
    }
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", `${pathname}${search}`);
    url.searchParams.set("reason", "not_configured");
    return NextResponse.redirect(url);
  }

  const cookieToken = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (cookieToken) {
    return NextResponse.next();
  }

  if (isAdminApiPath(pathname)) {
    return NextResponse.json({ ok: false, error: "Unauthorized admin API request." }, { status: 401 });
  }

  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(url);
}

export function middleware(req: NextRequest) {
  const admin = handleAdminGuard(req);
  if (admin) return admin;

  if (isAuthLoginRequired()) {
    const { pathname, search } = req.nextUrl;
    if (isProtectedInstallerPath(pathname)) {
      const session = req.cookies.get(APP_SESSION_COOKIE)?.value;
      if (!session) {
        if (pathname.startsWith("/api/")) {
          return NextResponse.json({ ok: false, error: "Sign in required." }, { status: 401 });
        }
        const url = req.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("next", `${pathname}${search}`);
        return NextResponse.redirect(url);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/login",
    "/api/auth/:path*",
    "/",
    "/customers/:path*",
    "/projects/:path*",
    "/proposals/:path*",
    "/proposal",
    "/proposal/:path*",
    "/quotation/:path*",
    "/billing/:path*",
    "/more/:path*",
    "/workspace/:path*",
    "/api/customers/:path*",
    "/api/projects/:path*",
    "/api/proposals/:path*",
    "/api/billing/:path*",
    "/api/team/:path*",
    "/api/analyze-bill",
  ],
};
