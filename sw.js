/* Racha Conta: guarda o app para abrir sem internet. Para publicar uma versao nova, mude o numero em VERSAO. */
const VERSAO = 'racha-conta-v2';
const BASE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];
const EXTERNOS = /(^|\.)(cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com)$/;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k)))).then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    // Arquivos do proprio app: tenta a internet (para pegar atualizacoes) e cai no que foi guardado.
    e.respondWith(
      fetch(req).then(r => { const c = r.clone(); caches.open(VERSAO).then(ch => ch.put(req, c)); return r; })
        .catch(() => caches.match(req).then(m => m || caches.match('./index.html')))
    );
  } else if (EXTERNOS.test(url.hostname)) {
    // Fontes e biblioteca do QR Code: usa o que ja foi guardado e atualiza em segundo plano.
    e.respondWith(
      caches.match(req).then(m => {
        const rede = fetch(req).then(r => { const c = r.clone(); caches.open(VERSAO).then(ch => ch.put(req, c)); return r; }).catch(() => m);
        return m || rede;
      })
    );
  }
});
