const CACHE_VERSION = new Date().getTime(); // Atualiza sempre que houver mudanças
const CACHE_NAME = `romaneio-cache-${CACHE_VERSION}`;
const OFFLINE_URL = "offline.html";

const FILES_TO_CACHE = [
    "/",
    "index.html",
    "offline.html",
    "image.png",
    "style.css",
    "script.js",
    "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.17.4/xlsx.full.min.js",
    "https://unpkg.com/html5-qrcode"
];

// Instalação do Service Worker e armazenamento no cache
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(FILES_TO_CACHE);
        })
    );
    self.skipWaiting(); // Ativa imediatamente o novo Service Worker
});

// Ativação e remoção de caches antigos
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
    self.clients.claim(); // Garante que todos os clientes usem a versão nova imediatamente
});

// Intercepta as requisições e usa um modelo "offline-first"
self.addEventListener("fetch", (event) => {
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                return caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, response.clone());
                    return response;
                });
            })
            .catch(() => caches.match(event.request).then((response) => {
                return response || caches.match(OFFLINE_URL);
            }))
    );
});
