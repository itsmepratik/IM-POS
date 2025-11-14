"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function ServiceWorkerRegistration() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    let registration: ServiceWorkerRegistration | null = null;
    let refreshing = false;

    // Register service worker
    const registerSW = async () => {
      try {
        registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        console.log("[SW Registration] Service Worker registered:", registration.scope);

        // Check for updates immediately
        await registration.update();

        // Handle updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration!.installing;
          if (!newWorker) return;

          console.log("[SW Registration] New service worker found");

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // New service worker is ready, but old one is still controlling
              console.log("[SW Registration] New service worker installed, update available");
              setUpdateAvailable(true);
              
              toast({
                title: "Update Available",
                description: "A new version is available. Click to update.",
                action: (
                  <button
                    onClick={handleUpdate}
                    className="text-primary font-medium hover:underline"
                  >
                    Update Now
                  </button>
                ),
                duration: 10000,
              });
            }
          });
        });

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener("message", (event) => {
          const { type, version, currentVersion, newVersion } = event.data || {};

          switch (type) {
            case "SW_ACTIVATED":
              console.log(`[SW Registration] Service worker activated: ${version}`);
              // Optionally reload the page to ensure fresh content
              if (registration?.waiting) {
                // There's a waiting service worker, prompt user
                setUpdateAvailable(true);
              }
              break;

            case "UPDATE_AVAILABLE":
              console.log(
                `[SW Registration] Update available: ${currentVersion} -> ${newVersion}`
              );
              setUpdateAvailable(true);
              toast({
                title: "Update Available",
                description: `New version ${newVersion} is available. Click to update.`,
                action: (
                  <button
                    onClick={handleUpdate}
                    className="text-primary font-medium hover:underline"
                  >
                    Update Now
                  </button>
                ),
                duration: 10000,
              });
              break;

            case "CACHE_CLEARED":
              console.log("[SW Registration] Cache cleared");
              toast({
                title: "Cache Cleared",
                description: "All cached data has been cleared.",
              });
              break;
          }
        });

        // Handle controller change (service worker takeover)
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (!refreshing) {
            refreshing = true;
            console.log("[SW Registration] New service worker controlling, reloading...");
            window.location.reload();
          }
        });

        // Periodic update check (every 10 minutes)
        const updateInterval = setInterval(async () => {
          if (registration) {
            try {
              await registration.update();
            } catch (error) {
              console.error("[SW Registration] Error checking for updates:", error);
            }
          }
        }, 10 * 60 * 1000); // 10 minutes

        // Check for updates on page visibility change
        document.addEventListener("visibilitychange", async () => {
          if (!document.hidden && registration) {
            try {
              await registration.update();
            } catch (error) {
              console.error("[SW Registration] Error checking for updates:", error);
            }
          }
        });

        return () => {
          clearInterval(updateInterval);
        };
      } catch (error) {
        console.error("[SW Registration] Service Worker registration failed:", error);
      }
    };

    registerSW();
  }, [toast]);

  const handleUpdate = async () => {
    if (!navigator.serviceWorker.controller) {
      return;
    }

    setIsInstalling(true);

    try {
      // Send message to skip waiting
      navigator.serviceWorker.controller.postMessage({ type: "SKIP_WAITING" });

      // Wait a bit for the service worker to activate
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Reload the page to get the new version
      window.location.reload();
    } catch (error) {
      console.error("[SW Registration] Error updating service worker:", error);
      setIsInstalling(false);
      toast({
        title: "Update Failed",
        description: "Failed to update. Please refresh the page manually.",
        variant: "destructive",
      });
    }
  };

  // Expose update function globally for manual updates
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).updateServiceWorker = handleUpdate;
      (window as any).clearServiceWorkerCache = async () => {
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({ type: "CLEAR_CACHE" });
        }
      };
    }
  }, []);

  return null; // This component doesn't render anything
}
