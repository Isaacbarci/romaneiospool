const CACHE_VERSION = new Date().toISOString(); // Versão dinâmica baseada na data
const CACHE_NAME = `romaneio-cache-${CACHE_VERSION}`;

// Função para adicionar um arquivo ao cache
const addToCache = async (cacheName, file) => {
    try {
        const cache = await caches.open(cacheName);
        await cache.add(file);
    } catch (error) {
        console.error(`Erro ao adicionar ${file} ao cache:`, error);
    }
};

// Instalação do Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(async (cache) => {
                const urlsToCache = [
                    '/',
                    'index.html',
                    'image.png'
                ];
                await cache.addAll(urlsToCache);

                // Faz fetch manual dos arquivos externos para evitar CORS
                const externalUrls = [
                    'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.17.4/xlsx.full.min.js',
                    'https://unpkg.com/html5-qrcode'
                ];
                await Promise.all(externalUrls.map(async (url) => {
                    try {
                        const response = await fetch(url, { mode: 'no-cors' });
                        await cache.put(url, response);
                    } catch (error) {
                        console.warn(`Falha ao cachear ${url}:`, error);
                    }
                }));
            })
    );
    self.skipWaiting(); // Força a ativação imediata
});

// Intercepta as requisições e serve do cache
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request).catch(() => {
                return new Response('Erro ao buscar o recurso e não está no cache.', {
                    status: 408,
                    statusText: 'Network Error'
                });
            });
        })
    );
});

// Mensagem para adicionar um novo arquivo ao cache
self.addEventListener('message', (event) => {
    if (event.data.action === 'addToCache') {
        addToCache(CACHE_NAME, event.data.file);
    }
});

// Atualiza o cache quando houver uma nova versão
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log(`Removendo cache antigo: ${cache}`);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    self.clients.claim(); // Garante que os clientes usem o novo Service Worker imediatamente
    console.log("Service Worker Version:", CACHE_VERSION);
});
