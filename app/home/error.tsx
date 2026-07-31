"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

export default function DefaultError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Route Error Boundary]", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[50vh] bg-background p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-7 w-7 text-destructive" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Something went wrong
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            An unexpected error occurred. Please try again or return to the
            dashboard.
          </p>
        </div>
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
