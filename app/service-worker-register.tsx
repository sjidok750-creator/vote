"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* PWA 등록 실패는 무시 (앱 동작에는 영향 없음) */
      });
    }
  }, []);
  return null;
}
