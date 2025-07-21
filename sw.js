const CACHE_NAME = "MileApp-v2"; // ✅ Bump version to force refresh
const urlsToCache = [
  "./index.html",
  "./style.css",
  "./auth.js",
  "./map.js",
  "./tracking.js",
  "./storage.js",
  "./ui.js",
  "./main.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
  ];

// ✅ Install: Cache fresh files
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      try {
        // Diagnostics: test each URL before caching
        for (const url of urlsToCache) {
          try {
            const response = await fetch(url);
            if (!response.ok) {
              console.warn(`⚠️ Asset not found during caching: ${url}`);
            }
          } catch (err) {
            console.warn(`❌ Fetch error for ${url}:`, err);
          }
        }

        // Try to cache all
        await cache.addAll(urlsToCache);
        console.log("✅ Cached:", CACHE_NAME);
      } catch (err) {
        console.error("❌ Cache install failed:", err);
      }
    })
  );
});

// ✅ Activate: Clean up old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log("🧹 Removing old cache:", key);
            return caches.delete(key);
          }
        })
      )
    )
  );
});

// ✅ Fetch: Serve from cache, fallback to network
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
