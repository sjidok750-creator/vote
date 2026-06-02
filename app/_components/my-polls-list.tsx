"use client";

import { useEffect, useState } from "react";
import { getMyPolls, removeMyPoll, type MyPoll } from "../_lib/my-polls";

export default function MyPollsList() {
  const [polls, setPolls] = useState<MyPoll[] | null>(null);

  useEffect(() => {
    setPolls(getMyPolls());
  }, []);

  function forget(adminToken: string) {
    removeMyPoll(adminToken);
    setPolls((prev) => prev?.filter((p) => p.adminToken !== adminToken) ?? null);
  }

  // 첫 렌더(서버/하이드레이션) 또는 목록이 비어있으면 표시하지 않음
  if (!polls || polls.length === 0) return null;

  return (
    <section className="card animate-pop mb-6 p-5" style={{ animationDelay: "0.03s" }}>
      <div className="mb-3 flex items-center gap-2">
        <span className="text-lg">🗂️</span>
        <h2 className="font-bold">이 기기에서 만든 투표</h2>
        <span className="ml-auto text-xs text-soft">{polls.length}개</span>
      </div>

      <ul className="space-y-2">
        {polls.map((p) => (
          <li
            key={p.adminToken}
            className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5"
          >
            <a
              href={`/r/${p.adminToken}`}
              className="min-w-0 flex-1"
              title="결과 보기"
            >
              <span className="block truncate text-sm font-semibold">
                {p.title || "(제목 없음)"}
              </span>
              <span className="mt-0.5 block text-xs text-soft">
                {formatDate(p.createdAt)} · 결과 보기 →
              </span>
            </a>
            <button
              type="button"
              onClick={() => forget(p.adminToken)}
              aria-label="목록에서 지우기"
              title="목록에서 지우기 (투표는 삭제되지 않습니다)"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-soft transition hover:bg-[var(--border)]"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-xs text-soft">
        이 목록은 이 브라우저에만 저장됩니다. 다른 기기에서 보려면 관리자 링크를 보관하세요.
      </p>
    </section>
  );
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}
