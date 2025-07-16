"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    // This code runs only on the client-side, after the component mounts
    if ("serviceWorker" in navigator) {
      // Register immediately instead of waiting for load event
      navigator.serviceWorker
        .register("/service-worker.js")
        .then((registration) => {
          console.log(
            "ServiceWorker registration successful with scope:",
            registration.scope
          );
        })
        .catch((error) => {
          console.error("ServiceWorker registration failed:", error);
        });
    }
  }, []);

  return null; // This component doesn't render anything
}
