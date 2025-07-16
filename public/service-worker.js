// A unique name for our cache.
// IMPORTANT: Change this name every time you deploy a new version.
const CACHE_NAME = "my-nextjs-app-cache-v1";

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

  // Network First Strategy:
  // We try to fetch the request from the network first.
  // If the network request is successful, we cache it and return the response.
  // If the network request fails, we try to serve it from the cache.
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
