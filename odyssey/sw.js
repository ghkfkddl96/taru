/* 오디세이 × 발리 — 오프라인 서비스워커 (자동 생성) */
const CACHE = "odyssey-ODY-S1-20260910-1759";
const PRECACHE = [
 "./",
 "./index.html",
 "./manifest.webmanifest",
 "./icon.png",
 "./img/app_kakao.png",
 "./img/app_map.png",
 "./img/app_minigame.png",
 "./img/app_qr.png",
 "./img/archer.jpg",
 "./img/bin_L1.jpg",
 "./img/bin_L1_open_case.jpg",
 "./img/bin_L1_open_empty.jpg",
 "./img/bin_L2.jpg",
 "./img/bin_R1.jpg",
 "./img/bin_R1_open_card.jpg",
 "./img/bin_R1_open_empty.jpg",
 "./img/bin_R2.jpg",
 "./img/blanket_zoom.jpg",
 "./img/case_open_empty.jpg",
 "./img/case_open_headset.jpg",
 "./img/ceiling_open_cardkey.jpg",
 "./img/ceiling_open_empty.jpg",
 "./img/char_front.jpg",
 "./img/char_happy.jpg",
 "./img/char_hipL.jpg",
 "./img/char_hipR.jpg",
 "./img/char_hungry.jpg",
 "./img/crew_blanket.jpg",
 "./img/crew_tray.jpg",
 "./img/food_bread.png",
 "./img/food_cake.png",
 "./img/food_omu.png",
 "./img/food_salad.png",
 "./img/galley_cart.jpg",
 "./img/galley_drawer.jpg",
 "./img/galley_snack.jpg",
 "./img/galley_upper.jpg",
 "./img/gamecard.jpg",
 "./img/headphones.jpg",
 "./img/headset_case.jpg",
 "./img/headset_worn.jpg",
 "./img/ic_blanket.png",
 "./img/ic_butter.jpg",
 "./img/ic_cardkey.jpg",
 "./img/ic_cardkey.png",
 "./img/ic_case.png",
 "./img/ic_cellophane.png",
 "./img/ic_dna.jpg",
 "./img/ic_drop.jpg",
 "./img/ic_dynamite.jpg",
 "./img/ic_fire.jpg",
 "./img/ic_gamecard.png",
 "./img/ic_goldkey.jpg",
 "./img/ic_goldkey.png",
 "./img/ic_headphones.jpg",
 "./img/ic_headphones.png",
 "./img/ic_ladder.png",
 "./img/ic_pamphlet.png",
 "./img/ic_passport.png",
 "./img/ic_peanut.png",
 "./img/ic_phone.png",
 "./img/ic_silverkey.jpg",
 "./img/ic_silverkey.png",
 "./img/ic_telescope.png",
 "./img/ic_ticket.png",
 "./img/ic_tile_beige.png",
 "./img/ic_tile_black.png",
 "./img/ic_tile_brown.png",
 "./img/ic_tile_dark.png",
 "./img/ife_off.jpg",
 "./img/ife_on.jpg",
 "./img/ife_photo1.jpg",
 "./img/ife_photo2.jpg",
 "./img/ife_photo3.jpg",
 "./img/ife_photo4.jpg",
 "./img/lav_ceiling.jpg",
 "./img/lav_tissue.jpg",
 "./img/lav_tissue_idle.jpg",
 "./img/map_aisle.jpg",
 "./img/map_seat.jpg",
 "./img/map_seat_tray.jpg",
 "./img/meal_tray.jpg",
 "./img/passport.jpg",
 "./img/tile_beige.jpg",
 "./img/tile_black.jpg",
 "./img/tile_brown.jpg",
 "./img/tile_dark.jpg",
 "./img/travel1.jpg",
 "./img/travel2.jpg",
 "./img/travel3.jpg",
 "./img/travel4.jpg",
 "./img/window_open.jpg",
 "./img/window_shade.jpg"
];

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await Promise.all(PRECACHE.map(async (u) => {
      try {
        const res = await fetch(new Request(u, { cache: "reload" }));
        if (res && (res.ok || res.type === "opaque")) await c.put(u, res.clone());
      } catch (_) {}
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => (k === CACHE ? null : caches.delete(k))));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  let url;
  try { url = new URL(req.url); } catch (_) { return; }
  if (url.origin !== self.location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (res && res.ok && res.type === "basic") cache.put(req, res.clone()).catch(() => {});
      return res;
    } catch (err) {
      const alt = await cache.match(req, { ignoreSearch: true });
      if (alt) return alt;
      if (req.mode === "navigate") {
        const idx = (await cache.match("./index.html")) || (await cache.match("./"));
        if (idx) return idx;
      }
      throw err;
    }
  })());
});

self.addEventListener("message", (e) => { if (e.data === "skipWaiting") self.skipWaiting(); });
