"use client";

import { useMemo } from "react";
import { useSelection } from "./SelectionContext";

interface HC { n: number; tag: "hot" | "cold" | "normal" }

const pad = (n: number) => String(n).padStart(2, "0");

/** 可編輯的自選號碼盤。選滿後其餘號碼自動鎖住。 */
export function SelectionPanel({ hotCold = [] }: { hotCold?: HC[] }) {
  const sel = useSelection();
  const tagOf = useMemo(() => new Map(hotCold.map((h) => [h.n, h.tag])), [hotCold]);
  if (!sel) return null;
  const { pool, pick, secondPool, picks, special, full, toggle, setSpecial, clear, randomFill } = sel;

  return (
    <section
      id="pick-panel"
      className="mb-4 scroll-mt-2 rounded-2xl border-2 border-[var(--neon)]/40 bg-[linear-gradient(160deg,rgba(0,255,135,0.06),rgba(18,24,36,0.92))] p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-lg font-bold text-[var(--neon)]">🎯 我的自選號碼</div>
        <span className="text-xs text-[var(--muted)]">
          選 {pick} 個{secondPool ? `＋第二區 1 個` : ""}，往下每個工具都會對你這組牌即時解析
        </span>
      </div>

      {/* 你的牌 */}
      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/60 px-4 py-3">
        <span className="text-sm text-[var(--muted)]">你的牌：</span>
        {picks.length === 0 && <span className="text-sm text-[var(--muted)]">點下方號碼盤開始選號</span>}
        {picks.map((n) => {
          const t = tagOf.get(n) ?? "normal";
          const cls = t === "hot" ? "ball-hot" : t === "cold" ? "ball-cold" : "";
          return (
            <span
              key={n}
              className={`num inline-flex h-9 w-9 items-center justify-center rounded-full ${cls} border border-[var(--border)] text-sm font-bold`}
            >
              {pad(n)}
            </span>
          );
        })}
        {secondPool && special != null && (
          <>
            <span className="px-1 text-[var(--muted)]">＋</span>
            <span className="num inline-flex h-9 w-9 items-center justify-center rounded-full ball-special text-sm font-bold">
              {pad(special)}
            </span>
          </>
        )}
        <span className="num ml-1 text-xs text-[var(--muted)]">{picks.length}/{pick}</span>
        <div className="ml-auto flex gap-2">
          <button
            onClick={randomFill}
            className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--text)] transition hover:border-[var(--neon)]"
          >
            🎲 隨機
          </button>
          <button
            onClick={clear}
            className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted)] transition hover:text-[var(--text)]"
          >
            清空
          </button>
        </div>
      </div>

      {/* 主區號碼盤 */}
      <div className="mt-3 grid grid-cols-8 gap-1.5 sm:grid-cols-10">
        {Array.from({ length: pool }, (_, i) => i + 1).map((n) => {
          const on = picks.includes(n);
          const dim = !on && full;
          return (
            <button
              key={n}
              onClick={() => toggle(n)}
              disabled={dim}
              aria-pressed={on}
              className={`num rounded-lg border py-1.5 text-sm font-bold transition ${
                on
                  ? "border-[var(--neon)] bg-[var(--neon)]/20 text-[var(--neon)]"
                  : dim
                    ? "border-[var(--border)] text-[var(--muted)] opacity-30"
                    : "border-[var(--border)] text-[var(--text)] hover:border-[var(--neon)]"
              }`}
            >
              {pad(n)}
            </button>
          );
        })}
      </div>

      {/* 第二區 */}
      {secondPool && (
        <div className="mt-3">
          <div className="mb-1 text-xs text-[var(--muted)]">第二區（1-{secondPool} 選 1）</div>
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: secondPool }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setSpecial(special === n ? null : n)}
                aria-pressed={special === n}
                className={`num h-9 w-9 rounded-full border text-sm font-bold transition ${
                  special === n
                    ? "ball-special border-transparent"
                    : "border-[var(--border)] text-[var(--text)] hover:border-[var(--primary)]"
                }`}
              >
                {pad(n)}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
