/**
 * Next.js Middleware — Route Guard
 * Token veya Guest çerezi yoksa /login'e yönlendir.
 * /login ve /register sayfaları herkese açık.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths — everyone can access
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  if (isPublic) return NextResponse.next();

  // Check for token in cookies (set at login) or guest flag
  const token = request.cookies.get("lexai_token")?.value;
  const isGuest = request.cookies.get("lexai_guest")?.value === "true";

  if (!token && !isGuest) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
