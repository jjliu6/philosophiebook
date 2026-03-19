import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "./db";
import type { AuthUser } from "./auth";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback_dev_secret"
);
const ADMIN_COOKIE = "pb_admin_token";

/**
 * Verify that the current request is from an admin user.
 * Uses the separate pb_admin_token cookie — independent from regular user auth.
 */
export async function requireAdmin(): Promise<
  { user: AuthUser; error?: never } | { user?: never; error: NextResponse }
> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;

  if (!token) {
    return {
      error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }),
    };
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    if (payload.role !== "admin" || !payload.id) {
      return {
        error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      };
    }

    // Verify user still exists and is still admin
    const user = await prisma.user.findUnique({
      where: { id: payload.id as string },
      select: { id: true, username: true, email: true, role: true, bio: true, avatarUrl: true },
    });

    if (!user || user.role !== "admin") {
      return {
        error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      };
    }

    return { user };
  } catch {
    return {
      error: NextResponse.json({ error: "Invalid token" }, { status: 401 }),
    };
  }
}
