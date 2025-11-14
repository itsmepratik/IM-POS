"use client";

import { useEffect, useState } from "react";

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isUpdateAvailable: boolean;
  version: string | null;
}

/**
 * Hook to interact with the service worker
 * Provides utilities to check for updates and clear cache
 */
export function useServiceWorker() {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: false,
    isRegistered: false,
    isUpdateAvailable: false,
    version: null,
  });

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    setState((prev) => ({ ...prev, isSupported: true }));

    // Check if service worker is registered
    navigator.serviceWorker.getRegistration().then((registration) => {
      if (registration) {
        setState((prev) => ({ ...prev, isRegistered: true }));
      }
    });

    // Listen for update messages
    const handleMessage = (event: MessageEvent) => {
      const { type, version, newVersion } = event.data || {};

      if (type === "UPDATE_AVAILABLE") {
        setState((prev) => ({
          ...prev,
          isUpdateAvailable: true,
          version: newVersion || null,
        }));
      } else if (type === "SW_ACTIVATED") {
        setState((prev) => ({
          ...prev,
          version: version || null,
        }));
      }
    };

    navigator.serviceWorker.addEventListener("message", handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener("message", handleMessage);
    };
  }, []);

  /**
   * Manually check for service worker updates
   */
  const checkForUpdate = async () => {
    if (!navigator.serviceWorker.controller) {
      return false;
    }

    try {
      navigator.serviceWorker.controller.postMessage({ type: "CHECK_UPDATE" });
      return true;
    } catch (error) {
      console.error("Error checking for updates:", error);
      return false;
    }
  };

  /**
   * Force update the service worker
   */
  const updateServiceWorker = async () => {
    if (!navigator.serviceWorker.controller) {
      return false;
    }

    try {
      navigator.serviceWorker.controller.postMessage({ type: "SKIP_WAITING" });
      // Reload after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      return true;
    } catch (error) {
      console.error("Error updating service worker:", error);
      return false;
    }
  };

  /**
   * Clear all service worker caches
   */
  const clearCache = async () => {
    if (!navigator.serviceWorker.controller) {
      return false;
    }

    try {
      navigator.serviceWorker.controller.postMessage({ type: "CLEAR_CACHE" });
      return true;
    } catch (error) {
      console.error("Error clearing cache:", error);
      return false;
    }
  };

  /**
   * Get the current service worker version
   */
  const getVersion = async (): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!navigator.serviceWorker.controller) {
        resolve(null);
        return;
      }

      const channel = new MessageChannel();
      channel.port1.onmessage = (event) => {
        resolve(event.data.version || null);
      };

      navigator.serviceWorker.controller.postMessage(
        { type: "GET_VERSION" },
        [channel.port2]
      );

      // Timeout after 1 second
      setTimeout(() => resolve(null), 1000);
    });
  };

  return {
    ...state,
    checkForUpdate,
    updateServiceWorker,
    clearCache,
    getVersion,
  };
}

