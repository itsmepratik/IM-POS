"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";
import { Layout } from "@/components/layout";

export default function CashShiftsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Cash Shifts Error]", error);
  }, [error]);

  return (
    <Layout>
      <div className="flex items-center justify-center min-h-[50vh] p-4">
        <div className="w-full max-w-md space-y-6 text-center bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
            <AlertTriangle className="h-7 w-7 text-destructive" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Failed to load cash shifts
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We couldn&apos;t load the register shifts data. Please try again.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center pt-2">
            <Button className="gap-2 rounded-xl font-bold" onClick={() => reset()}>
              <RotateCcw className="h-4 w-4" />
              Try Again
            </Button>
            <Button variant="outline" className="gap-2 rounded-xl font-semibold" asChild>
              <Link href="/pos">
                <Home className="h-4 w-4" />
                Go to POS
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
