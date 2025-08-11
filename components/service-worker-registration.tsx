"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    // This code runs only on the client-side, after the component mounts
    if ("serviceWorker" in navigator) {
      const register = async () => {
        try {
          const registration = await navigator.serviceWorker.register(
            "/sw.js",
            {
              scope: "/",
            }
          );
          console.log(
            "ServiceWorker registration successful with scope:",
            registration.scope
          );

          // If there's an updated worker waiting, activate it immediately
          if (registration.waiting) {
            registration.waiting.postMessage({ type: "SKIP_WAITING" });
          }

          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (!newWorker) return;
            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                newWorker.postMessage({ type: "SKIP_WAITING" });
              }
            });
          });
        } catch (error) {
          console.error("ServiceWorker registration failed:", error);
        }
      };
      register();
    }
  }, []);

  return null; // This component doesn't render anything
}
