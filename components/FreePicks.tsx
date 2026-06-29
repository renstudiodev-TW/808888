"use client";

import { NumberBall } from "./NumberBall";
import { useFreshness } from "./useFreshness";

// 每日免費精選：中評分參考號（號碼露出）。過期（對應期已開獎）時隱藏號碼，避免誤用。
export function FreePicks({
  picks,
  gameName,
  game,
  dataPeriod,
  window: win = 50,
}: {
  picks: { n: number; score: number }[];
  gameName: string;
  game: string;
  dataPeriod?: string | null;
  window?: number;
}) {
  const { stale } = useFreshness(game, dataPeriod);

  return (
    <div className="glass p-5 sm:p-6">
      <div className="mb-1 flex items-center gap-2">
        <span className="tag border-[rgba(0,255,135,0.35)] text-[var(--cold)]">免費</span>
        <span className="tag">每日參考精選</span>
      </div>
      <h3 className="font-display text-lg font-bold text-[var(--text)]">本期 {gameName} 參考號</h3>

      {stale ? (
        <p className="mt-4 rounded-lg border border-[rgba(255,210,74,0.35)] bg-[rgba(255,210,74,0.08)] p-3 text-sm leading-relaxed text-[var(--text)]">
          ⏳ 上一組（第 {dataPeriod} 期資料）對應開獎已結束，新一期計算中。
          <strong className="text-[#ffd24a]">此時不顯示號碼，請勿用於本期投注。</strong>
        </p>
      ) : (
        <>
          <p className="mt-1 mb-1 text-[12px] text-[var(--muted)]">
            <span className="rounded bg-[rgba(0,255,135,0.12)] px-1.5 py-0.5 font-bold text-[var(--cold)]">近 {win} 期統計</span>
            {" "}· 資料截至第 {dataPeriod} 期，供下一期參考。
          </p>
          <p className="mb-5 text-sm text-[var(--muted)]">綜合評分中段的參考號碼，免費提供。高評分精選請見上方解鎖。</p>
          <div className="flex flex-wrap items-start gap-4">
            {picks.map((p) => (
              <NumberBall key={p.n} n={p.n} tone="cold" size="lg" sub={p.score.toFixed(1)} />
            ))}
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-[var(--muted)]">
            ※ 號碼下方數字為相對綜合評分（0–100），僅供號碼間比較參考，<strong className="text-[var(--text)]">不是中獎機率</strong>。
          </p>
        </>
      )}
    </div>
  );
}
