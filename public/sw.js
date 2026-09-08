self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Intentionally no caching: this app is fully dynamic (auth, live chat,
// live data), so caching responses risks serving stale or broken state.
// This service worker exists only to satisfy "installable" PWA checks.
self.addEventListener("fetch", () => {});
