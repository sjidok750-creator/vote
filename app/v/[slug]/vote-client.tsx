"use client";

import { useEffect, useState } from "react";
import { getDeviceId, markVoted, hasVotedLocally } from "@/app/_lib/device";

type Option = { id: string; label: string };
type Phase = "loading" | "vote" | "done" | "already" | "closed";

export default function VoteClient({
  slug,
  title,
  description,
  options,
  allowMultiple,
  maxChoices,
  showResults,
  closed,
}: {
  slug: string;
  title: string;
  description: string | null;
  options: Option[];
  allowMultiple: boolean;
  maxChoices: number | null;
  showResults: boolean;
  closed: boolean;
}) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // 진입 시 상태 판별
  useEffect(() => {
    if (closed) {
      setPhase("closed");
      return;
    }
    if (hasVotedLocally(slug)) {
      setPhase("already");
      return;
    }
    const deviceId = getDeviceId();
    fetch(`/api/polls/${slug}/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.closed) setPhase("closed");
        else if (d.voted) {
          markVoted(slug);
          setPhase("already");
        } else setPhase("vote");
      })
      .catch(() => setPhase("vote"));
  }, [slug, closed]);

  function toggle(id: string) {
    setError("");
    if (allowMultiple) {
      setSelected((prev) => {
        if (prev.includes(id)) return prev.filter((x) => x !== id);
        if (maxChoices && prev.length >= maxChoices) return prev;
        return [...prev, id];
      });
    } else {
      setSelected([id]);
    }
  }

  async function submit() {
    if (selected.length === 0) {
      setError("항목을 선택해 주세요.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/polls/${slug}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: getDeviceId(), optionIds: selected }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        markVoted(slug);
        setPhase("done");
        return;
      }
      if (data.code === "already") {
        markVoted(slug);
        setPhase("already");
        return;
      }
      if (data.code === "closed") {
        setPhase("closed");
        return;
      }
      setError(data.error || "투표에 실패했습니다.");
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  if (phase === "loading") {
    return (
      <Centered>
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-500" />
      </Centered>
    );
  }

  if (phase === "done") {
    return <ThanksScreen slug={slug} showResults={showResults} />;
  }

  if (phase === "already") {
    return (
      <StatusScreen
        emoji="✅"
        title="이미 참여하셨습니다"
        message="이 투표에는 한 번만 참여할 수 있어요. 소중한 한 표 감사합니다!"
      />
    );
  }

  if (phase === "closed") {
    return (
      <StatusScreen
        emoji="🔒"
        title="마감된 투표입니다"
        message="이 투표는 종료되어 더 이상 참여할 수 없습니다."
      />
    );
  }

  // 투표 화면
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 py-9">
      <header className="mb-6 animate-pop">
        <span className="mb-2 inline-block rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-600">
          {allowMultiple ? `복수 선택${maxChoices ? ` · 최대 ${maxChoices}개` : ""}` : "한 개 선택"}
        </span>
        <h1 className="text-2xl font-extrabold leading-snug">{title}</h1>
        {description && <p className="mt-2 whitespace-pre-wrap text-soft">{description}</p>}
      </header>

      <div className="flex-1 space-y-3">
        {options.map((o, i) => {
          const isSel = selected.includes(o.id);
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => toggle(o.id)}
              data-selected={isSel}
              className="choice flex w-full animate-pop items-center gap-3"
              style={{ animationDelay: `${0.04 * i}s` }}
            >
              <span
                className="grid h-6 w-6 shrink-0 place-items-center border-2 transition"
                style={{
                  borderRadius: allowMultiple ? "0.5rem" : "9999px",
                  borderColor: isSel ? "var(--color-brand-500)" : "var(--border)",
                  background: isSel ? "var(--color-brand-500)" : "transparent",
                  color: "white",
                }}
              >
                {isSel ? "✓" : ""}
              </span>
              <span className="text-left font-semibold">{o.label}</span>
            </button>
          );
        })}
      </div>

      {error && (
        <p className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-center text-sm font-medium text-red-500">
          {error}
        </p>
      )}

      <div className="sticky bottom-0 mt-6 pb-[env(safe-area-inset-bottom)] pt-3">
        <button
          className="btn btn-primary w-full text-base"
          onClick={submit}
          disabled={submitting || selected.length === 0}
        >
          {submitting ? "제출 중…" : "투표하기"}
        </button>
        <div className="mt-4 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3.5 text-center">
          <p className="text-sm font-bold text-brand-700">🔒 완전 익명 투표</p>
          <p className="mt-1.5 text-xs leading-relaxed text-soft">
            개개인의 투표 내용은 <b className="text-brand-700">암호화되어</b> 보관되며,
            <br />
            누가 무엇을 선택했는지는 <b className="text-brand-700">관리자조차 확인할 수 없습니다.</b>
          </p>
          <p className="mt-1.5 text-xs text-soft">
            관리자는 항목별 <b>합계 결과</b>만 볼 수 있어요.
          </p>
        </div>
      </div>
    </main>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <main className="grid min-h-dvh place-items-center px-5">{children}</main>;
}

function StatusScreen({
  emoji,
  title,
  message,
}: {
  emoji: string;
  title: string;
  message: string;
}) {
  return (
    <main className="grid min-h-dvh place-items-center px-5">
      <div className="card animate-pop w-full max-w-sm p-8 text-center">
        <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-brand-500 to-accent-500 text-4xl">
          {emoji}
        </div>
        <h1 className="text-xl font-extrabold">{title}</h1>
        <p className="mt-2 text-soft">{message}</p>
      </div>
    </main>
  );
}

type Results = {
  title: string;
  totalBallots: number;
  options: { id: string; label: string; count: number }[];
};

function ThanksScreen({ slug, showResults }: { slug: string; showResults: boolean }) {
  const [results, setResults] = useState<Results | null>(null);

  useEffect(() => {
    if (!showResults) return;
    fetch(`/api/polls/${slug}/results`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setResults(d))
      .catch(() => {});
  }, [slug, showResults]);

  return (
    <main className="grid min-h-dvh place-items-center px-5 py-10">
      <div className="card animate-pop w-full max-w-sm p-8 text-center">
        <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-brand-500 to-accent-500 text-4xl">
          🎉
        </div>
        <h1 className="text-xl font-extrabold">투표 완료!</h1>
        <p className="mt-2 text-soft">
          소중한 한 표 감사합니다.
          {!showResults &&
            " 내 선택은 암호화되어, 누가 무엇을 골랐는지는 아무도 확인할 수 없어요."}
        </p>

        {showResults && results && (
          <div className="mt-6 space-y-3 text-left">
            <p className="text-xs font-semibold text-soft">
              총 {results.totalBallots}명 참여
            </p>
            {results.options
              .slice()
              .sort((a, b) => b.count - a.count)
              .map((o) => {
                const pct = results.totalBallots
                  ? Math.round((o.count / results.totalBallots) * 100)
                  : 0;
                return (
                  <div key={o.id}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-semibold">{o.label}</span>
                      <span className="text-soft">
                        {o.count}표 · {pct}%
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-[var(--border)]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </main>
  );
}
