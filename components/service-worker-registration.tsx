"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    // DISABLED: Service worker completely disabled to prevent reload loops
    // If you need PWA features, investigate the reload loop issue first

    // Unregister any existing service workers to clean up
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister();
          console.log("Service Worker unregistered:", registration.scope);
        });
      });
    }
  }, []);

  return null; // This component doesn't render anything
}
