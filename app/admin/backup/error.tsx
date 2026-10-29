"use client";

import { useEffect } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function BackupError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.JSX.Element {
  useEffect(() => {
    console.error("Backup console error:", error.message);
  }, [error]);

  return (
    <Layout>
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Backup console unavailable</CardTitle>
          <CardDescription>
            The backup console failed to load. Your data is unaffected.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {error.message || "Unexpected error."}
          </p>
          <Button onClick={reset}>Try again</Button>
        </CardContent>
      </Card>
    </Layout>
  );
}
