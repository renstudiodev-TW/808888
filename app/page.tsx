import Link from "next/link";
import { loadGame, loadIndex } from "@/lib/data";
import { LockedPicks } from "@/components/LockedPicks";
import { FreePicks } from "@/components/FreePicks";

const GAME_META: Record<string, { emoji: string; desc: string }> = {
  daily539: { emoji: "🎯", desc: "5/39 · 玩家最多、抓牌技巧最豐富" },
  lotto649: { emoji: "💎", desc: "6/49 + 特別號 · 頭獎累積上看數億" },
  superLotto638: { emoji: "⚡", desc: "第一區 6/38 + 第二區 1/8" },
};

export default async function Home() {
  const [index, d539] = await Promise.all([loadIndex(), loadGame("daily539")]);

  return (
    <div className="mx-auto max-w-6xl px-5">
      {/* Hero */}
      <section className="relative py-16 text-center sm:py-24">
        <div className="glow-wrap mx-auto max-w-3xl">
          <span className="tag mx-auto mb-5 inline-flex border-[rgba(0,240,255,0.35)] text-[var(--neon)]">
            ✦ AI 統計 × 台灣民間抓牌術
          </span>
          <h1 className="font-display text-4xl leading-tight font-bold sm:text-6xl">
            <span className="text-[var(--text)]">科學的盡頭，</span>
            <span className="text-gradient">是玄學</span>
          </h1>
          <p className="mt-4 font-display text-lg font-semibold text-[var(--neon)] sm:text-xl">
            808888 ｜ 把玄學，變成數據
          </p>
          <p className="mx-auto mt-5 max-w-xl text-[var(--muted)]">
            老師傅的冷熱號、遺漏、尾數、拖牌版路…十多種民間抓牌絕活，AI 一次算給你看，
            每天開獎前報你一手。
          </p>
          <span className="mt-5 inline-flex items-center gap-1 rounded-full border border-[rgba(255,42,95,0.4)] bg-[rgba(255,42,95,0.06)] px-3 py-1 text-[12px] text-[var(--hot)]">
            🔥 全亞洲最敢算發發發的 AI
          </span>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/games/daily539" className="btn-primary">看今彩539 分析</Link>
            <Link href="/pricing" className="btn-ghost">訂閱方案</Link>
          </div>
          <p className="mt-4 text-[12px] text-[var(--muted)]">
            ⚠️ 樂透為獨立隨機事件，本站僅供參考娛樂，無法提高中獎率、不保證中獎。
          </p>
        </div>
      </section>

      {/* 今日報牌 (539) */}
      <section className="mb-16">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-2xl font-bold text-[var(--text)]">今日報牌 · 今彩539</h2>
          <Link href="/games/daily539" className="text-sm text-[var(--neon)] hover:underline">完整分析 →</Link>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <LockedPicks picks={d539.lockedPicks} gameName="今彩539" />
          <FreePicks picks={d539.freePicks} gameName="今彩539" />
        </div>
      </section>

      {/* 彩種卡片 */}
      <section className="mb-16">
        <h2 className="mb-4 font-display text-2xl font-bold text-[var(--text)]">支援彩種</h2>
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
            { n: "3", t: "AI 綜合評分", d: "多指標加權整合成單一分數排名，每日報牌、高機率精選解鎖。" },
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
