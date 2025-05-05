"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BranchRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new branch inventory path
    router.replace("/branch-inventory");
  }, [router]);

  // Show a loading message while the redirect happens
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-lg">Redirecting to Branch Inventory...</p>
        <p className="text-sm text-muted-foreground mt-2">
          The branch inventory has moved to a new location.
        </p>
      </div>
    </div>
  );
}
