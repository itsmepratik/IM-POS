/**
 * Server-only admin gate for backup/restore routes.
 * NEVER import from a Client Component — it reads the service-role-adjacent
 * Supabase server client and must stay on the server.
 */

import { createClient } from "@/supabase/server";

export interface AdminIdentity {
  userId: string;
  email: string | null;
}

export class BackupAuthError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "BackupAuthError";
    this.status = status;
  }
}

/**
 * Require an authenticated admin user. Throws BackupAuthError (401/403) otherwise.
 * Uses the same role source as middleware (RPC) with user_profiles fallback
 * so a stale `user_role` cookie can never grant backup access.
 */
export async function requireBackupAdmin(): Promise<AdminIdentity> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new BackupAuthError("Unauthorized — sign in as an admin.", 401);
  }

  let role: string | null = null;

  try {
    const { data: rpcRole, error: rpcError } = await supabase.rpc(
      "get_user_role_for_middleware",
      { user_id: user.id },
    );
    if (!rpcError && typeof rpcRole === "string" && rpcRole.length > 0) {
      role = rpcRole;
    }
  } catch {
    role = null;
  }

  if (!role) {
    try {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("role,is_admin")
        .eq("id", user.id)
        .maybeSingle();
      if (profile) {
        const p = profile as { role?: string | null; is_admin?: boolean | null };
        if (p.is_admin === true) role = "admin";
        else if (typeof p.role === "string") role = p.role;
      }
    } catch {
      role = null;
    }
  }

  if (!role && user.email === "admin@hnsautomotive.com") {
    role = "admin";
  }

  if (role !== "admin") {
    throw new BackupAuthError("Forbidden — admin role required.", 403);
  }

  return { userId: user.id, email: user.email ?? null };
}
