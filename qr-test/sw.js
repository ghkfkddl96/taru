/* QR 테스트 — 오프라인 서비스워커
   cache-first(같은 origin) + 네트워크 실패 시 캐시 폴백.
   ★index.html이 바뀌면 CACHE 버전을 올릴 것. */
const CACHE = "qr-test-v1";
const PRECACHE = ["./", "./index.html", "./manifest.webmanifest", "./icon.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    (async () => {
      const c = await caches.open(CACHE);
      // 하나라도 실패하면 install 전체가 죽으므로 개별로 담는다.
      await Promise.all(
        PRECACHE.map(async (u) => {
          try {
            const res = await fetch(new Request(u, { cache: "reload" }));
            if (res && (res.ok || res.type === "opaque")) await c.put(u, res.clone());
          } catch (_) {}
        })
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => (k === CACHE ? null : caches.delete(k))));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  let url;
  try {
    url = new URL(req.url);
  } catch (_) {
    return;
  }
  if (url.origin !== self.location.origin) return; // 외부는 그냥 통과

  e.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      // 1) cache-first
      const hit = await cache.match(req, { ignoreSearch: true });
      if (hit) return hit;
      // 2) 네트워크 → 성공하면 캐시에 저장
      try {
        const res = await fetch(req);
        if (res && res.ok && res.type === "basic") {
          cache.put(req, res.clone()).catch(() => {});
        }
        return res;
      } catch (err) {
        // 3) 네트워크 실패 폴백
        const alt = await cache.match(req, { ignoreSearch: true });
        if (alt) return alt;
        if (req.mode === "navigate") {
          const idx = (await cache.match("./index.html")) || (await cache.match("./"));
          if (idx) return idx;
        }
        throw err;
      }
    })()
  );
});

self.addEventListener("message", (e) => {
  if (e.data === "skipWaiting") self.skipWaiting();
});
