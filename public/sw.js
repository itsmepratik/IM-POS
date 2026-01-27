// Service Worker for POS System
// Ensures fresh data and automatic cache invalidation

// IMPORTANT: Update this version number on every deploy to invalidate old caches
const SW_VERSION = "1.0.1";
const CACHE_NAME = `pos-app-v${SW_VERSION}`;
const STATIC_CACHE_NAME = `pos-static-v${SW_VERSION}`;

// Resources that should always be fetched fresh (network-first)
const NETWORK_FIRST_PATTERNS = [
  /\/api\//, // All API endpoints
  /\/_next\/data\//, // Next.js data routes
  /\/auth\//, // Auth pages
  /\/pos\//, // POS pages (critical for business)
  /\/transactions\//, // Transaction pages
  /\/inventory\//, // Inventory pages
  /\/customers\//, // Customer pages
  /\/_next\/static\//, // Next.js static assets - Changed to Network First for immediate updates
  /\.(js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|webp|ico)$/i, // Static files
];

// Resources that can use stale-while-revalidate (performance + freshness)
// keeping empty for now as we want aggressive updates
const STALE_WHILE_REVALIDATE_PATTERNS = [];

// Resources that should never be cached
const NO_CACHE_PATTERNS = [
  /\/api\/auth\//, // Auth endpoints
  /\/api\/checkout\//, // Checkout endpoints
  /\/api\/transactions\//, // Transaction endpoints
];

// Install event - clean up old caches
self.addEventListener("install", (event) => {
  console.log(`[SW] Installing service worker version ${SW_VERSION}`);

  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheNames = await caches.keys();
      const oldCaches = cacheNames.filter(
        (name) => name !== CACHE_NAME && name !== STATIC_CACHE_NAME
      );

      await Promise.all(
        oldCaches.map((cacheName) => {
          console.log(`[SW] Deleting old cache: ${cacheName}`);
          return caches.delete(cacheName);
        })
      );

      // Skip waiting to activate immediately
      await self.skipWaiting();
      console.log(`[SW] Service worker installed and ready`);
    })()
  );
});

// Activate event - take control of all clients immediately
self.addEventListener("activate", (event) => {
  console.log(`[SW] Activating service worker version ${SW_VERSION}`);

  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheNames = await caches.keys();
      const oldCaches = cacheNames.filter(
        (name) => name !== CACHE_NAME && name !== STATIC_CACHE_NAME
      );

      await Promise.all(
        oldCaches.map((cacheName) => {
          console.log(`[SW] Deleting old cache: ${cacheName}`);
          return caches.delete(cacheName);
        })
      );

      // Take control of all clients immediately
      await self.clients.claim();
      console.log(`[SW] Service worker activated and controlling clients`);

      // Notify all clients about the update
      const clients = await self.clients.matchAll({
        includeUncontrolled: true,
      });
      clients.forEach((client) => {
        client.postMessage({
          type: "SW_ACTIVATED",
          version: SW_VERSION,
        });
      });
    })()
  );
});

// Helper: Check if URL matches any pattern
function matchesPattern(url, patterns) {
  return patterns.some((pattern) => pattern.test(url));
}

// Helper: Check if request should bypass cache
function shouldBypassCache(request) {
  const url = new URL(request.url);

  // Never cache auth-related requests
  if (matchesPattern(url.pathname, NO_CACHE_PATTERNS)) {
    return true;
  }

  // Never cache non-GET requests
  if (request.method !== "GET") {
    return true;
  }

  return false;
}

// Network-first strategy: Try network first, fallback to cache
async function networkFirst(request) {
  try {
    // Try network first with a timeout
    const networkPromise = fetch(request);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Network timeout")), 5000)
    );

    const response = await Promise.race([networkPromise, timeoutPromise]);

    // If successful, update cache in background
    if (response && response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone()).catch(() => {
        // Ignore cache errors
      });
    }

    return response;
  } catch (error) {
    console.log(`[SW] Network failed for ${request.url}, trying cache`);

    // Network failed, try cache
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    // Both failed, return error response
    throw error;
  }
}

