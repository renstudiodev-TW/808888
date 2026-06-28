import { NumberBall } from "./NumberBall";

/** 每日免費精選：中評分參考號 (號碼露出) */
export function FreePicks({
  picks,
  gameName,
}: {
  picks: { n: number; score: number }[];
  gameName: string;
}) {
  return (
    <div className="glass p-5 sm:p-6">
      <div className="mb-1 flex items-center gap-2">
        <span className="tag border-[rgba(0,255,135,0.35)] text-[var(--cold)]">免費</span>
        <span className="tag">每日參考精選</span>
      </div>
      <h3 className="font-display text-lg font-bold text-[var(--text)]">本期 {gameName} 參考號</h3>
      <p className="mt-1 mb-5 text-sm text-[var(--muted)]">
        綜合評分中段的參考號碼，免費提供。高評分精選請見上方解鎖。
      </p>
      <div className="flex flex-wrap items-start gap-4">
        {picks.map((p) => (
          <NumberBall key={p.n} n={p.n} tone="cold" size="lg" sub={p.score.toFixed(1)} />
        ))}
      </div>
      <p className="mt-4 text-[11px] leading-relaxed text-[var(--muted)]">
        ※ 號碼下方數字為相對綜合評分（0–100），僅供號碼間比較參考，<strong className="text-[var(--text)]">不是中獎機率</strong>。
      </p>
    </div>
  );
}
