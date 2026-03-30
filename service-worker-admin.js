const ADMIN_CACHE = "kultiv-admin-shell-v1";
const ADMIN_SCOPE_START = "./index2.html";
const ADMIN_ASSETS = [
  "./index2.html",
  "./manifest-admin.webmanifest",
  "./admin-icon-192.png",
  "./admin-icon-512.png",
  "./logo.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(ADMIN_CACHE).then((cache) => cache.addAll(ADMIN_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== ADMIN_CACHE)
            .filter((key) => key.startsWith("kultiv-admin-shell-"))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (!requestUrl.pathname.endsWith("/index2.html") && !requestUrl.pathname.endsWith("/index2.html/")) {
    if (
      !requestUrl.pathname.endsWith("/manifest-admin.webmanifest") &&
      !requestUrl.pathname.endsWith("/admin-icon-192.png") &&
      !requestUrl.pathname.endsWith("/admin-icon-512.png") &&
      !requestUrl.pathname.endsWith("/logo.png")
    ) {
      return;
    }
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(ADMIN_CACHE).then((cache) => cache.put(ADMIN_SCOPE_START, copy));
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match(ADMIN_SCOPE_START)))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type === "opaque") {
          return response;
        }

        const copy = response.clone();
        caches.open(ADMIN_CACHE).then((cache) => cache.put(event.request, copy));
        return response;
      });
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || "./index2.html";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsList) => {
      const existingClient = clientsList.find((client) => client.url.includes("index2.html"));
      if (existingClient) {
        return existingClient.focus();
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }

      return undefined;
    })
  );
});