// Stale-while-revalidate strategy: Return cache immediately, update in background
async function staleWhileRevalidate(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  const cached = await cache.match(request);

  // Fetch fresh version in background
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone()).catch(() => {
          // Ignore cache errors
        });
      }
      return response;
    })
    .catch(() => {
      // Ignore fetch errors
    });

  // Return cached version immediately if available
  if (cached) {
    // Don't await the fetch, let it happen in background
    fetchPromise.catch(() => {});
    return cached;
  }

  // No cache, wait for network
  const response = await fetchPromise;
  if (response && response.ok) {
    cache.put(request, response.clone()).catch(() => {});
  }

  return response || new Response("Resource unavailable", { status: 503 });
}

// Main fetch handler
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests (except same-origin)
  if (url.origin !== self.location.origin) {
    // For cross-origin, just pass through
    return;
  }

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Handle navigation requests (HTML pages) - always network-first
  if (request.mode === "navigate" || request.destination === "document") {
    event.respondWith(networkFirst(request));
    return;
  }

  // Bypass cache for critical endpoints
  if (shouldBypassCache(request)) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response("Service unavailable", { status: 503 });
      })
    );
    return;
  }

  // Network-first for API and dynamic content
  if (matchesPattern(url.pathname, NETWORK_FIRST_PATTERNS)) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Stale-while-revalidate for static assets
  if (matchesPattern(url.pathname, STALE_WHILE_REVALIDATE_PATTERNS)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Default: network-first for everything else
  event.respondWith(networkFirst(request));
});

// Handle messages from the app
self.addEventListener("message", (event) => {
  const { type, payload } = event.data || {};

  switch (type) {
    case "SKIP_WAITING":
      self.skipWaiting();
      break;

    case "CLEAR_CACHE":
      event.waitUntil(
        (async () => {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map((name) => caches.delete(name)));
          console.log("[SW] All caches cleared");

          const clients = await self.clients.matchAll();
          clients.forEach((client) => {
            client.postMessage({ type: "CACHE_CLEARED" });
          });
        })()
      );
      break;

    case "GET_VERSION":
      event.ports[0]?.postMessage({ version: SW_VERSION });
      break;

    case "CHECK_UPDATE":
      // Force update check by fetching the service worker script
      event.waitUntil(
        (async () => {
          try {
            const response = await fetch("/sw.js", { cache: "no-store" });
            const text = await response.text();
            // Simple check: if the version in the new SW is different, update
            const newVersionMatch = text.match(/const SW_VERSION = "([^"]+)"/);
            if (newVersionMatch && newVersionMatch[1] !== SW_VERSION) {
              const clients = await self.clients.matchAll();
              clients.forEach((client) => {
                client.postMessage({
                  type: "UPDATE_AVAILABLE",
                  currentVersion: SW_VERSION,
                  newVersion: newVersionMatch[1],
                });
              });
            }
          } catch (error) {
            console.error("[SW] Error checking for updates:", error);
          }
        })()
      );
      break;
  }
});

// Periodic update check (every 5 minutes)
setInterval(async () => {
  try {
    const response = await fetch("/sw.js", { cache: "no-store" });
    const text = await response.text();
    const newVersionMatch = text.match(/const SW_VERSION = "([^"]+)"/);

    if (newVersionMatch && newVersionMatch[1] !== SW_VERSION) {
      console.log(
        `[SW] Update available: ${SW_VERSION} -> ${newVersionMatch[1]}`
      );

      // Notify clients
      const clients = await self.clients.matchAll();
      clients.forEach((client) => {
        client.postMessage({
          type: "UPDATE_AVAILABLE",
          currentVersion: SW_VERSION,
          newVersion: newVersionMatch[1],
        });
      });
    }
  } catch (error) {
    // Silently fail - network might be down
  }
}, 5 * 60 * 1000); // 5 minutes
