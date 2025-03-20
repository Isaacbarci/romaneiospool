const CACHE_VERSION = new Date().getTime();
const CACHE_NAME = `romaneio-cache-${CACHE_VERSION}`;

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log("Cache atualizado:", CACHE_NAME);
            return cache.addAll([
                "/",
                "index.html",
                "style.css",
                "script.js"
            ]);
        })
    );
    self.skipWaiting(); // Ativa o novo Service Worker imediatamente
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log("Removendo cache antigo:", cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    self.clients.claim(); // Garante que o novo Service Worker assuma o controle imediatamente
});
