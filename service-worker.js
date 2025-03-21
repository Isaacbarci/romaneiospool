const CACHE_NAME = 'romaneio-cache-v22';

const addToCache = async (cacheName, file) => {
    const cache = await caches.open(cacheName);
    await cache.add(file);
};

// Instalação (pré-cache de arquivos básicos)
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll([
                '/',
                'index.html',
                'offline.html',
                'image.png',
                'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.17.4/xlsx.full.min.js',
                'https://unpkg.com/html5-qrcode',
            ]))
    );
    self.skipWaiting();
});

// Ativação: remove caches antigos
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Busca sempre da rede quando online, usa cache só offline
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                return response;
            })
            .catch(() => {
                return caches.match(event.request)
                    .then((cachedResponse) => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }

                        // Se for uma navegação (HTML) e não houver cache, mostra offline.html
                        if (event.request.mode === 'navigate') {
                            return caches.match('offline.html');
                        }
                    });
            })
    );
});

// Permite adicionar dinamicamente arquivos ao cache
self.addEventListener('message', (event) => {
    if (event.data.action === 'addToCache') {
        addToCache(CACHE_NAME, event.data.file);
    }
});