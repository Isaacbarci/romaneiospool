const CACHE_NAME = 'romaneio-cache-' + new Date().getTime(); // Garante cache novo sempre
const VERSION_URL = '/version.json?v=' + new Date().getTime(); // Evita cache antigo
const OFFLINE_PAGE = 'offline.html';

// Lista de arquivos a serem armazenados no cache
const FILES_TO_CACHE = [
    '/',
    'index.html',
    'image.png',
    'offline.html',
    'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.17.4/xlsx.full.min.js',
    'https://unpkg.com/html5-qrcode',
];

// Instalação do Service Worker e cache inicial
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(FILES_TO_CACHE);
        })
    );
    self.skipWaiting(); // Ativa o novo Service Worker imediatamente
});

// Intercepta as requisições e serve do cache ou busca online
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            if (response) {
                return response;
            }
            return fetch(event.request).then((fetchResponse) => {
                if (!fetchResponse || fetchResponse.status !== 200) {
                    return fetchResponse;
                }
                return caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, fetchResponse.clone());
                    return fetchResponse;
                });
            });
        })
    );
});

// Atualiza o cache quando houver uma nova versão
async function checkForUpdate() {
    try {
        const response = await fetch(VERSION_URL, { cache: 'no-store' });
        const data = await response.json();
        const newVersion = data.version;

        const cache = await caches.open('cache-version');
        const cachedResponse = await cache.match('version');

        if (!cachedResponse || (await cachedResponse.text()) !== newVersion) {
            console.log(`🔄 Nova versão detectada: ${newVersion}. Atualizando cache...`);
            await cache.put('version', new Response(newVersion));

            // Apaga o cache antigo
            const cacheNames = await caches.keys();
            await Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME && cache !== 'cache-version') {
                        return caches.delete(cache);
                    }
                })
            );

            // Atualiza os arquivos no cache
            const newCache = await caches.open(CACHE_NAME);
            await newCache.addAll(FILES_TO_CACHE);

            // Notifica a página para recarregar automaticamente
            self.clients.matchAll().then((clients) => {
                clients.forEach((client) => client.postMessage({ action: 'reload' }));
            });
        }
    } catch (error) {
        console.error('❌ Erro ao verificar a versão do cache:', error);
    }
}

// Ativação do novo Service Worker e remoção do cache antigo
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) =>
            Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME && cache !== 'cache-version') {
                        return caches.delete(cache);
                    }
                })
            )
        )
    );
    self.clients.claim();
    checkForUpdate();
});
