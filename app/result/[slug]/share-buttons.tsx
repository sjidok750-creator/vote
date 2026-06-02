"use client";

import { useState } from "react";
import KakaoShare from "@/app/_components/kakao-share";

export default function ShareResultButtons({
  slug,
  title,
}: {
  slug: string;
  title: string;
}) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? `${window.location.origin}/result/${slug}` : "";
  const imageUrl = typeof window !== "undefined" ? `${window.location.origin}/result/${slug}/opengraph-image` : "";

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  async function webShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: `${title} · 결과`, url });
      } catch {
        /* 취소 무시 */
      }
    } else {
      copy();
    }
  }

  return (
    <div className="card animate-pop mt-5 space-y-3 p-5" style={{ animationDelay: "0.1s" }}>
      <p className="text-sm font-bold">결과 공유</p>
      <div className="grid grid-cols-2 gap-2">
        <KakaoShare
          title={`📊 ${title} · 결과`}
          description="투표 결과를 확인하세요"
          imageUrl={imageUrl}
          link={url}
          buttonLabel="결과 보기"
        />
        <button className="btn btn-ghost text-sm" onClick={webShare}>
          공유하기
        </button>
      </div>
      <button className="btn btn-ghost w-full text-sm" onClick={copy}>
        {copied ? "링크 복사됨 ✓" : "🔗 링크 복사"}
      </button>
    </div>
  );
}
