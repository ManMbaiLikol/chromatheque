/* La Chromathèque de Man Mbaï Likol — service worker : l'app marche hors ligne (showroom, chantier).
   Réseau d'abord pour nos fichiers (on voit toujours la dernière version en ligne), cache en secours.
   Polices Google : cache d'abord. Changer VERSION à chaque mise en ligne qui modifie la liste SHELL. */
var VERSION = "accords-wada-v3";
var SHELL = [
  "./", "index.html", "manifest.webmanifest",
  "src/styles.css", "src/core.js", "src/i18n.js", "src/wada-data.js", "src/sources-data.js", "src/scenes.js", "src/proposal.js", "src/recolor.js", "src/app.js",
  "icons/icon.svg", "icons/icon-192.png", "icons/icon-512.png"
];
var FONTS = "accords-wada-fonts";

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION && k !== FONTS; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener("fetch", function (e) {
  var req = e.request, url = new URL(req.url);
  if (req.method !== "GET") return;

  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(caches.open(FONTS).then(function (c) {
      return c.match(req).then(function (hit) {
        return hit || fetch(req).then(function (res) { if (res.ok || res.type === "opaque") c.put(req, res.clone()); return res; });
      });
    }));
    return;
  }
  if (url.origin !== self.location.origin) return;

  e.respondWith(fetch(req).then(function (res) {
    if (res.ok) { var copy = res.clone(); caches.open(VERSION).then(function (c) { c.put(req, copy); }); }
    return res;
  }).catch(function () {
    return caches.match(req, { ignoreSearch: true }).then(function (hit) {
      if (hit) return hit;
      if (req.mode === "navigate") return caches.match("./");
      return Response.error();
    });
  }));
});
