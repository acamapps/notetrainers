/* Keeps a copy of the site on the device so it works without internet.

   The first visit online saves every file listed below. After that the site loads from the
   device, and quietly checks for newer files in the background. A change you publish appears
   the next time the site is opened after that.

   Keep FILES in step with the site: if you add a page or script, add it here. The list is
   fetched all at once, so a file that is missing from the site stops the offline copy installing. */
var CACHE = "note-practice-v1.12";
var FILES = [
  "./",
  "index.html",
  "instrument.html",
  "note-trainer.html",
  "name-the-note.html",
  "place-the-note.html",
  "style.css",
  "common.js",
  "instruments.js",
  "note-trainer.js",
  "name-the-note.js",
  "place-the-note.js",
  "favicon.svg",
  "apple-touch-icon.png",
  "icon-512.png",
  "manifest.webmanifest",
  "images/trombone.png",
  "images/tenorsax.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return c.addAll(FILES); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.filter(function (k) { return k !== CACHE; })
          .map(function (k) { return caches.delete(k); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  var own = url.origin === self.location.origin;
  var fonts = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (!own && !fonts) return;

  // The pages differ only by ?i=..., so one saved copy of each page serves every instrument.
  var key = own ? new Request(url.origin + url.pathname) : req;

  e.respondWith(
    caches.open(CACHE).then(function (cache) {
      return cache.match(key).then(function (cached) {
        var network = fetch(req).then(function (res) {
          if (res && (res.ok || res.type === "opaque")) cache.put(key, res.clone());
          return res;
        }).catch(function () { return null; });

        if (cached) { e.waitUntil(network); return cached; }
        return network.then(function (res) {
          if (res) return res;
          return req.mode === "navigate"
            ? cache.match(new Request(self.location.origin + new URL("index.html", self.location).pathname))
            : Response.error();
        });
      });
    })
  );
});
