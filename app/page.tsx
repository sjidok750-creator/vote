"use client";

import { useState } from "react";
import CreatedView from "./_components/created-view";
import MyPollsList from "./_components/my-polls-list";

type DupMode = "device" | "ip" | "strict" | "none";

const DUP_OPTIONS: { value: DupMode; label: string; hint: string }[] = [
  { value: "device", label: "기기 기준", hint: "같은 휴대폰/브라우저는 1회만 (추천)" },
  { value: "ip", label: "IP 기준", hint: "같은 네트워크에서 1회만" },
  { value: "strict", label: "엄격 (기기+IP)", hint: "기기 또는 IP가 같으면 차단" },
  { value: "none", label: "중복 허용", hint: "여러 번 투표 가능" },
];

export default function Home() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [maxChoices, setMaxChoices] = useState<number | "">("");
  const [dupMode, setDupMode] = useState<DupMode>("device");
  const [showResults, setShowResults] = useState(false);
  const [closesAt, setClosesAt] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{ slug: string; adminToken: string } | null>(null);

  const filledOptions = options.map((o) => o.trim()).filter(Boolean);
  const canSubmit = title.trim().length > 0 && filledOptions.length >= 2 && !submitting;

  function updateOption(i: number, value: string) {
    setOptions((prev) => prev.map((o, idx) => (idx === i ? value : o)));
  }
  function addOption() {
    if (options.length >= 30) return;
    setOptions((prev) => [...prev, ""]);
  }
  function removeOption(i: number) {
    setOptions((prev) => (prev.length <= 2 ? prev : prev.filter((_, idx) => idx !== i)));
  }

  async function submit() {
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          options: filledOptions,
          allowMultiple,
          maxChoices: allowMultiple && maxChoices ? Number(maxChoices) : null,
          dupMode,
          showResults,
          closesAt: closesAt ? new Date(closesAt).toISOString() : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "생성에 실패했습니다.");
      setCreated(data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  if (created) {
    return <CreatedView slug={created.slug} adminToken={created.adminToken} title={title} />;
  }

  return (
    <main className="mx-auto w-full max-w-xl px-5 py-10">
      <header className="mb-8 animate-pop">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)]/70 px-3 py-1 text-xs font-medium text-soft">
          <span className="text-base">🔒</span> 익명 · 결과는 관리자만
        </div>
        <h1 className="text-3xl font-extrabold leading-tight">
          <span className="text-gradient">비밀투표</span> 만들기
        </h1>
        <p className="mt-2 text-soft">
          제목과 항목을 만들고 링크를 공유하세요. 참여자는 투표만 하고 결과는 볼 수 없습니다.
        </p>
      </header>

      <MyPollsList />

      <div className="card animate-pop space-y-6 p-6" style={{ animationDelay: "0.05s" }}>
        {/* 제목 */}
        <div>
          <label className="mb-2 block text-sm font-semibold">투표 제목</label>
          <input
            className="input"
            placeholder="예) 우리 팀 회식 메뉴는?"
            value={title}
            maxLength={120}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* 설명 */}
        <div>
          <label className="mb-2 block text-sm font-semibold">
            설명 <span className="font-normal text-soft">(선택)</span>
          </label>
          <textarea
            className="input min-h-[72px] resize-none"
            placeholder="투표에 대한 안내를 적어주세요."
            value={description}
            maxLength={500}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* 항목 */}
        <div>
          <label className="mb-2 block text-sm font-semibold">
            항목 <span className="font-normal text-soft">({filledOptions.length}개)</span>
          </label>
          <div className="space-y-2.5">
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-100 text-sm font-bold text-brand-600">
                  {i + 1}
                </span>
                <input
                  className="input"
                  placeholder={`항목 ${i + 1}`}
                  value={opt}
                  maxLength={120}
                  onChange={(e) => updateOption(i, e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => removeOption(i)}
                  disabled={options.length <= 2}
                  aria-label="항목 삭제"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-soft transition hover:bg-[var(--border)] disabled:opacity-30"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addOption}
            disabled={options.length >= 30}
            className="mt-3 w-full rounded-xl border border-dashed border-brand-300 py-2.5 text-sm font-semibold text-brand-600 transition hover:bg-brand-50 disabled:opacity-40"
          >
            + 항목 추가
          </button>
        </div>

        <hr className="border-[var(--border)]" />

        {/* 설정 */}
        <div className="space-y-5">
          <h2 className="text-sm font-bold text-soft">설정</h2>

          {/* 중복투표 방지 */}
          <div>
            <p className="mb-2 text-sm font-semibold">중복투표 방지</p>
            <div className="grid grid-cols-2 gap-2">
              {DUP_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setDupMode(o.value)}
                  className="choice text-left"
                  data-selected={dupMode === o.value}
                >
                  <span className="block text-sm font-semibold">{o.label}</span>
                  <span className="mt-0.5 block text-xs text-soft">{o.hint}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 선택 방식 */}
          <div>
            <p className="mb-2 text-sm font-semibold">선택 방식</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAllowMultiple(false)}
                className="choice text-center text-sm font-semibold"
                data-selected={!allowMultiple}
              >
                단일 선택
              </button>
              <button
                type="button"
                onClick={() => setAllowMultiple(true)}
                className="choice text-center text-sm font-semibold"
                data-selected={allowMultiple}
              >
                복수 선택
              </button>
            </div>
            {allowMultiple && (
              <div className="mt-3 flex items-center gap-3">
                <span className="text-sm text-soft">최대 선택 개수</span>
                <input
                  type="number"
                  min={1}
                  max={filledOptions.length || 2}
                  className="input w-24"
                  placeholder="제한없음"
                  value={maxChoices}
                  onChange={(e) =>
                    setMaxChoices(e.target.value === "" ? "" : Number(e.target.value))
                  }
                />
              </div>
            )}
          </div>

          {/* 결과 공개 */}
          <ToggleRow
            label="투표자에게 결과 공개"
            hint={
              showResults
                ? "투표 후 결과를 보여줍니다."
                : "결과는 관리자만 볼 수 있습니다. (비밀투표)"
            }
            checked={showResults}
            onChange={setShowResults}
          />

          {/* 마감 시간 */}
          <div>
            <p className="mb-2 text-sm font-semibold">
              마감 시간 <span className="font-normal text-soft">(선택)</span>
            </p>
            <input
              type="datetime-local"
              className="input"
              value={closesAt}
              onChange={(e) => setClosesAt(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-medium text-red-500">
            {error}
          </p>
        )}

        <button className="btn btn-primary w-full text-base" disabled={!canSubmit} onClick={submit}>
          {submitting ? "만드는 중…" : "투표 만들고 링크 받기 →"}
        </button>
      </div>

      <p className="mt-6 text-center text-xs text-soft">
        로그인 없이 익명으로 진행됩니다 · 응답에는 개인정보가 저장되지 않습니다
      </p>
    </main>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 text-left"
    >
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        <span className="mt-0.5 block text-xs text-soft">{hint}</span>
      </span>
      <span
        className="relative h-7 w-12 shrink-0 rounded-full transition-colors"
        style={{ background: checked ? "var(--color-brand-500)" : "var(--border)" }}
      >
        <span
          className="absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all"
          style={{ left: checked ? "1.5rem" : "0.25rem" }}
        />
      </span>
    </button>
  );
}
