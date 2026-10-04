/*
 * sw.js - Service Worker der Gym-Log-App.
 * Speichert die App-Dateien beim ersten Laden im Cache, damit die App danach
 * ohne Internet startet (Gym!). Strategie: cache-first fuer eigene Dateien.
 *
 * Changelog
 * v1 (2026-10-04): Erste Version.
 * v2 (2026-10-04): Cache-Version fuer index.html v2 (eingebettetes Icon).
 * v3 (2026-10-04): Neue Icons (maskable randlos gelb, kein schwarzer Rand).
 *
 * WICHTIG: Bei jeder Aenderung an index.html CACHE_VERSION erhoehen, sonst
 * liefert das Handy weiterhin die alte Version aus dem Cache.
 */
const CACHE_VERSION = "gym-log-v3";
const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192-v3.png",
  "./icon-512-v3.png",
  "./icon-maskable-512-v3.png",
];

// Installation: alle App-Dateien in den Cache laden
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_VERSION).then((c) => c.addAll(APP_FILES)));
  self.skipWaiting();
});

// Aktivierung: Caches alter Versionen loeschen
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Anfragen: zuerst Cache, sonst Netz (und Ergebnis nachtraeglich cachen)
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(req, copy));
          return res;
        })
    )
  );
});
