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
    // Não removemos caches antigos.
    self.clients.claim(); // Garante que o novo Service Worker assuma o controle imediatamente
});

self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            // Se o recurso estiver no cache, ele é retornado
            if (response) {
                return response;
            }
            // Caso contrário, realiza a requisição na rede
            return fetch(event.request);
        })
    );
});
