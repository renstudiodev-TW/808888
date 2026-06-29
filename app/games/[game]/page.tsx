import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadGame, SHIPPING_GAMES } from "@/lib/data";
import { NumberBall, ZodiacBadge } from "@/components/NumberBall";
import { Section } from "@/components/Section";
import { HotColdGrid } from "@/components/HotColdGrid";
import { LockedPicks } from "@/components/LockedPicks";
import { PremiumPicks } from "@/components/PremiumPicks";
import { FreePicks } from "@/components/FreePicks";
import { DragReveal } from "@/components/DragReveal";
import {
  HotColdChart, OmissionChart, TailChart, ZoneChart, ZodiacChart, SumChart, ACChart,
} from "@/components/charts";
import { SumTrendChart } from "@/components/SumTrendChart";
import { ConsecutiveStats } from "@/components/ConsecutiveStats";
import { SecondAreaSection } from "@/components/SecondAreaSection";
import { CustomWindowPanel } from "@/components/CustomWindowPanel";
import { CrossSelectPanel } from "@/components/CrossSelectPanel";
import { MethodLeaderboard } from "@/components/MethodLeaderboard";

export function generateStaticParams() {
  return SHIPPING_GAMES.map((game) => ({ game }));
}

const SEO: Record<string, { name: string; kw: string }> = {
  daily539: { name: "今彩539", kw: "今彩539 冷熱號、遺漏值、尾數、區間、拖牌版路、和值走勢與 AI 選號" },
  lotto649: { name: "大樂透", kw: "大樂透 冷熱號、遺漏、特別號、尾數、拖牌與 AI 選號" },
  superLotto638: { name: "威力彩", kw: "威力彩 第一區第二區冷熱號、遺漏、和值走勢與 AI 選號" },
};

export async function generateMetadata({ params }: { params: Promise<{ game: string }> }): Promise<Metadata> {
  const { game } = await params;
  const m = SEO[game];
  if (!m) return {};
  return {
    title: `${m.name}抓牌分析 · 冷熱號遺漏AI選號｜808888.tw`,
    description: `${m.kw}。每日開獎前自動更新，把台灣民間抓牌技巧用 AI 統計算給你看。僅供參考娛樂，無法保證中獎。`,
    alternates: { canonical: `/games/${game}/` },
  };
}

export const dynamicParams = false;

