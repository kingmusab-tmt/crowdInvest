const CACHE_NAME = "crowdinvest-cache-v2";
const PRECACHE_URLS = [
  "/manifest.json",
  "/favicon.ico",
  "/android-chrome-192x192.png",
  "/android-chrome-512x512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => (key !== CACHE_NAME ? caches.delete(key) : null))
        )
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Only handle same-origin requests and skip API calls
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) {
    return;
  }

  // Next.js build output is content-hashed per deploy (new hash on every build),
  // so let the browser's own HTTP cache handle it instead of the SW. Caching it
  // here would let a stale hashed URL survive after a redeploy and 404.
  if (url.pathname.startsWith("/_next/")) {
    return;
  }

  // HTML navigations: network-first so users always land on the current build.
  // Falling back to cache-first here is what causes stale pages (referencing
  // JS chunks from a previous deploy that no longer exist) after every deploy.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        try {
          const response = await fetch(request);
          if (response && response.status === 200) {
            cache.put(request, response.clone());
          }
          return response;
        } catch {
          const cached = await cache.match(request);
          return cached || cache.match("/");
        }
      })()
    );
    return;
  }

  // Other same-origin static assets: cache-first with background revalidation.
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);

      const networkFetch = fetch(request)
        .then((response) => {
          if (
            response &&
            response.status === 200 &&
            response.type === "basic"
          ) {
            cache.put(request, response.clone());
          }
          return response;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })()
  );
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: data.icon || "/android-chrome-192x192.png",
    badge: "/android-chrome-192x192.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: "push-notification",
    },
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (event) => {
  if (event.action === "close") {
    event.notification.close();
    return;
  }

  event.notification.close();
  const targetUrl = event.notification?.data?.url || "/dashboard/notifications";
  event.waitUntil(clients.openWindow(targetUrl));
});

self.addEventListener("notificationclose", (event) => {
  // Optional: Track notification dismissals
  console.log("Notification dismissed:", event.notification.tag);
});
