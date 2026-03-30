const CACHE_NAME = "kultiv-shell-v6";
const LESSON_ASSETS = Array.from({ length: 30 }, (_, index) => `./lecon${index + 1}.html`);
const SHOP_ASSETS = [
  "./bluedream.png",
  "./gsc.png",
  "./og.png",
  "./white.png",
  "./lights.png",
  "./diesel.png",
  "./gelato.png",
  "./haze.png",
  "./cake.png",
  "./purple.png",
  "./tapis.png",
  "./lampe300.png",
  "./lampe720.png",
  "./tente.png",
  "./sac.png",
  "./scrog.png",
  "./the.png",
  "./hydro.png",
  "./qrcode.png",
];
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./index.html",
  "./manifest.webmanifest",
  "./manifest-admin.webmanifest",
  "./service-worker.js",
  "./icon-192.png",
  "./icon-512.png",
  "./admin-icon-192.png",
  "./admin-icon-512.png",
  "./logo.png",
  "./lesson.css",
  "./lesson.js",
  "./cookie.html",
  "./conditions.html",
  ...LESSON_ASSETS,
  ...SHOP_ASSETS,
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
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

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match("./index.html")))
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
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      });
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || "./index.html";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsList) => {
      const existingClient = clientsList.find((client) => client.url.includes("index.html"));
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
