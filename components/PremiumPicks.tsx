"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useFreshness } from "./useFreshness";

interface Pick {
  n: number;
  score: number;
}

// 付費高分精選：已登入且 pro/max 會員 fetch 真號碼顯示；否則維持遮罩版（children=LockedPicks）。
// 並做「過期保護」：若這組精選針對的那一期已開獎，不顯示號碼，改顯示計算中，避免誤用於投注。
export function PremiumPicks({
  game,
  gameName,
  window: win = 50,
  children,
}: {
  game: string;
  gameName: string;
  window?: number;
  children: ReactNode;
}) {
  const [state, setState] = useState<"loading" | "locked" | "unlocked">("loading");
  const [picks, setPicks] = useState<Pick[]>([]);
  const [period, setPeriod] = useState<string | undefined>(undefined);
  const { stale } = useFreshness(game, state === "unlocked" ? period : undefined);

  useEffect(() => {
    fetch(`/api/me/picks?game=${game}`, { credentials: "same-origin" })
      .then(async (r) => {
        if (!r.ok) return setState("locked");
        const d = await r.json();
        setPicks(d.picks ?? []);
        setPeriod(d.period);
        setState("unlocked");
      })
      .catch(() => setState("locked"));
  }, [game]);

  if (state !== "unlocked") return <>{children}</>;

  // 過期保護：已開獎，新一期還沒算好
  if (stale) {
    return (
      <div className="glass relative overflow-hidden border-[rgba(255,210,74,0.4)] p-5 sm:p-6">
        <div className="mb-1 flex items-center gap-2">
          <span className="tag border-[rgba(255,210,74,0.5)] text-[#ffd24a]">⏳ 更新中</span>
          <span className="tag">AI 綜合評分</span>
        </div>
        <h3 className="font-display text-lg font-bold text-[var(--text)]">本期 {gameName} 新一期分析計算中</h3>
        <p className="mt-2 rounded-lg border border-[rgba(255,210,74,0.35)] bg-[rgba(255,210,74,0.08)] p-3 text-sm leading-relaxed text-[var(--text)]">
          上一組精選（第 {period} 期資料）對應的開獎已結束，新一期精選正在計算。
          <strong className="text-[#ffd24a]">此時不顯示號碼，請勿用於本期投注。</strong>稍後更新完成即會顯示。
        </p>
      </div>
    );
  }

  return (
    <div className="glow-wrap glass relative overflow-hidden p-5 sm:p-6">
      <div className="mb-1 flex items-center gap-2">
        <span className="tag border-[rgba(0,255,135,0.4)] text-[var(--cold)]">🔓 已解鎖</span>
        <span className="tag">AI 綜合評分</span>
      </div>
      <h3 className="font-display text-lg font-bold text-[var(--text)]">
        本期 {gameName} AI 高評分精選 <span className="num text-[var(--cold)]">{picks.length}</span> 碼
      </h3>
      <p className="mt-1 text-[12px] text-[var(--muted)]">
        <span className="rounded bg-[rgba(0,255,135,0.12)] px-1.5 py-0.5 font-bold text-[var(--cold)]">近 {win} 期統計</span>
        {" "}· 資料截至第 {period} 期，供下一期參考（進階／旗艦會員專屬）。
      </p>
      <div className="mt-5 flex flex-wrap items-start gap-4">
        {picks.map((p) => (
          <div key={p.n} className="flex flex-col items-center gap-1">
            <span className="num inline-flex h-12 w-12 items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_30%,#6bffc0,var(--cold))] text-lg font-bold text-[#04221a] shadow-[0_0_12px_rgba(0,255,135,0.4)]">
              {String(p.n).padStart(2, "0")}
            </span>
            <span className="num text-[11px] text-[var(--muted)]">{p.score.toFixed(1)}</span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[11px] leading-relaxed text-[var(--muted)]">
        ※ 分數為相對綜合評分（0–100），僅供號碼間比較參考，<strong className="text-[var(--text)]">不是中獎機率</strong>。
      </p>
    </div>
  );
}
