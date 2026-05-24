/**
 * Next.js Middleware — Route Guard & Role-Based URL Protection
 * 
 * Katmanlı koruma:
 * 1. API endpoint'lerini (/api/) tamamen bypass et (CORS ve API auth backend tarafından yönetilir).
 * 2. Token veya Guest çerezi yoksa /login'e yönlendir.
 * 3. Admin-only URL'lere (/admin, /analytics) erişilirse
 *    cookie'deki role kontrol edilir; admin değilse / yönlendirilir.
 * 4. /login ve /register herkese açık.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/register"];

/** Admin yetkisi gerektiren prefix'ler */
const ADMIN_PATHS = ["/admin", "/analytics", "/compliance"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. API endpoint'lerini tamamen bypass et (Backend auth ve CORS devreye girsin)
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // 2. Public paths — herkese açık
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  if (isPublic) return NextResponse.next();

  // 3. Auth check — token veya guest cookie gerekli
  const token = request.cookies.get("lexai_token")?.value;
  const isGuest = request.cookies.get("lexai_guest")?.value === "true";

  if (!token && !isGuest) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 4. Admin-only path check
  const isAdminPath = ADMIN_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  if (isAdminPath) {
    const role = request.cookies.get("lexai_role")?.value;
    if (role && role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
