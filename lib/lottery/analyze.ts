// 把一個彩種的歷史開獎，算成前端要用的完整分析包 (AnalysisBundle)。

import type { Draw, GameConfig, History } from "./types";
import {
  hotCold, omission, tailDistribution, zoneStats, zodiacStats,
  coOccurrence, dragFor, patternSeries, expectedSum, secondAreaStats,
  type HotColdItem, type OmissionItem, type TailItem, type ZoneItem,
  type ZodiacItem, type DragResult, type PatternStat, type SecondAreaItem,
} from "./indicators";
import { comboScore, applyRestCap, type ScoreItem } from "./score";
import { backtest, tierAttributionForLatest, type MethodResult, type TierAttribution } from "./backtest";

/** 上一期戰績：用「開獎前的資料」算出的 AI 精選，對比該期實際開獎的命中。 */
export interface LastHit {
  period: string;
  date: string;
  actual: number[];
  special: number | null;
  predicted: number[]; // 用 history[:-1] 的 AI 綜合評分前 pick 名
  matched: number[]; // predicted ∩ actual
  count: number;
  pick: number;
  predictedSpecial: number | null; // AI 精選特別號／第二區（用開獎前資料的冷熱最熱 1 號）
  specialHit: boolean; // predictedSpecial 是否命中實際開出的特別號／第二區
}

export interface AnalysisBundle {
  game: string;
  name: string;
  pool: number;
  pick: number;
  hasSpecial: boolean;
  totalDraws: number;
  year: number;
  window: number;
  latest: Draw | null;
  lastHit: LastHit | null;
  tierAttribution: TierAttribution | null;
  recent: Draw[]; // 最近 20 期 (走勢圖用)
  hotCold: HotColdItem[];
  omission: OmissionItem[];
  tail: TailItem[];
  zone: ZoneItem[];
  zodiac: ZodiacItem[];
  secondArea: SecondAreaItem[] | null; // 威力彩第二區 1-8 冷熱/遺漏
  drags: DragResult[];
  co: number[][];
  patterns: PatternStat[]; // 最近 60 期
  patternSummary: {
    expectedSum: number;
    sumHistogram: { bucket: string; count: number }[];
    oddEven: { ratio: string; count: number }[];
    acHistogram: { ac: number; count: number }[];
  };
  score: ScoreItem[];
  recommendations: number[]; // 綜合評分前 pick*2 名
  leaderboard: { evaluated: number; pick: number; results: MethodResult[] }; // 抓法命中率回測
  generatedAt: string;
}

function yearOf(history: History): number {
  const last = history[history.length - 1];
  if (last?.date) return Number(last.date.slice(0, 4));
  return new Date().getFullYear();
}

function sumHistogram(patterns: PatternStat[]): { bucket: string; count: number }[] {
  if (patterns.length === 0) return [];
  const sums = patterns.map((p) => p.sum);
  const min = Math.min(...sums);
  const max = Math.max(...sums);
  const bucketSize = Math.max(1, Math.ceil((max - min) / 12));
  const buckets = new Map<number, number>();
  for (const s of sums) {
    const b = Math.floor((s - min) / bucketSize);
    buckets.set(b, (buckets.get(b) ?? 0) + 1);
  }
  return [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([b, count]) => {
      const lo = min + b * bucketSize;
      const hi = lo + bucketSize - 1;
      return { bucket: `${lo}-${hi}`, count };
    });
}

