// SERVICE-WORKER.JS - CACHÉ Y ESTRATEGIA OFFLINE PARA ENTORNOS DE GIMNASIO

const CACHE_NAME = "hibrida-elite-v5-cache-v1";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./styles.css",
  "./routine.js",
  "./manifest.json",
  "./js/math.js",
  "./js/storage.js",
  "./js/store.js",
  "./js/ui.js",
  "./js/app.js",
  "https://cdn.jsdelivr.net/npm/chart.js",
  "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Space+Grotesk:wght@400;700&display=swap"
];

// 1. Evento de Instalación: Almacenar archivos críticos en caché
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Almacenando caché estático de la central deportiva");
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// 2. Evento de Activación: Limpieza de cachés antiguas obsoletas
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[Service Worker] Limpiando caché obsoleta:", key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Evento de Intercepción (Fetch) con estrategia Stale-While-Revalidate
// Esto permite cargar instantáneamente los activos desde la caché mientras se actualizan en background.
self.addEventListener("fetch", (e) => {
  // Evitar solicitudes que no sean GET o esquemas extraños (ej. chrome-extension)
  if (e.request.method !== "GET" || !e.request.url.startsWith(self.location.origin) && !e.request.url.startsWith("https://")) {
    return;
  }

  e.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(e.request).then((cachedResponse) => {
        const fetchPromise = fetch(e.request).then((networkResponse) => {
          // Guardar respuesta válida en caché
          if (networkResponse.status === 200) {
            cache.put(e.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          // Si falla internet y no hay respuesta en caché, podemos retornar un fallback opcional
          console.log("[Service Worker] Red desconectada, cargando desde caché");
        });

        // Retornar la respuesta cacheada inmediatamente, o esperar por la respuesta de red
        return cachedResponse || fetchPromise;
      });
    })
  );
});
