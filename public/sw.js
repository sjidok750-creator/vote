// VoteSecret 서비스워커
// 투표 데이터의 신선도가 중요하므로, 화면/API 요청은 항상 네트워크 우선.
// (정적 아이콘 등 일부만 캐시해 설치형 PWA 요건을 충족)

const CACHE = "votesecret-v1";
const ASSETS = ["/manifest.webmanifest", "/icon.svg", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // API · 페이지 이동은 항상 네트워크에서 최신 데이터를 가져옴
  if (url.pathname.startsWith("/api/") || request.mode === "navigate") {
    return; // 브라우저 기본 처리(네트워크)
  }

  // 정적 자산: 캐시 우선, 없으면 네트워크 후 캐시
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request)
          .then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
            return res;
          })
          .catch(() => cached),
    ),
  );
});
