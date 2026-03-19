import { NextResponse } from "next/server";
import { getCurrentUser, type AuthUser } from "./auth";

/**
 * Verify that the current request is from an admin user.
 * Returns the admin user if authorized, or a NextResponse error.
 */
export async function requireAdmin(): Promise<
  { user: AuthUser; error?: never } | { user?: never; error: NextResponse }
> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }),
    };
  }

  if (user.role !== "admin") {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { user };
}
