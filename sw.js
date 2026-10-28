/* Ultradien : garde l'appli disponible hors ligne. Changer VERSION à chaque mise à jour des fichiers. */
const VERSION = "ultradien-v6";
const ASSETS = ["./", "./index.html", "./config.js", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-maskable.png", "./audio/nsdr.mp3"];
self.addEventListener("install", e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  // Seuls les fichiers de l'appli passent par le cache ; la synchro passe toujours par le réseau.
  const isAsset = ASSETS.some(a => new URL(a, self.registration.scope).pathname === url.pathname);
  if(e.request.method !== "GET" || url.origin !== location.origin || !(isAsset || e.request.mode === "navigate")) return;
  e.respondWith(caches.open(VERSION).then(async cache => {
    const hit = await cache.match(e.request, { ignoreSearch:true });
    const net = fetch(e.request).then(r => { if(r.ok) cache.put(e.request, r.clone()); return r; }).catch(() => null);
    return hit || (await net) || (e.request.mode === "navigate" ? cache.match("./index.html") : Response.error());
  }));
});
