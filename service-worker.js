const CACHE_NAME = 'romaneio-cache-v25';

// Lista de arquivos essenciais que serão salvos para uso offline
const FILES_TO_CACHE = [
    '/',
    'index.html',
    'image.png',
    'app.js',             // se tiver seu próprio JS
    'style.css',          // se tiver CSS
    'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.17.4/xlsx.full.min.js',
    'https://unpkg.com/html5-qrcode',
];

// Adiciona ao cache durante a instalação
self.addEventListener('install', (event) => {
    console.log('[SW] Instalando...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Cache inicial');
            return cache.addAll(FILES_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// Ativação: limpa caches antigos
self.addEventListener('activate', (event) => {
    console.log('[SW] Ativando...');
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

// Sempre tenta pegar da rede, se falhar usa o cache (modo offline real)
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                return response;
            })
            .catch(() => {
                return caches.match(event.request);
            })
    );
});

// Permite adicionar arquivos dinamicamente
self.addEventListener('message', (event) => {
    if (event.data.action === 'addToCache') {
        caches.open(CACHE_NAME).then((cache) => {
            cache.add(event.data.file);
        });
    }
});
