import Link from "next/link";
import Image from "next/image";
import { CodeRain } from "@/components/CodeRain";
import { loadGame, loadIndex } from "@/lib/data";
import { LockedPicks } from "@/components/LockedPicks";
import { FreePicks } from "@/components/FreePicks";
import { LatestDraws } from "@/components/LatestDraws";
import { LotteryNews } from "@/components/LotteryNews";
import { Faq } from "@/components/Faq";

// next/image 不會自動為絕對路徑 src 補上 basePath，GitHub Pages 專案頁需手動帶入。
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

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
      <section className="relative overflow-hidden py-16 text-center sm:py-24">
        {/* 駭客任務代碼雨背景（財神爺圖之後疊在此之上） */}
        <CodeRain className="[mask-image:radial-gradient(ellipse_60%_70%_at_50%_45%,transparent_30%,black_100%)]" />
        <div className="relative z-10 glow-wrap mx-auto max-w-3xl">
          <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-[rgba(0,240,255,0.4)] bg-[rgba(0,240,255,0.08)] px-6 py-2.5 text-lg font-extrabold tracking-wide text-[var(--neon)] shadow-[0_0_24px_rgba(0,240,255,0.25)] sm:text-2xl">
            <span>✦</span>
            <span>AI 統計 <span className="text-[var(--muted)]">×</span> 台灣民間抓牌術</span>
          </div>
          <span className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-[rgba(255,42,95,0.5)] bg-[rgba(255,42,95,0.1)] px-6 py-2.5 text-lg font-bold text-[var(--hot)] shadow-[0_0_30px_rgba(255,42,95,0.3)] sm:text-2xl">
            🔥 全亞洲最發發發的 AI 老師傅
          </span>
          <div className="mx-auto mb-6 w-fit">
            <Image
              src={`${basePath}/caishen.png`}
              alt="808888 賽博財神爺 · AI 老師傅"
              width={360}
              height={360}
              priority
              className="rounded-3xl border border-[rgba(0,240,255,0.3)] shadow-[0_0_70px_rgba(139,92,246,0.45)]"
              style={{ width: "min(76vw, 360px)", height: "auto" }}
            />
          </div>
          <h1 className="font-display text-4xl leading-tight font-bold sm:text-6xl">
            <span className="text-[var(--text)]">科學的盡頭，</span>
            <span className="text-gradient">是玄學</span>
          </h1>
          <p className="mt-4 font-display text-xl font-bold text-[var(--neon)] sm:text-2xl">
            808888 ｜ 把玄學，變成數據
          </p>
          <p className="mx-auto mt-5 max-w-xl text-base text-[var(--muted)] sm:text-lg">
            老師傅的冷熱號、遺漏、尾數、拖牌版路…十多種民間抓牌絕活，AI 一次算給你看，
            每天開獎前報你一手。
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/games/daily539" className="btn-primary !px-8 !py-3.5 text-lg">看今彩539 分析</Link>
            <Link href="/pricing" className="btn-ghost !px-8 !py-3.5 text-lg">訂閱方案</Link>
          </div>
          <p className="mt-4 text-[12px] text-[var(--muted)]">
            ⚠️ 樂透為獨立隨機事件，本站僅供參考娛樂，無法提高中獎率、不保證中獎。
          </p>
        </div>
      </section>

      {/* 最新開獎 */}
      <section className="mb-16">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-2xl font-extrabold text-[var(--text)] sm:text-3xl">最新開獎號碼</h2>
          <span className="text-xs text-[var(--muted)]">資料來源：台灣彩券</span>
        </div>
        <LatestDraws />
      </section>

      {/* 今日報牌 (539) */}
      <section className="mb-16">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-2xl font-extrabold text-[var(--text)] sm:text-3xl">今日報牌 · 今彩539</h2>
          <Link href="/games/daily539" className="text-sm text-[var(--neon)] hover:underline">完整分析 →</Link>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <LockedPicks picks={d539.lockedPicks} gameName="今彩539" />
          <FreePicks picks={d539.freePicks} gameName="今彩539" />
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

      {/* 樂透新聞 */}
      <section className="mb-16">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-2xl font-extrabold text-[var(--text)] sm:text-3xl">樂透新聞</h2>
          <span className="text-xs text-[var(--muted)]">即時彙整</span>
        </div>
        <LotteryNews />
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

      {/* 常見問題 (FAQ + JSON-LD) */}
      <Faq />
    </div>
  );
}
