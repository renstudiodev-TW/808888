"use client";

import type { Question } from "@/lib/story/types";

export const TEXT_MAX = 20;

/** 回傳這題目前的狀態提示；null 代表已填好 */
export function questionIssue(q: Question, value: string): string | null {
  const v = value.trim();
  if (v === "") return "還沒填";
  if (q.kind === "number") {
    const n = Number(v);
    if (!Number.isInteger(n)) return "請填整數";
    if (q.min !== undefined && n < q.min) return `請填 ${q.min} 以上`;
    if (q.max !== undefined && n > q.max) return `請填 ${q.max} 以下`;
  }
  if (q.kind === "text" && Array.from(v).length > TEXT_MAX) return `最多 ${TEXT_MAX} 字`;
  return null;
}

const inputCls =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-base text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--neon)] focus:outline-none";

export function QuestionField({
  q,
  index,
  value,
  onChange,
}: {
  q: Question;
  index: number;
  value: string;
  onChange: (v: string) => void;
}) {
  const issue = questionIssue(q, value);
  const id = `story-q-${q.id}`;
  // 手機鍵盤跳出來時，把輸入框捲到畫面中間，避免被蓋住
  const keepVisible = (e: React.FocusEvent<HTMLElement>) => {
    const el = e.currentTarget;
    setTimeout(() => el.scrollIntoView({ block: "center", behavior: "smooth" }), 300);
  };

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[rgba(18,24,36,0.6)] p-4">
      <div className="mb-2 flex items-start justify-between gap-3">
        <label htmlFor={id} className="text-base font-bold text-[var(--text)]">
          <span className="num mr-1.5 text-[var(--primary)]">{index + 1}.</span>
          {q.label}
        </label>
        {issue && <span className="shrink-0 pt-0.5 text-xs font-semibold text-[var(--hot)]">{issue}</span>}
      </div>

      {q.kind === "number" && (
        <div className="flex items-center gap-2">
          <input
            id={id}
            type="number"
            inputMode="numeric"
            min={q.min}
            max={q.max}
            step={1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={keepVisible}
            placeholder={q.min !== undefined && q.max !== undefined ? `${q.min} ~ ${q.max}` : ""}
            className={`${inputCls} num`}
          />
          {q.unit && <span className="shrink-0 text-sm text-[var(--muted)]">{q.unit}</span>}
        </div>
      )}

      {q.kind === "choice" && (q.options?.length ?? 0) > 8 && (
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={keepVisible}
          className={inputCls}
        >
          <option value="">請選擇</option>
          {q.options!.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      )}

      {q.kind === "choice" && (q.options?.length ?? 0) <= 8 && (
        <div id={id} role="radiogroup" aria-label={q.label} className="flex flex-wrap gap-2">
          {q.options!.map((o) => {
            const active = o === value;
            return (
              <button
                key={o}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onChange(o)}
                className={`min-h-11 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? "border-[var(--neon)] bg-[rgba(0,240,255,0.14)] text-[var(--neon)]"
                    : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] hover:border-[rgba(0,240,255,0.5)]"
                }`}
              >
                {o}
              </button>
            );
          })}
        </div>
      )}

      {q.kind === "text" && (
        <>
          <input
            id={id}
            type="text"
            maxLength={TEXT_MAX}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={keepVisible}
            placeholder={q.placeholder}
            enterKeyHint="done"
            className={inputCls}
          />
          <div className="mt-1 text-right text-xs text-[var(--muted)]">
            還能輸入 <span className="num">{Math.max(0, TEXT_MAX - Array.from(value).length)}</span> 字
          </div>
        </>
      )}
    </div>
  );
}
