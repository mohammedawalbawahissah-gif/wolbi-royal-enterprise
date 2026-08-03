import { NextResponse } from "next/server";

function decodeJWT(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(Buffer.from(payload, "base64").toString("utf-8"));
  } catch {
    return null;
  }
}

const PUBLIC_PREFIXES = [
  "/about",
  "/founder",
  "/divisions",
  "/solutions",
  "/industries",
  "/projects",
  "/blog",
  "/contact",
  "/partners",
  "/schedule",
  "/api",
  "/_next",
  "/favicon",
  "/founder-primary.jpg",
  "/founder-secondary.jpg",
];

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Root is always public
  if (pathname === "/") return NextResponse.next();

  // Allow all public routes
  if (PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  // Everything under /login is public
  if (pathname.startsWith("/login")) return NextResponse.next();

  // All other routes require auth
  const token = request.cookies.get("access_token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const payload = decodeJWT(token);
  if (!payload) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Check token expiry
  if (payload.exp && Date.now() / 1000 > payload.exp) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("access_token");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.jpg|.*\\.png|.*\\.svg|.*\\.ico).*)"],
};
