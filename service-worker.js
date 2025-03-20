const CACHE_NAME = 'romaneio-cache';
const VERSION_URL = '/version.json'; // URL do arquivo de versão no servidor
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
        (async () => {
            try {
                const cache = await caches.open(CACHE_NAME);
                await cache.addAll(FILES_TO_CACHE);
                console.log('✅ Arquivos adicionados ao cache com sucesso!');
            } catch (error) {
                console.error('❌ Erro ao adicionar arquivos ao cache:', error);
            }
        })()
    );
    self.skipWaiting(); // Ativa o novo Service Worker imediatamente
});

// Intercepta as requisições e serve do cache ou busca online
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then(async (response) => {
            if (response) {
                console.log(`🔍 Servindo do cache: ${event.request.url}`);
                return response;
            }

            try {
                const fetchResponse = await fetch(event.request);

                // Verifica se o fetch foi bem-sucedido antes de armazenar no cache dinâmico
                if (!fetchResponse || fetchResponse.status !== 200) {
                    return fetchResponse;
                }

                const cache = await caches.open(CACHE_NAME);
                cache.put(event.request, fetchResponse.clone()); // Adiciona resposta no cache dinâmico
                console.log(`💾 Adicionado ao cache dinâmico: ${event.request.url}`);
                return fetchResponse;
            } catch (error) {
                console.error(`❌ Erro ao buscar recurso: ${event.request.url}`, error);
                return caches.match(OFFLINE_PAGE); // Se falhar, exibe a página offline
            }
        })
    );
});

// Função para verificar atualizações no version.json
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
                        console.log(`🗑 Removendo cache antigo: ${cache}`);
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
        } else {
            console.log('🔹 Nenhuma atualização detectada.');
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
                        console.log(`🗑 Removendo cache antigo: ${cache}`);
                        return caches.delete(cache);
                    }
                })
            )
        )
    );
    self.clients.claim();
    checkForUpdate();
});

// Notificação para a página recarregar quando houver atualização
self.addEventListener('message', (event) => {
    if (event.data && event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});
