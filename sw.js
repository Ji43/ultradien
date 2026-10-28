/* Ultradien : garde l'appli disponible hors ligne et se met à jour toute seule.
   - la page (index.html) et config.js : réseau d'abord, copie en cache en secours hors ligne ;
   - icônes et audio : cache d'abord (ils changent rarement) ;
   - à l'installation, les fichiers sont relus sur le serveur (cache: "reload"), jamais depuis le cache du navigateur ;
   - l'audio NSDR (5 Mo) vit dans son propre cache, gardé d'une version à l'autre.
   Changer VERSION à chaque mise à jour des fichiers. */
const VERSION = "ultradien-v14", MEDIA = "ultradien-media";
const FRESH = ["./", "./index.html", "./config.js", "./manifest.webmanifest"];
const STATIC = ["./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-maskable.png", "./icons/icon.svg", "./icons/apple-touch-icon.png"];
const AUDIO = "./audio/nsdr.mp3";
const path = a => new URL(a, self.registration.scope).pathname;
const reload = a => new Request(a, { cache:"reload" });

self.addEventListener("install", e => { e.waitUntil((async () => {
  const c = await caches.open(VERSION);
  await c.addAll([...FRESH, ...STATIC].map(reload));
  const m = await caches.open(MEDIA);
  if(!(await m.match(AUDIO))) await m.add(reload(AUDIO)).catch(() => {});
  await self.skipWaiting();
})()); });

self.addEventListener("activate", e => { e.waitUntil((async () => {
  for(const k of await caches.keys()) if(k !== VERSION && k !== MEDIA) await caches.delete(k);
  await self.clients.claim();
})()); });

async function networkFirst(req){
  const c = await caches.open(VERSION);
  try{
    const ctrl = new AbortController(), t = setTimeout(() => ctrl.abort(), 4000);
    const r = await fetch(req, { cache:"no-cache", signal:ctrl.signal }); clearTimeout(t);
    if(r.ok){ await c.put(req.mode === "navigate" ? "./index.html" : req, r.clone()); return r; }
    throw new Error(r.status);
  }catch(err){
    return (await c.match(req, { ignoreSearch:true })) || (req.mode === "navigate" ? c.match("./index.html") : Response.error());
  }
}
async function cacheFirst(req, name){
  const c = await caches.open(name), hit = await c.match(req, { ignoreSearch:true });
  if(hit) return hit;
  const r = await fetch(req); if(r.ok) c.put(req, r.clone()); return r;
}

self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if(req.method !== "GET" || url.origin !== location.origin) return;   // la synchro Supabase passe toujours par le réseau
  const p = url.pathname;
  if(req.mode === "navigate" || FRESH.some(a => path(a) === p)) e.respondWith(networkFirst(req));
  else if(p === path(AUDIO)) e.respondWith(cacheFirst(req, MEDIA));
  else if(STATIC.some(a => path(a) === p)) e.respondWith(cacheFirst(req, VERSION));
});
