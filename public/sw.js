// A unique name for our cache.
// IMPORTANT: Bump this version on deploys to clear old caches.
const CACHE_NAME = "pos-runtime-cache-v4";

// The self object refers to the service worker itself.
// We are adding an event listener for the 'install' event.
self.addEventListener("install", (event) => {
  // Skip waiting only when explicitly requested to avoid reload loops
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
  // Only claim clients when explicitly requested to avoid reload loops
});

// Add an event listener for the 'fetch' event.
// This event is fired for every network request the page makes.
self.addEventListener("fetch", (event) => {
  // Only handle GET
  if (event.request.method !== "GET") return;

  const req = event.request;
  const url = new URL(req.url);

  // For navigations/HTML, bypass SW entirely to avoid navigation loops
  const isNavigation =
    req.mode === "navigate" ||
    req.destination === "document" ||
    (req.headers.get("accept") || "").includes("text/html");

  if (isNavigation) {
    // Let the network handle navigations; do not cache HTML
    return;
  }

  // For same-origin static assets (js/css/img/fonts), use cache-first strategy
  if (url.origin === self.location.origin) {
    event.respondWith(
      (async () => {
        // Check cache first for static assets
        const cached = await caches.match(req);
        if (cached) return cached;

        try {
          const fresh = await fetch(req);
          // Avoid caching redirects or opaque responses
          if (!fresh || !fresh.ok || fresh.type === "opaqueredirect") {
            return fresh;
          }
          const cache = await caches.open(CACHE_NAME);
          cache.put(req, fresh.clone());
          return fresh;
        } catch (error) {
          console.warn("Service Worker: Request failed for", req.url);
          // Return a generic offline response instead of throwing
          return new Response("Resource unavailable offline", {
            status: 503,
            statusText: "Service Unavailable",
          });
        }
      })()
    );
    return;
  }

  // For cross-origin requests (like Vercel analytics), fail silently to avoid errors
  const isVercelScript =
    url.hostname.includes("vercel.com") && url.pathname.includes("script.js");
  if (isVercelScript) {
    // Skip handling Vercel scripts that are failing
    return;
  }

  // For other cross-origin requests, pass-through network, fallback to cache
  event.respondWith(
    (async () => {
      try {
        return await fetch(req);
      } catch {
        const cached = await caches.match(req);
        if (cached) return cached;
        // Don't throw errors for cross-origin requests
        return new Response("Resource unavailable", {
          status: 503,
          statusText: "Service Unavailable",
        });
      }
    })()
  );
});

// Handle messages from the app
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
    // Notify clients that the new service worker is ready
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({ type: "SW_UPDATED" });
      });
    });
  }
});
