"use client";

import { useMemo } from "react";
import { useSelection } from "./SelectionContext";

interface HC { n: number; tag: "hot" | "cold" | "normal" }

const pad = (n: number) => String(n).padStart(2, "0");

/** 黏在視窗頂端的迷你選號條：往下滑看工具時，隨時看得到自己的牌與冷熱摘要。點一下回到選號框。 */
export function SelectionSticky({ hotCold = [] }: { hotCold?: HC[] }) {
  const sel = useSelection();
  const tagOf = useMemo(() => new Map(hotCold.map((h) => [h.n, h.tag])), [hotCold]);
  if (!sel) return null;
  const { picks, special, pick, full } = sel;

  const hot = picks.filter((n) => tagOf.get(n) === "hot").length;
  const cold = picks.filter((n) => tagOf.get(n) === "cold").length;

  function toPanel() {
    document.getElementById("pick-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="sticky top-0 z-40 -mx-5 mb-4 border-b border-[var(--border)] bg-[rgba(10,14,22,0.82)] px-5 py-2 backdrop-blur-md">
      <button onClick={toPanel} className="flex w-full items-center gap-2 text-left">
        <span className="shrink-0 text-xs font-bold text-[var(--neon)]">🎯 我的牌</span>
        {picks.length === 0 ? (
          <span className="text-xs text-[var(--muted)]">點此選號，往下每個工具都會幫你驗牌</span>
        ) : (
          <>
            <span className="flex flex-wrap items-center gap-1">
              {picks.map((n) => {
                const t = tagOf.get(n) ?? "normal";
                const cls = t === "hot" ? "ball-hot" : t === "cold" ? "ball-cold" : "";
                return (
                  <span
                    key={n}
                    className={`num inline-flex h-6 w-6 items-center justify-center rounded-full ${cls} border border-[var(--border)] text-[11px] font-bold`}
                  >
                    {pad(n)}
                  </span>
                );
              })}
              {special != null && (
                <>
                  <span className="text-[11px] text-[var(--muted)]">＋</span>
                  <span className="num inline-flex h-6 w-6 items-center justify-center rounded-full ball-special text-[11px] font-bold">
                    {pad(special)}
                  </span>
                </>
              )}
            </span>
            <span className="ml-auto shrink-0 text-[11px] text-[var(--muted)]">
              {full ? (
                <>
                  <span className="text-[var(--hot)]">{hot}熱</span> · <span className="text-[var(--cold)]">{cold}冷</span>
                </>
              ) : (
                <span>{picks.length}/{pick}</span>
              )}
              <span className="ml-2 underline">編輯</span>
            </span>
          </>
        )}
      </button>
    </div>
  );
}
