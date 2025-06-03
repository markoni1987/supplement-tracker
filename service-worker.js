self.addEventListener("install", e => {
  e.waitUntil(
    caches.open("supplement-tracker").then(cache => {
      return cache.addAll([
        "/",
        "/index.html",
        "/script.js",
        "/manifest.json",
        "/icon.png"
      ]);
    })
  );
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(response => response || fetch(e.request))
  );
});
