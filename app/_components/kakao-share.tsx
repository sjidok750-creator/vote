"use client";

import { useState } from "react";

// 카카오 JS 키가 설정돼 있으면 카카오톡 '피드' 메시지(이미지 카드)로 공유,
// 없으면 휴대폰 기본 공유(Web Share) / 링크 복사로 자동 폴백합니다.
const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;

/* eslint-disable @typescript-eslint/no-explicit-any */
function ensureKakao(): Promise<any | null> {
  if (!KAKAO_KEY) return Promise.resolve(null);
  return new Promise((resolve) => {
    const w = window as any;
    if (w.Kakao) {
      if (!w.Kakao.isInitialized()) w.Kakao.init(KAKAO_KEY);
      return resolve(w.Kakao);
    }
    const s = document.createElement("script");
    s.src = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js";
    s.async = true;
    s.onload = () => {
      const k = (window as any).Kakao;
      if (k && !k.isInitialized()) k.init(KAKAO_KEY);
      resolve(k ?? null);
    };
    s.onerror = () => resolve(null);
    document.head.appendChild(s);
  });
}

export default function KakaoShare({
  title,
  description,
  imageUrl,
  link,
  buttonLabel = "투표하기",
}: {
  title: string;
  description: string;
  imageUrl: string;
  link: string;
  buttonLabel?: string;
}) {
  const [busy, setBusy] = useState(false);

  async function onClick() {
    setBusy(true);
    try {
      const kakao = await ensureKakao();
      if (kakao?.Share) {
        kakao.Share.sendDefault({
          objectType: "feed",
          content: {
            title,
            description,
            imageUrl,
            link: { mobileWebUrl: link, webUrl: link },
          },
          buttons: [
            { title: buttonLabel, link: { mobileWebUrl: link, webUrl: link } },
          ],
        });
        return;
      }
      // 폴백: 기본 공유 시트 또는 복사
      if (navigator.share) {
        await navigator.share({ title, text: description, url: link });
      } else {
        await navigator.clipboard.writeText(link);
        alert("링크가 복사되었습니다. 카카오톡에 붙여넣어 보내세요!");
      }
    } catch {
      /* 사용자가 취소했거나 공유 실패 — 무시 */
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="btn text-sm"
      style={{ background: "#FEE500", color: "#191600" }}
    >
      <span style={{ fontWeight: 800 }}>카카오톡 공유</span>
    </button>
  );
}