export function analyze(
  history: History,
  g: GameConfig,
  opts: {
    window?: number;
    zoneSize?: number;
    generatedAt: string;
    recentPicks?: number[][];
    restNumbers?: number[];
  }
): AnalysisBundle {
  const window = opts.window ?? 50;
  const zoneSize = opts.zoneSize ?? 10;
  const year = yearOf(history);
  const patterns = patternSeries(history, g);
  const oddEvenMap = new Map<string, number>();
  const acMap = new Map<number, number>();
  for (const p of patterns) {
    const key = `${p.odd}:${p.even}`;
    oddEvenMap.set(key, (oddEvenMap.get(key) ?? 0) + 1);
    acMap.set(p.ac, (acMap.get(p.ac) ?? 0) + 1);
  }

  const drags: DragResult[] = [];
  for (let n = 1; n <= g.pool; n++) drags.push(dragFor(history, g, n, 6));

  // 評分用較短視窗（SCORE_WINDOW）+ 近日去重，讓每日精選更靈敏、不連日重複；
  // 圖表指標（hotCold/tail/zone）維持 window 期不變。
  // restNumbers：連席達上限、本期強制輪休的號，移到排序末端 → top-pick 不含它們。
  const rest = new Set(opts.restNumbers ?? []);
  const score = applyRestCap(comboScore(history, g, { zoneSize, recentPicks: opts.recentPicks }), rest);
  const recommendations = score.slice(0, g.pick * 2).map((s) => s.n).sort((a, b) => a - b);

  // 上一期戰績：用開獎「前」的資料(history[:-1])算 AI 精選，比對最新一期實際開獎。
  let lastHit: LastHit | null = null;
  const latestDraw = history[history.length - 1];
  if (latestDraw && history.length > window + 1) {
    const prior = history.slice(0, -1);
    const predicted = applyRestCap(comboScore(prior, g, { zoneSize, recentPicks: opts.recentPicks }), rest)
      .slice(0, g.pick)
      .map((s) => s.n)
      .sort((a, b) => a - b);
    const actualSet = new Set(latestDraw.numbers);
    const matched = predicted.filter((n) => actualSet.has(n));

    // 特別號／第二區 AI 精選：用開獎前資料算冷熱，取最熱門 1 號當精選值，可比對命中。
    // 大樂透特別號與主區同池(1..pool)、威力彩第二區用 g.second.pool，其餘無特別號則不算。
    const specialPool = g.second?.pool ?? (g.hasSpecial ? g.pool : 0);
    let predictedSpecial: number | null = null;
    if (specialPool > 0) {
      const items = secondAreaStats(prior, specialPool, window)
        .slice()
        .sort((a, b) => b.freq - a.freq || a.n - b.n);
      predictedSpecial = items[0]?.n ?? null;
    }
    const actualSpecial = latestDraw.special ?? null;
    const specialHit = predictedSpecial != null && predictedSpecial === actualSpecial;

    lastHit = {
      period: latestDraw.period,
      date: latestDraw.date,
      actual: latestDraw.numbers,
      special: actualSpecial,
      predicted,
      matched,
      count: matched.length,
      pick: g.pick,
      predictedSpecial,
      specialHit,
    };
  }

  return {
    game: g.id,
    name: g.name,
    pool: g.pool,
    pick: g.pick,
    hasSpecial: g.hasSpecial,
    totalDraws: history.length,
    year,
    window,
    latest: history[history.length - 1] ?? null,
    lastHit,
    tierAttribution: tierAttributionForLatest(history, g),
    recent: history.slice(-20),
    hotCold: hotCold(history, g, window),
    omission: omission(history, g),
    tail: tailDistribution(history, g, window),
    zone: zoneStats(history, g, zoneSize, window),
    zodiac: zodiacStats(history, g, year, window),
    secondArea: g.second ? secondAreaStats(history, g.second.pool, window) : null,
    drags,
    co: coOccurrence(history, g),
    patterns: patterns.slice(-60),
    patternSummary: {
      expectedSum: expectedSum(g),
      sumHistogram: sumHistogram(patterns),
      oddEven: [...oddEvenMap.entries()].sort((a, b) => b[1] - a[1]).map(([ratio, count]) => ({ ratio, count })),
      acHistogram: [...acMap.entries()].sort((a, b) => a[0] - b[0]).map(([ac, count]) => ({ ac, count })),
    },
    score,
    recommendations,
    leaderboard: backtest(history, g, { k: 80, window }),
    generatedAt: opts.generatedAt,
  };
}
