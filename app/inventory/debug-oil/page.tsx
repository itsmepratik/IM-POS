"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { debugFixOilProducts } from "@/lib/services/inventoryService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function DebugOilProductsPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // Override console.log to capture the output
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;

  const captureConsole = () => {
    console.log = (...args: any[]) => {
      const message = args
        .map((arg) =>
          typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)
        )
        .join(" ");
      setLogs((prev) => [...prev, `[LOG] ${message}`]);
      originalConsoleLog(...args);
    };

    console.error = (...args: any[]) => {
      const message = args
        .map((arg) =>
          typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)
        )
        .join(" ");
      setLogs((prev) => [...prev, `[ERROR] ${message}`]);
      originalConsoleError(...args);
    };
  };

  const restoreConsole = () => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  };

  const runDebugFunction = async () => {
    setLogs([]);
    setIsRunning(true);
    captureConsole();

    try {
      await debugFixOilProducts();
    } catch (error) {
      console.error("Error running debug function:", error);
    } finally {
      restoreConsole();
      setIsRunning(false);
    }
  };

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Debug Oil Products
        </h1>
        <div className="flex items-center gap-2">
          <Link href="/inventory">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Inventory
            </Button>
          </Link>
          <Button onClick={runDebugFunction} disabled={isRunning}>
            {isRunning ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Running...
              </>
            ) : (
              "Run Debug Function"
            )}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Debug Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-black text-green-400 font-mono p-4 rounded-md h-[600px] overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500">
                No logs yet. Run the debug function to see results.
              </div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
