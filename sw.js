/* 싱가포르 방탈출 — 오프라인 지원 서비스워커 (자동생성: gen-sw.mjs)
   한 번 접속하면 게임 전체(사진·소리)를 기기에 저장 → 비행기모드/오프라인에서도 새로고침 포함 완전 동작.
   ★배포 시 index.html이 바뀌면 gen-sw.mjs를 다시 돌려 버전을 갱신할 것. */
const CACHE = "sg-escape-v1786767561238";
const PRECACHE = [
 "./",
 "index.html",
 "img/ending.jpg",
 "img/sky.jpg",
 "img/airport.jpg",
 "img/closeup/board.jpg",
 "img/closeup/carrier.jpg",
 "img/closeup/locker.jpg",
 "img/jewel.jpg",
 "img/closeup/waterfall.jpg",
 "img/goodsshop.jpg",
 "img/dolls.jpg",
 "img/closeup/clock.jpg",
 "img/closeup/battery.jpg",
 "img/downtown.jpg",
 "img/closeup/downtown_vend.jpg",
 "img/closeup/vend_lit.png",
 "img/closeup/downtown_vend_coin.jpg",
 "img/vivocity.jpg",
 "img/closeup/vivocity_win.jpg",
 "img/closeup/vivocity_win_dirty.jpg",
 "img/closeup/vivo_songfa.jpg",
 "img/closeup/vivo_box.jpg",
 "img/closeup/vivo_box_open.jpg",
 "img/sentosa.jpg",
 "img/closeup/arab_cafe.jpg",
 "img/closeup/cat_hot.jpg",
 "img/closeup/cat_cool.jpg",
 "img/universal.jpg",
 "img/closeup/uv_shop.jpg",
 "img/closeup/uv_shop_sold.jpg",
 "img/universalin.jpg",
 "img/laupasat.jpg",
 "img/closeup/laupasat_grill.jpg",
 "img/closeup/lps_stall.jpg",
 "img/closeup/lps_box.jpg",
 "img/closeup/lps_box_open.jpg",
 "img/closeup/laupasat_cab.jpg",
 "img/closeup/laupasat_cab_open.jpg",
 "img/police.jpg?v=2",
 "img/closeup/police_door.jpg",
 "img/closeup/police_door_open.jpg",
 "img/closeup/police_car.jpg",
 "img/closeup/police_bonnet.jpg",
 "img/closeup/police_trunk.jpg",
 "img/closeup/trunk_open.jpg",
 "img/closeup/flashlight_empty.jpg",
 "img/policein.jpg",
 "img/closeup/pol_mbox.jpg",
 "img/closeup/pol_mbox_open.jpg",
 "img/closeup/police_console.jpg",
 "img/closeup/police_console_open.jpg",
 "img/fortcanning.jpg",
 "img/closeup/fc_box.jpg",
 "img/closeup/fc_box_open.jpg",
 "img/closeup/fc_slab.jpg?v=2",
 "img/bakkutteh.jpg",
 "img/closeup/bkt_soup_new.jpg",
 "img/closeup/bkt_reg.jpg",
 "img/closeup/bkt_reg_open.jpg",
 "img/closeup/bkt_menu.jpg",
 "img/ibis.jpg",
 "img/closeup/ibis_bear.jpg",
 "img/room.jpg?v=2",
 "img/marina.jpg?v=2",
 "img/closeup/marina_box.jpg",
 "img/closeup/marina_press.png",
 "img/closeup/marina_box_open.jpg",
 "img/closeup/marina_sky.jpg",
 "img/supertree.jpg?v=2",
 "img/closeup/stree_slab.jpg",
 "img/garden.jpg",
 "img/closeup/garden_flowers.jpg",
 "img/closeup/garden_tunnel_dark.jpg",
 "img/closeup/garden_tunnel_lit.jpg",
 "img/closeup/garden_cab.jpg",
 "img/closeup/garden_cab_open.jpg",
 "img/arab.jpg",
 "img/closeup/arab_dome.jpg",
 "img/closeup/arab_wall.jpg",
 "img/closeup/mirror_scratch.png",
 "img/closeup/arab_stand.jpg",
 "img/closeup/arab_box.jpg",
 "img/closeup/arab_box_open.jpg",
 "img/merlion.jpg",
 "img/merlion_strong.jpg",
 "img/merlion_weak.jpg",
 "img/closeup/merlion_back.jpg",
 "img/closeup/merlion_back_key.jpg",
 "img/closeup/merlion_box.jpg",
 "img/closeup/merlion_box_open.jpg",
 "img/closeup/ticket_gold.jpg",
 "img/transit/walk.jpg",
 "img/transit/bus.jpg",
 "img/transit/mrt.jpg",
 "img/transit/songfa.jpg",
 "img/transit/citywalk.jpg",
 "img/icon/shrimp.png",
 "img/icon/skewer.png",
 "img/icon/egg.png",
 "img/icon/veggie.png",
 "img/icon/soup.png",
 "img/icon/rice.png",
 "img/icon/noodle.png",
 "img/icon/can.png",
 "img/icon/teapot.png",
 "img/icon/sk_shrimp.png",
 "img/icon/sk_ginkgo.png",
 "img/icon/sk_leek.png",
 "img/icon/sk_beef.png",
 "img/icon/sk_chicken.png",
 "audio/redred5.wav",
 "img/closeup/radio_view.jpg",
 "img/closeup/morse_chart.jpg",
 "img/closeup/lps_fruit.jpg",
 "img/closeup/lps_fruit_cut.jpg",
 "img/passport.jpg",
 "img/closeup/flashlight_loaded.jpg",
 "img/closeup/universal_chara.jpg",
 "img/closeup/maru_passport.jpg",
 "img/phone_home.jpg",
 "img/phone_lock.jpg",
 "img/closeup/tablet_lock.jpg",
 "img/closeup/tablet_map.jpg",
 "img/closeup/tree_off.jpg",
 "img/closeup/tree_red.jpg",
 "img/closeup/tree_blue.jpg",
 "img/closeup/tree_green.jpg",
 "img/closeup/maru_cube.jpg",
 "img/closeup/maru_cactus.jpg",
 "img/closeup/maru_fan.jpg",
 "img/closeup/maru_stamp.jpg",
 "img/closeup/maru_trophy.jpg",
 "img/closeup/maru_frame.jpg",
 "img/closeup/maru_mirror.jpg",
 "img/closeup/maru_carrier.jpg"
];

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    // addAll은 하나만 실패해도 전체 실패라 개별 add (실패는 무시 — 런타임 캐시가 보완)
    await Promise.all(PRECACHE.map(u => c.add(u).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const hit = await caches.match(req);
    if (hit) return hit;                       // 캐시 우선 = 오프라인 완전 동작
    try {
      const res = await fetch(req);
      if (res && res.ok) { const c = await caches.open(CACHE); c.put(req, res.clone()); }
      return res;
    } catch (err) {
      // 오프라인 + 미캐시: 내비게이션이면 index로
      if (req.mode === "navigate") { const idx = await caches.match("index.html"); if (idx) return idx; }
      throw err;
    }
  })());
});
