"use client";

import { useEffect } from "react";

/**
 * Global component that listens for ChunkLoadErrors (which often happen
 * when new versions are deployed or due to network flakiness) and
 * automatically reloads the page to fetch the latest assets.
 */
export default function ChunkErrorHandler() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleChunkError = (error: unknown) => {
      if (!error || typeof error !== "object") return;

      const err = error as Record<string, unknown>;
      const errorMessage = typeof err.message === "string" ? err.message : "";
      const errorName = typeof err.name === "string" ? err.name : "";

      const isChunkError =
        errorName === "ChunkLoadError" ||
        errorMessage.includes("Loading chunk") ||
        errorMessage.includes("loading-chunk-failed") ||
        errorMessage.includes("Failed to fetch dynamically imported module");

      if (isChunkError) {
        console.warn("[ChunkErrorHandler] Chunk load error detected:", error);

        // Prevent infinite reload loops by checking sessionStorage
        const lastReloadStr = sessionStorage.getItem("last-chunk-error-reload");
        const now = Date.now();

        if (!lastReloadStr || now - parseInt(lastReloadStr, 10) > 10000) {
          sessionStorage.setItem("last-chunk-error-reload", now.toString());
          console.warn("[ChunkErrorHandler] Reloading page to fetch latest chunks...");
          window.location.reload();
        } else {
          console.error(
            "[ChunkErrorHandler] Chunk error reload loop detected. Aborting reload to prevent infinite loop."
          );
        }
      }
    };

    const handleError = (event: ErrorEvent) => {
      handleChunkError(event.error);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      handleChunkError(event.reason);
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  return null;
}
