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
  "/",
  "/login",
  "/about",
  "/divisions",
  "/solutions",
  "/industries",
  "/projects",
  "/blog",
  "/contact",
  "/founder",
  "/api",
  "/_next",
  "/favicon",
];

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Allow all public routes
  if (PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

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

  const role = payload.role;

  if (pathname.startsWith("/dashboard")) {
    const roleRoutes = {
      admin:      "/dashboard/admin",
      medical:    "/dashboard/medical",
      va:         "/dashboard/va",
      foundation: "/dashboard/foundation",
      client:     "/dashboard/client",
    };

    for (const [slug, prefix] of Object.entries(roleRoutes)) {
      if (pathname.startsWith(`/dashboard/${slug}`) && role !== slug.toUpperCase()) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
