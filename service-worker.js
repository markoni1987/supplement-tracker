self.addEventListener("install", event => {
  event.waitUntil(
    caches.open("supplement-tracker-v1").then(cache => {
      return cache.addAll([
        "index.html",
        "style.css",
        "script.js",
        "manifest.json",
        "icon.png",
        // Falls du weitere Assets hast, hier ergänzen
      ]);
    })
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
