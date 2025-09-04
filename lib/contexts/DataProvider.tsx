"use client";

import { ReactNode } from "react";
import { AuthProvider } from "./AuthContext";
import { BranchProvider } from "./BranchContext";

/**
 * DataProvider combines all necessary contexts for the POS system:
 * - Authentication (user management and sessions)
 * - Branch selection (multi-location support)
 *
 * This provider ensures proper hierarchical context nesting and
 * maintains backward compatibility with existing components.
 */
export function DataProvider({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <BranchProvider>{children}</BranchProvider>
    </AuthProvider>
  );
}

// Export individual hooks for convenience
export { useAuth } from "./AuthContext";
export { useBranch } from "./BranchContext";
