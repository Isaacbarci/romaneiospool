const CACHE_VERSION = new Date().getTime();
const CACHE_NAME = `romaneio-cache-${CACHE_VERSION}`;
const OFFLINE_PAGE = 'offline.html';

// Função para adicionar um arquivo ao cache
const addToCache = async (cacheName, file) => {
    try {
        const cache = await caches.open(cacheName);
        await cache.add(file);
    } catch (error) {
        console.error(`Erro ao adicionar ao cache: ${file}`, error);
    }
};

// Instalação do Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        (async () => {
            try {
                const cache = await caches.open(CACHE_NAME);
                await cache.addAll([
                    '/',
                    'index.html',
                    'image.png',
                    'offline.html', // Página de fallback offline
                    'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.17.4/xlsx.full.min.js',
                    'https://unpkg.com/html5-qrcode',
                ]);
            } catch (error) {
                console.error('Erro ao adicionar arquivos ao cache', error);
            }
        })()
    );
});

// Intercepta as requisições e serve do cache ou busca online
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then(async (response) => {
            if (response) {
                return response; // Retorna do cache se disponível
            }
            try {
                const fetchResponse = await fetch(event.request);

                // Adiciona resposta no cache dinâmico se for um arquivo válido
                if (!fetchResponse || fetchResponse.status !== 200) {
                    return fetchResponse;
                }

                const cache = await caches.open(CACHE_NAME);
                cache.put(event.request, fetchResponse.clone()); // Armazena dinamicamente no cache
                return fetchResponse;
            } catch (error) {
                console.error(`Erro ao buscar recurso: ${event.request.url}`, error);
                return caches.match(OFFLINE_PAGE); // Exibe página offline se falhar
            }
        })
    );
});

// Mensagem para adicionar um novo arquivo ao cache dinamicamente
self.addEventListener('message', (event) => {
    if (event.data && event.data.action === 'addToCache' && event.data.file) {
        addToCache(CACHE_NAME, event.data.file);
    }
});

// Atualiza o cache removendo versões antigas
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) =>
            Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log(`Removendo cache antigo: ${cache}`);
                        return caches.delete(cache);
                    }
                })
            )
        )
    );
});
