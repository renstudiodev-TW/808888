import type { Metadata } from "next";
import Link from "next/link";
import { loadGame, loadIndex } from "@/lib/data";
import { LockedPicks } from "@/components/LockedPicks";
import { PremiumPicks } from "@/components/PremiumPicks";
import { FreePicks } from "@/components/FreePicks";
import { LastHitBoard } from "@/components/LastHitBoard";
import { SHIPPING_GAMES } from "@/lib/data";

export const metadata: Metadata = {
  title: "數據分析｜冷熱號、遺漏、AI 精選與上期戰績｜808888.tw",
  description:
    "今彩539、大樂透、威力彩的冷熱號、遺漏值、尾數、拖牌與 AI 綜合評分，每天開獎前自動更新。僅供參考娛樂，無法保證中獎。",
  alternates: { canonical: "/analysis/" },
};

const GAME_META: Record<string, { emoji: string; desc: string }> = {
  daily539: { emoji: "🎯", desc: "5/39 · 玩家最多、抓牌技巧最豐富" },
  lotto649: { emoji: "💎", desc: "6/49 + 特別號 · 頭獎累積上看數億" },
  superLotto638: { emoji: "⚡", desc: "第一區 6/38 + 第二區 1/8" },
};

export default async function AnalysisPage() {
  const [index, ...bundles] = await Promise.all([loadIndex(), ...SHIPPING_GAMES.map((g) => loadGame(g))]);
  const d539 = bundles[SHIPPING_GAMES.indexOf("daily539")];
  const d649 = bundles[SHIPPING_GAMES.indexOf("lotto649")];
  const lastHitItems = SHIPPING_GAMES.map((g, i) => ({
    game: g,
    name: bundles[i].name,
    lastHit: bundles[i].lastHit,
  }));

  return (
    <div className="mx-auto max-w-6xl px-5">
      <header className="py-10 text-center sm:py-14">
        <h1 className="font-display text-3xl font-bold text-[var(--text)] sm:text-5xl">
          <span className="text-gradient">數據分析</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-[var(--muted)] sm:text-lg">
          冷熱號、遺漏、尾數、拖牌版路等十多種抓牌絕活，AI 一次算給你看，每天開獎前自動更新。
        </p>
        <p className="mt-3 text-[12px] text-[var(--muted)]">
          ⚠️ 樂透為獨立隨機事件，本站僅供參考娛樂，無法提高中獎率、不保證中獎。
        </p>
      </header>

      {/* 上一期 AI 戰績：預測 vs 實際開獎 */}
      <section className="mb-16">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-2xl font-extrabold text-[var(--text)] sm:text-3xl">上一期 AI 戰績</h2>
          <span className="text-xs text-[var(--muted)]">開獎前精選 vs 實際開獎</span>
        </div>
        <LastHitBoard items={lastHitItems} />
        <p className="mt-3 text-[12px] text-[var(--muted)]">
          以「開獎前的資料」算出 AI 精選，再對比當期實際開獎。歷史命中不代表未來，樂透為獨立隨機事件，僅供參考娛樂。
        </p>
      </section>

      {/* 今日精選 (539) */}
      <section className="mb-16">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-2xl font-extrabold text-[var(--text)] sm:text-3xl">今日精選 · 今彩539</h2>
          <Link href="/games/daily539" className="text-sm text-[var(--neon)] hover:underline">完整分析 →</Link>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <PremiumPicks game="daily539" gameName="今彩539" window={d539.window}>
            <LockedPicks picks={d539.lockedPicks} gameName="今彩539" />
          </PremiumPicks>
          <FreePicks picks={d539.freePicks} gameName="今彩539" game="daily539" dataPeriod={d539.latest?.period} window={d539.window} />
        </div>
      </section>

      {/* 今日精選 (大樂透) */}
      <section className="mb-16">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-2xl font-extrabold text-[var(--text)] sm:text-3xl">今日精選 · 大樂透</h2>
          <Link href="/games/lotto649" className="text-sm text-[var(--neon)] hover:underline">完整分析 →</Link>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <PremiumPicks game="lotto649" gameName="大樂透" window={d649.window}>
            <LockedPicks picks={d649.lockedPicks} gameName="大樂透" />
          </PremiumPicks>
          <FreePicks picks={d649.freePicks} gameName="大樂透" game="lotto649" dataPeriod={d649.latest?.period} window={d649.window} />
        </div>
      </section>

      {/* 彩種卡片 */}
      <section className="mb-16">
        <h2 className="mb-4 font-display text-2xl font-extrabold text-[var(--text)] sm:text-3xl">支援彩種</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {index.games.map((g) => {
            const meta = GAME_META[g.game] ?? { emoji: "🎲", desc: "" };
            return (
              <Link
                key={g.game}
                href={`/games/${g.game}`}
                className="glass group p-5 transition-transform hover:-translate-y-1"
              >
                <div className="mb-2 text-3xl">{meta.emoji}</div>
                <div className="font-display text-xl font-bold text-[var(--text)] group-hover:text-[var(--neon)]">
                  {g.name}
                </div>
                <div className="mt-1 text-sm text-[var(--muted)]">{meta.desc}</div>
                <div className="num mt-3 text-xs text-[var(--muted)]">
                  {g.totalDraws} 期樣本 · 最新 {g.latest}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 怎麼運作 */}
      <section className="mb-16">
        <h2 className="mb-4 font-display text-2xl font-bold text-[var(--text)]">怎麼運作</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { n: "1", t: "抓官方開獎", d: "每日自動同步台灣彩券公開開獎結果，建立完整歷史資料庫。" },
            { n: "2", t: "多技巧演算", d: "冷熱、遺漏、尾數、拖牌、生肖、型態等十多項指標同步計算。" },
            { n: "3", t: "AI 綜合評分", d: "多指標加權整合成單一分數排名，每日精選、高評分精選解鎖。" },
          ].map((s) => (
            <div key={s.n} className="glass p-5">
              <div className="num mb-2 text-2xl font-bold text-[var(--primary)]">0{s.n}</div>
              <div className="font-display text-lg font-bold text-[var(--text)]">{s.t}</div>
              <div className="mt-1 text-sm text-[var(--muted)]">{s.d}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
