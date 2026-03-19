import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback_dev_secret"
);

async function verifyAdmin(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Inject pathname header so root layout can detect admin routes
  const response = NextResponse.next();
  response.headers.set("x-pathname", pathname);

  // Skip auth for admin login page and its API
  if (pathname === "/admin/login" || pathname === "/api/admin/auth/login") {
    return response;
  }

  // Protect all /admin/* and /api/admin/* routes
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const token = request.cookies.get("pb_token")?.value;

    if (!token || !(await verifyAdmin(token))) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|svg|webp|woff2?)).*)"],
};
