/**
 * Next.js Proxy — Route Guard + Role-Based URL Protection
 * (Next.js 16: middleware.ts → proxy.ts, export middleware → export proxy)
 *
 * Katmanlı koruma:
 * 1. Token veya Guest çerezi yoksa /login'e yönlendir.
 * 2. Admin-only URL'lere (admin, analytics, compliance) erişilirse
 *    cookie'deki role kontrol edilir; admin değilse / yönlendirilir.
 *    Not: lexai_role cookie'si backend tarafından httpOnly=False olarak set edilir.
 * 3. /login ve /register herkese açık.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/register"];

/** Admin yetkisi gerektiren prefix'ler */
const ADMIN_PATHS = ["/admin", "/analytics", "/compliance"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Public paths — herkese açık
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  if (isPublic) return NextResponse.next();

  // 2. Auth check — token veya guest cookie gerekli
  const token = request.cookies.get("lexai_token")?.value;
  const isGuest = request.cookies.get("lexai_guest")?.value === "true";

  if (!token && !isGuest) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Admin-only path check
  const isAdminPath = ADMIN_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  if (isAdminPath) {
    // role cookie — backend non-httpOnly olarak set eder: "lexai_role"
    const role = request.cookies.get("lexai_role")?.value;
    if (role && role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    // role cookie yoksa client-side RoleGuard devreye girer (graceful degradation)
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
