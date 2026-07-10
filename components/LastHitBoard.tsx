// 首頁：上一期「AI 精選 vs 實際開獎」戰績。命中金球，命中過半灑彩帶。
// predicted 是用開獎前資料算的，屬已公開的過往預測，可揭露做社會證明。
import { Confetti } from "./Confetti";

const pad = (n: number) => String(n).padStart(2, "0");

// 各遊戲第二區/特別號的稱呼。今彩539 無 → 不顯示。
const SPECIAL_LABEL: Record<string, string> = {
  superLotto638: "第二區",
  lotto649: "特別號",
};

interface LastHit {
  period: string;
  date: string;
  actual: number[];
  special: number | null;
  predicted: number[];
  matched: number[];
  count: number;
  pick: number;
  predictedSpecial: number | null;
  specialHit: boolean;
}

export function LastHitBoard({ items }: { items: { game: string; name: string; lastHit: LastHit | null }[] }) {
  const cards = items.filter((i) => i.lastHit);
  if (cards.length === 0) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map(({ game, name, lastHit }) => {
        const h = lastHit!;
        const matched = new Set(h.matched);
        const half = Math.ceil(h.pick / 2);
        const big = h.count >= half && h.count >= 2;
        // fireKey 用期別數字，穩定不亂數，載入時放一次彩帶
        const fireKey = big ? Number(h.period.slice(-6)) || 1 : 0;
        return (
          <div key={game} className="glass relative overflow-hidden p-5">
            <Confetti fireKey={fireKey} count={22} />
            <div className="relative flex items-center justify-between">
              <span className="font-display text-lg font-bold text-[var(--text)]">{name}</span>
              <span className="num text-[11px] text-[var(--muted)]">第 {h.period} 期</span>
            </div>
            <div className="relative mt-0.5 text-[11px] text-[var(--muted)]">AI 精選 vs 實際開獎</div>

            {/* AI 精選號（命中金球） */}
            <div className="relative mt-3 flex flex-wrap items-center gap-1.5">
              {h.predicted.map((n) => {
                const hit = matched.has(n);
                return (
                  <span
                    key={n}
                    className={`num inline-flex h-9 w-9 items-center justify-center rounded-full border text-sm font-bold ${
                      hit ? "ball-hit" : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted)]"
                    }`}
                  >
                    {pad(n)}
                  </span>
                );
              })}
            </div>

            {/* AI 精選特別號／第二區 vs 實際開出，命中同樣給金球 */}
            {h.special != null && (
              <div className="relative mt-2 flex flex-wrap items-center gap-1.5 text-[12px] text-[var(--muted)]">
                <span>{SPECIAL_LABEL[game] ?? "特別號"}</span>
                {h.predictedSpecial != null && (
                  <>
                    <span className="num inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-2)] text-[13px] font-bold text-[var(--muted)]">
                      {pad(h.predictedSpecial)}
                    </span>
                    <span>AI 精選</span>
                    <span className="px-0.5">→</span>
                  </>
                )}
                <span
                  className={`num inline-flex h-7 w-7 items-center justify-center rounded-full border text-[13px] font-bold ${
                    h.specialHit
                      ? "ball-hit"
                      : "border-[#8b5cf6]/50 bg-[rgba(139,92,246,0.14)] text-[#a78bfa]"
                  }`}
                >
                  {pad(h.special)}
                </span>
                <span>實際開出{h.specialHit ? "，命中！🎯" : ""}</span>
              </div>
            )}

            {/* 戰績 */}
            <div className="relative mt-3">
              {big ? (
                <span className="celebrate-banner throb-gold inline-flex rounded-lg border border-[#ffd24a]/60 bg-[rgba(255,210,74,0.12)] px-3 py-1.5 text-sm font-extrabold text-[#ffd24a]">
                  🎉 神準命中 {h.count}/{h.pick} 碼{h.specialHit ? `＋${SPECIAL_LABEL[game] ?? "特別號"}` : ""}
                </span>
              ) : h.count > 0 ? (
                <span className="inline-flex rounded-lg border border-[#ffd24a]/40 bg-[rgba(255,210,74,0.07)] px-3 py-1.5 text-sm font-bold text-[#ffd24a]">
                  ✨ 命中 {h.count}/{h.pick} 碼{h.specialHit ? `＋${SPECIAL_LABEL[game] ?? "特別號"}` : ""}
                </span>
              ) : h.specialHit ? (
                <span className="inline-flex rounded-lg border border-[var(--primary)]/50 bg-[rgba(139,92,246,0.1)] px-3 py-1.5 text-sm font-bold text-[var(--primary)]">
                  ✨ {SPECIAL_LABEL[game] ?? "特別號"}中了！
                </span>
              ) : (
                <span className="text-[13px] text-[var(--muted)]">這期 AI 精選未命中（{h.pick} 碼全落空）</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
