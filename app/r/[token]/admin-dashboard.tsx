"use client";

import { useCallback, useEffect, useState } from "react";
import ResultsChart from "@/app/_components/results-chart";
import KakaoShare from "@/app/_components/kakao-share";

type Results = {
  slug: string;
  title: string;
  description: string | null;
  allowMultiple: boolean;
  maxChoices: number | null;
  dupMode: string;
  showResults: boolean;
  resultsShared: boolean;
  isClosed: boolean;
  closesAt: string | null;
  createdAt: string;
  totalBallots: number;
  options: { id: string; label: string; count: number }[];
};

const DUP_LABEL: Record<string, string> = {
  device: "기기 기준",
  ip: "IP 기준",
  strict: "엄격 (기기+IP)",
  none: "중복 허용",
};

export default function AdminDashboard({ token }: { token: string }) {
  const [data, setData] = useState<Results | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState(false);
  const [origin, setOrigin] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/${token}`, { cache: "no-store" });
    if (res.status === 404) {
      setNotFound(true);
      return;
    }
    if (res.ok) setData(await res.json());
  }, [token]);

  useEffect(() => {
    setOrigin(window.location.origin);
    load();
  }, [load]);

  // 30초마다 자동 새로고침
  useEffect(() => {
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    await fetch(`/api/admin/${token}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await load();
    setBusy(false);
  }

  async function reset() {
    if (!confirm("모든 표를 삭제하고 처음부터 다시 집계합니다. 계속할까요?")) return;
    await patch({ action: "reset" });
  }

  async function remove() {
    if (!confirm("이 투표를 완전히 삭제합니다. 되돌릴 수 없습니다. 계속할까요?")) return;
    setBusy(true);
    await fetch(`/api/admin/${token}`, { method: "DELETE" });
    window.location.assign("/");
  }

  function exportCsv() {
    if (!data) return;
    const rows = [["항목", "득표수", "비율(%)"]];
    data.options.forEach((o) => {
      const pct = data.totalBallots ? ((o.count / data.totalBallots) * 100).toFixed(1) : "0";
      rows.push([o.label, String(o.count), pct]);
    });
    const csv = "﻿" + rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.title}_결과.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function saveResultImage() {
    if (!data) return;
    const res = await fetch(`/api/admin/${token}/result-image`);
    const blob = await res.blob();
    const file = new File([blob], `${data.title}_결과.png`, { type: "image/png" });
    // 모바일에서 이미지 자체를 공유할 수 있으면 공유, 아니면 다운로드
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: `${data.title} 결과` });
        return;
      } catch {
        /* 취소 시 다운로드로 진행 */
      }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.title}_결과.png`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copyResultLink() {
    await navigator.clipboard.writeText(`${window.location.origin}/result/${data!.slug}`);
  }

  if (notFound) {
    return (
      <main className="grid min-h-dvh place-items-center px-5">
        <div className="card p-8 text-center">
          <div className="mb-3 text-4xl">🤔</div>
          <h1 className="text-lg font-bold">투표를 찾을 수 없습니다</h1>
          <p className="mt-1 text-soft">링크가 올바른지 확인해 주세요.</p>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="grid min-h-dvh place-items-center px-5">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-500" />
      </main>
    );
  }

  const total = data.totalBallots;
  const voteUrl = origin ? `${origin}/v/${data.slug}` : "";
  const resultUrl = origin ? `${origin}/result/${data.slug}` : "";
  const resultImageUrl = origin ? `${origin}/api/admin/${token}/result-image` : "";

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-9">
      <header className="mb-6 animate-pop">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-soft">
          <span className="rounded-full bg-brand-100 px-2.5 py-1 text-brand-600">관리자 화면</span>
          <span
            className="rounded-full px-2.5 py-1"
            style={{
              background: data.isClosed ? "rgba(244,63,94,0.12)" : "rgba(34,197,94,0.14)",
              color: data.isClosed ? "#e11d48" : "#16a34a",
            }}
          >
            {data.isClosed ? "마감됨" : "진행 중"}
          </span>
        </div>
        <h1 className="text-2xl font-extrabold leading-snug">{data.title}</h1>
        {data.description && <p className="mt-1.5 whitespace-pre-wrap text-soft">{data.description}</p>}
      </header>

      {/* 요약 */}
      <section className="mb-5 grid grid-cols-3 gap-3 animate-pop" style={{ animationDelay: "0.04s" }}>
        <Stat label="총 참여" value={`${total}명`} />
        <Stat label="항목 수" value={`${data.options.length}개`} />
        <Stat label="중복방지" value={DUP_LABEL[data.dupMode] ?? data.dupMode} small />
      </section>

      {/* 결과 차트 */}
      <section className="card animate-pop space-y-4 p-6" style={{ animationDelay: "0.08s" }}>
        <div className="flex items-center justify-between">
          <h2 className="font-bold">실시간 결과</h2>
          <button onClick={load} className="text-sm font-semibold text-brand-600">
            ↻ 새로고침
          </button>
        </div>

        {total === 0 ? (
          <p className="py-6 text-center text-soft">아직 참여자가 없습니다. 링크를 공유해 보세요!</p>
        ) : (
          <ResultsChart options={data.options} total={total} />
        )}

        <button onClick={exportCsv} className="btn btn-ghost w-full text-sm" disabled={total === 0}>
          ⬇ CSV로 내보내기
        </button>
      </section>

      {/* 공유 링크 */}
      <section className="card animate-pop mt-5 space-y-3 p-6" style={{ animationDelay: "0.12s" }}>
        <h2 className="font-bold">참여 링크</h2>
        <div className="flex items-stretch gap-2">
          <div className="flex min-w-0 flex-1 items-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 font-mono text-xs">
            <span className="truncate">{voteUrl || "…"}</span>
          </div>
          <button
            className="btn btn-ghost shrink-0 px-4 py-2.5 text-sm"
            onClick={() => navigator.clipboard?.writeText(voteUrl)}
          >
            복사
          </button>
        </div>
      </section>

      {/* 결과 공유 */}
      <section className="card animate-pop mt-5 space-y-4 p-6" style={{ animationDelay: "0.14s" }}>
        <h2 className="font-bold">결과 공유</h2>

        {/* 이미지로 저장/공유 */}
        <div className="grid grid-cols-2 gap-2">
          <button onClick={saveResultImage} disabled={total === 0} className="btn btn-primary text-sm">
            🖼️ 결과 이미지 저장
          </button>
          <KakaoShare
            title={`📊 ${data.title} · 결과`}
            description={`총 ${total}명 참여`}
            imageUrl={origin ? `${origin}/result/${data.slug}/opengraph-image` : ""}
            link={resultUrl}
            buttonLabel="결과 보기"
          />
        </div>

        {/* 공개 결과 페이지 */}
        <Row
          label="결과 페이지 공개"
          hint={
            data.resultsShared
              ? "누구나 결과 페이지를 볼 수 있습니다."
              : "켜면 아래 링크로 결과를 공유할 수 있습니다."
          }
        >
          <Toggle
            checked={data.resultsShared}
            disabled={busy}
            onChange={(v) => patch({ resultsShared: v })}
          />
        </Row>

        {data.resultsShared && (
          <div className="flex items-stretch gap-2">
            <div className="flex min-w-0 flex-1 items-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 font-mono text-xs">
              <span className="truncate">{resultUrl || "…"}</span>
            </div>
            <button className="btn btn-ghost shrink-0 px-4 py-2.5 text-sm" onClick={copyResultLink}>
              복사
            </button>
          </div>
        )}
      </section>

      {/* 관리 */}
      <section className="card animate-pop mt-5 space-y-4 p-6" style={{ animationDelay: "0.18s" }}>
        <h2 className="font-bold">투표 관리</h2>

        <Row
          label="투표 마감"
          hint={data.isClosed ? "현재 마감되어 참여할 수 없습니다." : "마감하면 더 이상 참여할 수 없습니다."}
        >
          <button
            disabled={busy}
            onClick={() => patch({ isClosed: !data.isClosed })}
            className={`btn ${data.isClosed ? "btn-ghost" : "btn-primary"} px-4 py-2 text-sm`}
          >
            {data.isClosed ? "다시 열기" : "마감하기"}
          </button>
        </Row>

        <Row
          label="투표자에게 결과 공개"
          hint={data.showResults ? "투표 후 결과를 볼 수 있습니다." : "결과는 관리자만 볼 수 있습니다."}
        >
          <Toggle checked={data.showResults} disabled={busy} onChange={(v) => patch({ showResults: v })} />
        </Row>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <button onClick={reset} disabled={busy} className="btn btn-ghost text-sm text-amber-600">
            표 초기화
          </button>
          <button onClick={remove} disabled={busy} className="btn btn-ghost text-sm text-red-500">
            투표 삭제
          </button>
        </div>
      </section>

      <p className="mt-6 text-center text-xs text-soft">30초마다 자동으로 갱신됩니다</p>
    </main>
  );
}

function Stat({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="card p-4 text-center">
      <p className={`font-extrabold ${small ? "text-sm" : "text-xl"}`}>{value}</p>
      <p className="mt-0.5 text-xs text-soft">{label}</p>
    </div>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold">{label}</p>
        <p className="mt-0.5 text-xs text-soft">{hint}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50"
      style={{ background: checked ? "var(--color-brand-500)" : "var(--border)" }}
    >
      <span
        className="absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all"
        style={{ left: checked ? "1.5rem" : "0.25rem" }}
      />
    </button>
  );
}
