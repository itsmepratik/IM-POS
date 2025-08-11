// A unique name for our cache.
// IMPORTANT: Change this name every time you deploy a new version.
// Increment this when you deploy to bust caches in the field.
const CACHE_NAME = "pos-app-cache-v3";

// The self object refers to the service worker itself.
// We are adding an event listener for the 'install' event.
self.addEventListener("install", (event) => {
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
});

// Add an event listener for the 'fetch' event.
// This event is fired for every network request the page makes.
self.addEventListener("fetch", (event) => {
  // We only want to handle GET requests.
  if (event.request.method !== "GET") {
    return;
  }

  // Avoid caching Next.js build artifacts and dynamic chunk files to prevent
  // stale chunk issues (ChunkLoadError) when a new build is deployed.
  const url = new URL(event.request.url);
  const isNextChunk =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.includes(".hot-update.") ||
    url.pathname.endsWith(".map");

  if (isNextChunk) {
    // Always go to the network for Next.js assets and do not cache
    event.respondWith(fetch(event.request));
    return;
  }

  // Network First Strategy for app/content requests
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        // If the fetch was successful, clone the response and cache it.
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, resClone);
        });
        return res;
      })
      .catch((err) => {
        // If the network request fails, try to find the response in the cache.
        console.log(
          `Service Worker: Fetch failed for ${event.request.url}; trying cache.`
        );
        return caches.match(event.request).then((res) => res);
      })
  );
});
