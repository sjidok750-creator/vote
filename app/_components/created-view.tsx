"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export default function CreatedView({
  slug,
  adminToken,
  title,
}: {
  slug: string;
  adminToken: string;
  title: string;
}) {
  const [origin, setOrigin] = useState("");
  const [qr, setQr] = useState("");

  const voteUrl = origin ? `${origin}/v/${slug}` : "";
  const adminUrl = origin ? `${origin}/r/${adminToken}` : "";

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (!voteUrl) return;
    QRCode.toDataURL(voteUrl, {
      width: 480,
      margin: 1,
      color: { dark: "#1b1430", light: "#ffffff" },
    })
      .then(setQr)
      .catch(() => setQr(""));
  }, [voteUrl]);

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: `투표: ${title}`, text: title, url: voteUrl });
      } catch {
        /* 취소 무시 */
      }
    } else {
      navigator.clipboard?.writeText(voteUrl);
    }
  }

  return (
    <main className="mx-auto w-full max-w-xl px-5 py-10">
      <header className="mb-7 text-center animate-pop">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-brand-500 to-accent-500 text-3xl shadow-lg">
          🎉
        </div>
        <h1 className="text-2xl font-extrabold">투표가 만들어졌어요!</h1>
        <p className="mt-1.5 text-soft">아래 링크를 공유하면 바로 투표가 시작됩니다.</p>
      </header>

      {/* 공유 링크 */}
      <section className="card animate-pop space-y-4 p-6" style={{ animationDelay: "0.05s" }}>
        <div className="flex items-center gap-2">
          <span className="text-lg">📣</span>
          <h2 className="font-bold">참여자에게 공유할 링크</h2>
        </div>

        {qr && (
          <div className="mx-auto w-fit rounded-2xl bg-white p-3 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="투표 QR 코드" className="h-44 w-44" />
          </div>
        )}

        <CopyField value={voteUrl} />

        <div className="grid grid-cols-2 gap-2">
          <button className="btn btn-primary" onClick={share}>
            공유하기
          </button>
          <a className="btn btn-ghost" href={voteUrl} target="_blank" rel="noopener noreferrer">
            투표화면 미리보기
          </a>
        </div>
        <p className="text-center text-xs text-soft">
          참여자는 투표만 하고 결과는 볼 수 없습니다.
        </p>
      </section>

      {/* 관리자 링크 */}
      <section
        className="card animate-pop mt-5 space-y-4 border-2 border-accent-400/40 p-6"
        style={{ animationDelay: "0.1s" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🔑</span>
          <h2 className="font-bold">관리자 전용 결과 링크</h2>
        </div>
        <div className="rounded-xl bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-600">
          ⚠️ 이 링크는 <b>당신만</b> 보관하세요. 링크를 아는 사람은 결과를 볼 수 있습니다.
        </div>
        <CopyField value={adminUrl} secret />
        <a className="btn btn-primary w-full" href={adminUrl}>
          결과 보러 가기 →
        </a>
      </section>

      <button
        className="btn btn-ghost mx-auto mt-6 flex"
        onClick={() => window.location.assign("/")}
      >
        + 새 투표 만들기
      </button>
    </main>
  );
}

function CopyField({ value, secret = false }: { value: string; secret?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="flex items-stretch gap-2">
      <div className="flex min-w-0 flex-1 items-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 font-mono text-xs">
        <span className="truncate">{value || "…"}</span>
      </div>
      <button
        onClick={copy}
        className="btn btn-ghost shrink-0 px-4 py-2.5 text-sm"
        aria-label="링크 복사"
      >
        {copied ? "복사됨 ✓" : "복사"}
      </button>
    </div>
  );
}
