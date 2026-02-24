"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

/**
 * Next.js Error Boundary for the /pos route.
 *
 * Catches unhandled React errors during render and provides
 * a clean recovery UI instead of a blank white screen.
 */
export default function POSError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[POS Error Boundary]", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        {/* Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Something went wrong
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The POS system encountered an unexpected error. This may be due to a
            network issue or a temporary service disruption.
          </p>
        </div>

        {/* Error details (collapsible) */}
        <details className="text-left bg-muted/50 rounded-lg p-3 text-xs">
          <summary className="cursor-pointer text-muted-foreground font-medium">
            Technical details
          </summary>
          <pre className="mt-2 whitespace-pre-wrap break-words text-destructive/80 font-mono">
            {error.message}
          </pre>
          {error.digest && (
            <p className="mt-1 text-muted-foreground">Digest: {error.digest}</p>
          )}
        </details>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button variant="chonky" className="gap-2" onClick={() => reset()}>
            <RotateCcw className="h-4 w-4" />
            Try Again
          </Button>
          <Button variant="outline" className="gap-2" asChild>
            <Link href="/">
              <Home className="h-4 w-4" />
              Go Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