export default async function GamePage({ params }: { params: Promise<{ game: string }> }) {
  const { game } = await params;
  if (!SHIPPING_GAMES.includes(game as (typeof SHIPPING_GAMES)[number])) notFound();
  const d = await loadGame(game);
  const latest = d.latest;

  // 號碼 → 冷熱 tag (給最新一期的球上色)
  const toneOf = new Map(d.hotCold.map((h) => [h.n, h.tag]));
  const topZodiac = [...d.zodiac].sort((a, b) => b.freq - a.freq).slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      {/* 標題 + 最新開獎 */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Link href="/" className="text-sm text-[var(--muted)] hover:text-[var(--neon)]">← 首頁</Link>
            <span className="tag">{d.totalDraws} 期樣本</span>
            <span className="tag">統計區間 近 {d.window} 期</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-gradient">{d.name} 抓牌分析</h1>
        </div>
        {latest && (
          <div className="glass px-4 py-3">
            <div className="mb-2 text-xs text-[var(--muted)]">
              最新開獎 · 第 {latest.period} 期 · {latest.date}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {latest.numbers.map((n) => (
                <NumberBall key={n} n={n} tone={toneOf.get(n) ?? "normal"} />
              ))}
              {latest.special != null && (
                <>
                  <span className="px-1 text-[var(--muted)]">＋</span>
                  <NumberBall n={latest.special} tone="special" />
                </>
              )}
            </div>
            {/* 顏色圖例 */}
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--muted)]">
              <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--hot)]" />熱號</span>
              <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--cold)]" />冷號</span>
              <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-full border border-[var(--border)] bg-[var(--surface-2)]" />普通</span>
              {latest.special != null && (
                <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--primary)]" />特別號</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 每日精選：鎖定高評分 + 免費參考 */}
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <PremiumPicks game={game} gameName={d.name}>
          <LockedPicks picks={d.lockedPicks} gameName={d.name} />
        </PremiumPicks>
        <FreePicks picks={d.freePicks} gameName={d.name} game={game} dataPeriod={d.latest?.period} />
      </div>

      {/* 旗艦自訂分析母數 */}
      <CustomWindowPanel game={game} />

      {/* 旗艦複數抓牌法交叉選牌 */}
      <div className="mb-6">
        <CrossSelectPanel game={game} />
      </div>

      {/* 抓法命中率成績榜 */}
      {d.leaderboard && (
        <div className="mb-6">
          <Section
            title="抓法命中率成績榜"
            tag={`近 ${d.leaderboard.evaluated} 期回測`}
            subtitle="各抓法歷史平均命中數排名，含隨機對照，幫你選用哪種抓法。"
          >
            <MethodLeaderboard data={d.leaderboard} />
          </Section>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* 威力彩第二區 (1-8) */}
        {d.secondArea && (
          <Section
            title="第二區冷熱 · 1-8"
            tag="威力彩第二區"
            subtitle={`近 ${d.window} 期第二區（每期開 1 號）各號的出現次數與遺漏。`}
          >
            <SecondAreaSection data={d.secondArea} />
          </Section>
        )}

        {/* 冷熱號 */}
        <Section title="冷熱號碼盤" tag="近期出現次數" subtitle={`近 ${d.window} 期每個號碼的出現熱度，紅熱綠冷。`}>
          <HotColdGrid data={d.hotCold} />
        </Section>
        <Section title="冷熱長條圖" tag="z-score 判定" subtitle="高於期望值越多越熱，低於越多越冷。">
          <HotColdChart data={d.hotCold} />
        </Section>

        {/* 遺漏值 */}
        <Section title="遺漏值排行" tag="當前遺漏期數" subtitle="距離上次開出最久的前 15 個號碼（玩家常用的「該回補」訊號）。">
          <OmissionChart data={d.omission} />
        </Section>

        {/* 尾數 + 區間 */}
        <div className="grid gap-4">
          <Section title="尾數分佈" tag="個位 0-9" subtitle="把號碼依尾數分 10 組看冷熱。">
            <TailChart data={d.tail} />
          </Section>
          <Section title="區間冷熱" tag="號碼分區" subtitle="各號段近期出現次數。">
            <ZoneChart data={d.zone} />
          </Section>
        </div>

        {/* 生肖 */}
        <Section
          title={`生肖球熱度 · ${d.year} 年`}
          tag="依當年生肖"
          subtitle="號碼依當年生肖分組的近期熱度。"
        >
          <div className="mb-3 flex flex-wrap gap-2">
            {topZodiac.map((z) => (
              <span key={z.zodiac} className="flex items-center gap-1">
                <ZodiacBadge zodiac={z.zodiac} />
                <span className="num text-xs text-[var(--muted)]">{z.freq}次</span>
              </span>
            ))}
          </div>
          <ZodiacChart data={d.zodiac} />
        </Section>

        {/* 型態：和值 + AC */}
        <Section title="和值分佈" tag={`理論平均 ${d.patternSummary.expectedSum}`} subtitle="每期號碼總和的歷史分佈，多數落在中央。">
          <SumChart data={d.patternSummary.sumHistogram} />
        </Section>
        <Section title="AC 離散值分佈" tag="號碼離散度" subtitle="AC 越大代表號碼越分散，越小越像等差。">
          <ACChart data={d.patternSummary.acHistogram} />
        </Section>

        {/* 奇偶比 */}
        <Section title="奇偶比分佈" tag="單雙球比例" subtitle="歷史最常出現的奇偶組合。">
          <div className="flex flex-wrap gap-2">
            {d.patternSummary.oddEven.slice(0, 6).map((o) => (
              <div key={o.ratio} className="flex flex-col items-center rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
                <span className="num text-lg font-bold text-[var(--neon)]">{o.ratio}</span>
                <span className="num text-xs text-[var(--muted)]">{o.count} 期</span>
              </div>
            ))}
          </div>
        </Section>

        {/* 和值走勢（均值回歸） */}
        <Section title="和值走勢 · 均值回歸" tag="標準差帶" subtitle="近期每期和值的走勢與 ±1σ／±2σ 波動帶，看本期是否落在統計極端。">
          <SumTrendChart patterns={d.patterns} expectedSum={d.patternSummary.expectedSum} />
        </Section>

        {/* 連號型態 */}
        <Section title="連號型態" tag="相鄰差 1" subtitle="近期出現連續號碼的頻率，用數據破除「號碼要分散」的迷思。">
          <ConsecutiveStats recent={d.recent} />
        </Section>
      </div>

      {/* 進階分析 */}
      <h2 className="mt-10 mb-4 font-display text-xl font-bold text-[var(--text)]">進階分析</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        {/* 拖牌/版路：進階以上即時解鎖 */}
        <DragReveal game={game} />

        {/* 其他進階功能指引 */}
        <section className="glass p-5 sm:p-6">
          <h2 className="font-display text-lg font-bold text-[var(--text)]">更多進階功能</h2>
          <ul className="mt-3 space-y-2.5 text-sm">
            <li className="text-[var(--muted)]">
              <span className="text-[var(--cold)]">✓</span> <b className="text-[var(--text)]">自訂統計區間</b>：見上方「👑 旗艦自訂分析母數」滑桿（旗艦專屬）
            </li>
            <li className="text-[var(--muted)]">
              <span className="text-[var(--cold)]">✓</span> <b className="text-[var(--text)]">每日 LINE 精選推播</b>：至會員專區開啟（需加官方帳號 @808888.tw 好友）
            </li>
            <li className="text-[var(--muted)]">
              <span className="text-[#ffd24a]">✓</span> <b className="text-[var(--text)]">複數抓牌法交叉選牌</b>：見上方「👑 複數抓牌法交叉選牌」（旗艦）
            </li>
          </ul>
          <Link href="/member/" className="btn-ghost mt-4 !px-4 !py-2 text-sm">前往會員專區</Link>
        </section>
      </div>

      <p className="mt-8 rounded-xl border border-[rgba(255,42,95,0.2)] bg-[rgba(255,42,95,0.04)] p-4 text-[13px] leading-relaxed text-[var(--muted)]">
        ⚠️ 以上所有分析僅是把玩家手算統計自動化，樂透為獨立隨機事件，
        <strong className="text-[var(--text)]">無法提高中獎率、不保證中獎</strong>，僅供參考娛樂。理性購彩，未滿 18 歲不得購買。
      </p>
    </div>
  );
}
