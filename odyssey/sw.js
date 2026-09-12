/* 비행기에서 내리고 싶다. — 오프라인 서비스워커 (자동 생성) */
const CACHE = "odyssey-ODY-S1-20260913-0001";
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
 "./img/archer.png",
 "./img/archery_field.jpg",
 "./img/bin_L1.jpg",
 "./img/bin_L1_open_case.jpg",
 "./img/bin_L1_open_empty.jpg",
 "./img/bin_L2.jpg",
 "./img/bin_L2_open_cello.jpg",
 "./img/bin_L2_open_empty.jpg",
 "./img/bin_R1.jpg",
 "./img/bin_R1_open_card.jpg",
 "./img/bin_R1_open_empty.jpg",
 "./img/bin_R2.jpg",
 "./img/bin_R2_open_empty.jpg",
 "./img/bin_R2_open_key.jpg",
 "./img/blanket_zoom.jpg",
 "./img/book_empty.jpg",
 "./img/book_tile.jpg",
 "./img/case_open_empty.jpg",
 "./img/case_open_headset.jpg",
 "./img/ceiling_open_cardkey.jpg",
 "./img/ceiling_open_empty.jpg",
 "./img/cello_align.png",
 "./img/char_front.jpg",
 "./img/char_happy.jpg",
 "./img/char_hipL.jpg",
 "./img/char_hipR.jpg",
 "./img/char_hungry.jpg",
 "./img/crew_blanket.jpg",
 "./img/crew_tray.jpg",
 "./img/dialbox.jpg",
 "./img/dialbox_open.jpg",
 "./img/food_bread.png",
 "./img/food_cake.png",
 "./img/food_omu.png",
 "./img/food_salad.png",
 "./img/galley_cart.jpg",
 "./img/galley_drawer.jpg",
 "./img/galley_snack.jpg",
 "./img/galley_upper.jpg",
 "./img/galley_upper_empty.jpg",
 "./img/galley_upper_open.jpg",
 "./img/gamecard.jpg",
 "./img/headphones.jpg",
 "./img/headset_case.jpg",
 "./img/headset_worn.jpg",
 "./img/hint_phonecase.jpg",
 "./img/ic_blanket.png",
 "./img/ic_butter.jpg",
 "./img/ic_butter.png",
 "./img/ic_cardkey.jpg",
 "./img/ic_cardkey.png",
 "./img/ic_case.png",
 "./img/ic_cellophane.png",
 "./img/ic_dna.jpg",
 "./img/ic_dna.png",
 "./img/ic_drop.jpg",
 "./img/ic_drop.png",
 "./img/ic_dynamite.jpg",
 "./img/ic_dynamite.png",
 "./img/ic_fire.jpg",
 "./img/ic_fire.png",
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
 "./img/ife_ic_blanket.png",
 "./img/ife_ic_meal.png",
 "./img/ife_ic_tv.png",
 "./img/ife_off.jpg",
 "./img/ife_on.jpg",
 "./img/ife_photo1.jpg",
 "./img/ife_photo2.jpg",
 "./img/ife_photo3.jpg",
 "./img/ife_photo4.jpg",
 "./img/lav_cab1.jpg",
 "./img/lav_cab1_empty.jpg",
 "./img/lav_cab1_open.jpg",
 "./img/lav_cab2.jpg",
 "./img/lav_cab2_empty.jpg",
 "./img/lav_cab2_open.jpg",
 "./img/lav_cabtop.jpg",
 "./img/lav_cabtop_empty.jpg",
 "./img/lav_cabtop_open.jpg",
 "./img/lav_ceiling.jpg",
 "./img/lav_tissue.jpg",
 "./img/lav_tissue_idle.jpg",
 "./img/lav_tissue_roll.jpg",
 "./img/map_aisle.jpg",
 "./img/map_gate.jpg",
 "./img/map_seat.jpg",
 "./img/map_seat_tray.jpg",
 "./img/meal_tray.jpg",
 "./img/oway_plane.jpg",
 "./img/pamphlet_bg.jpg",
 "./img/pamphlet_body_bg.jpg",
 "./img/passport.jpg",
 "./img/phone_wall.jpg",
 "./img/shade_logo.png",
 "./img/tile_beige.jpg",
 "./img/tile_black.jpg",
 "./img/tile_brown.jpg",
 "./img/tile_dark.jpg",
 "./img/tissue_mask.png",
 "./img/travel1.jpg",
 "./img/travel2.jpg",
 "./img/travel3.jpg",
 "./img/travel4.jpg",
 "./img/window_open.jpg",
 "./img/window_shade.jpg",
 "./img/window_shade_plain.jpg",
 "./audio/ad_bgm.mp3",
 "./audio/binoc.mp3",
 "./audio/bow_shot.mp3",
 "./audio/main_bgm.mp3",
 "./audio/song1.mp3",
 "./audio/song2.mp3",
 "./audio/song3.mp3",
 "./audio/song4.mp3",
 "./audio/song5.mp3",
 "./audio/sudoku_bgm.mp3"
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
    /* ★v0.15 Range 요청(오디오·비디오)은 206 으로 잘라서 돌려준다.
       캐시에서 200 전체를 주면 iOS Safari 가 미디어를 못 이어 재생한다(노래 2번째부터 멈춤). */
    const range = req.headers.get("range");
    if (hit && range) {
      const m = /bytes=(d*)-(d*)/.exec(range);
      if (m) {
        const buf = await hit.arrayBuffer();
        const total = buf.byteLength;
        let start = m[1] === "" ? null : parseInt(m[1], 10);
        let end = m[2] === "" ? null : parseInt(m[2], 10);
        if (start === null) { start = Math.max(0, total - (end || 0)); end = total - 1; }
        if (end === null || end >= total) end = total - 1;
        if (start > end || start >= total) {
          return new Response(null, { status: 416, headers: { "Content-Range": "bytes */" + total } });
        }
        const body = buf.slice(start, end + 1);
        return new Response(body, {
          status: 206, statusText: "Partial Content",
          headers: {
            "Content-Type": hit.headers.get("content-type") || "application/octet-stream",
            "Content-Length": String(body.byteLength),
            "Content-Range": "bytes " + start + "-" + end + "/" + total,
            "Accept-Ranges": "bytes"
          }
        });
      }
    }
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
