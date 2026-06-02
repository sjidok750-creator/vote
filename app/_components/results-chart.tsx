"use client";

import { useEffect, useState } from "react";

export type ChartOption = { id: string; label: string; count: number };

export const CHART_PALETTE = [
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#ec4899",
  "#f43f5e",
  "#fb923c",
  "#f59e0b",
  "#22d3ee",
  "#10b981",
];

export default function ResultsChart({
  options,
  total,
  animate = true,
}: {
  options: ChartOption[];
  total: number;
  animate?: boolean;
}) {
  const [grown, setGrown] = useState(!animate);
  useEffect(() => {
    if (!animate) return;
    const t = setTimeout(() => setGrown(true), 60);
    return () => clearTimeout(t);
  }, [animate]);

  const sorted = options.slice().sort((a, b) => b.count - a.count);
  const ranked = sorted.map((o) => ({
    ...o,
    pct: total ? (o.count / total) * 100 : 0,
    color: "",
  }));
  // 색상은 원래 표시 순서가 아니라 순위 기준으로 부여
  ranked.forEach((o, i) => (o.color = CHART_PALETTE[i % CHART_PALETTE.length]));

  // 도넛 기하
  const R = 70;
  const STROKE = 26;
  const C = 2 * Math.PI * R;
  let acc = 0;

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
      {/* 도넛 */}
      <div className="relative shrink-0" style={{ width: 200, height: 200 }}>
        <svg width="200" height="200" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r={R} fill="none" stroke="var(--border)" strokeWidth={STROKE} />
          {total > 0 &&
            ranked.map((o) => {
              const len = grown ? (o.pct / 100) * C : 0;
              const seg = (
                <circle
                  key={o.id}
                  cx="100"
                  cy="100"
                  r={R}
                  fill="none"
                  stroke={o.color}
                  strokeWidth={STROKE}
                  strokeDasharray={`${len} ${C - len}`}
                  strokeDashoffset={-acc}
                  strokeLinecap="butt"
                  transform="rotate(-90 100 100)"
                  style={{ transition: "stroke-dasharray 0.9s cubic-bezier(0.22,1,0.36,1)" }}
                />
              );
              acc += grown ? (o.pct / 100) * C : 0;
              return seg;
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold">{total}</span>
          <span className="text-xs text-soft">참여</span>
        </div>
      </div>

      {/* 막대 리스트 */}
      <div className="w-full flex-1 space-y-3">
        {ranked.map((o, i) => (
          <div key={o.id}>
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2 font-semibold">
                <span
                  className="grid h-5 w-5 shrink-0 place-items-center rounded-md text-[11px] font-bold text-white"
                  style={{ background: o.color }}
                >
                  {i + 1}
                </span>
                <span className="truncate">
                  {i === 0 && o.count > 0 ? "👑 " : ""}
                  {o.label}
                </span>
              </span>
              <span className="shrink-0 text-sm font-bold text-soft">
                {o.count}표 · {Math.round(o.pct)}%
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-[var(--border)]">
              <div
                className="h-full rounded-full"
                style={{
                  width: grown ? `${o.pct}%` : "0%",
                  background: o.color,
                  transition: "width 0.9s cubic-bezier(0.22,1,0.36,1)",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
