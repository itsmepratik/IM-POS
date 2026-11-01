import "server-only";

import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { isUserRole, type UserRole } from "@/lib/auth/role-cookie";

/**
 * Server-side authorization for Route Handlers and Server Actions.
 *
 * Middleware only guarantees a *session* exists for /api/*; every mutating or
 * sensitive handler must still call one of these to enforce the *role*.
 * The role is always read from the database (never from a client cookie).
 */

export interface AuthIdentity {
  userId: string;
  email: string | null;
  role: UserRole;
}

export class AuthError extends Error {
  readonly status: 401 | 403;
  constructor(message: string, status: 401 | 403) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

async function resolveIdentity(): Promise<AuthIdentity> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new AuthError("Unauthorized — please sign in.", 401);
  }

  const { data, error } = await supabase.rpc("get_user_role_for_middleware", {
    user_id: user.id,
  });
  // Any lookup failure degrades to the least-privileged role — never admin.
  const role: UserRole = !error && isUserRole(data) ? data : "shop";

  return { userId: user.id, email: user.email ?? null, role };
}

/** Any signed-in user (admin or shop account). */
export async function requireUser(): Promise<AuthIdentity> {
  return resolveIdentity();
}

/** Signed-in admin only. */
export async function requireAdmin(): Promise<AuthIdentity> {
  const identity = await resolveIdentity();
  if (identity.role !== "admin") {
    throw new AuthError("Forbidden — admin role required.", 403);
  }
  return identity;
}

/** Map an AuthError to a JSON response; returns null for other errors. */
export function authErrorResponse(error: unknown): NextResponse | null {
  if (error instanceof AuthError) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status },
    );
  }
  return null;
}
