// A unique name for our cache.
// IMPORTANT: Bump this version on deploys to clear old caches.
const CACHE_NAME = "pos-runtime-cache-v3";

// The self object refers to the service worker itself.
// We are adding an event listener for the 'install' event.
self.addEventListener("install", () => {
  // skipWaiting() forces the waiting service worker to become the active service worker.
  // This is crucial for ensuring updates are applied immediately.
  self.skipWaiting();
  console.log("Service Worker: Installed");
});

// Add an event listener for the 'activate' event.
// This event is fired when the service worker becomes active.
self.addEventListener("activate", (event) => {
  // We want to clear out any old caches.
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          // If a cache's name is not our current CACHE_NAME, we delete it.
          if (cache !== CACHE_NAME) {
            console.log("Service Worker: Clearing old cache", cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  console.log("Service Worker: Activated");
  // Immediately take control of all pages so new SW applies without a hard refresh
  self.clients.claim();
});

// Add an event listener for the 'fetch' event.
// This event is fired for every network request the page makes.
self.addEventListener("fetch", (event) => {
  // Only handle GET
  if (event.request.method !== "GET") return;

  const req = event.request;
  const url = new URL(req.url);

  // For navigations/HTML, always go to network with no-store to avoid stale HTML
  const isNavigation =
    req.mode === "navigate" ||
    req.destination === "document" ||
    (req.headers.get("accept") || "").includes("text/html");

  if (isNavigation) {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req, { cache: "no-store" });
          // Optionally cache a copy for offline fallback
          const cache = await caches.open(CACHE_NAME);
          cache.put(req, fresh.clone());
          return fresh;
        } catch {
          const cached = await caches.match(req);
          if (cached) return cached;
          return new Response("Offline", {
            status: 503,
            statusText: "Offline",
          });
        }
      })()
    );
    return;
  }

  // For same-origin static assets (js/css/img/fonts), use network-first with no-store, fallback to cache
  if (url.origin === self.location.origin) {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req, { cache: "no-store" });
          const cache = await caches.open(CACHE_NAME);
          cache.put(req, fresh.clone());
          return fresh;
        } catch {
          const cached = await caches.match(req);
          if (cached) return cached;
          throw new Error("Request failed and no cache available");
        }
      })()
    );
    return;
  }

  // For cross-origin requests, just pass-through network, fallback to cache
  event.respondWith(
    (async () => {
      try {
        return await fetch(req, { cache: "no-store" });
      } catch {
        const cached = await caches.match(req);
        if (cached) return cached;
        throw new Error("Request failed and no cache available");
      }
    })()
  );
});

// Optional: allow pages to prompt this SW to skip waiting (if you wire it up in the app)
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
