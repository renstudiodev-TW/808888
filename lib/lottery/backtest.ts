// 抓法命中率回測：對最近 K 期，每一期都「只用該期之前的資料」用各種抓法選號，
// 再比對實際開出號碼，統計平均命中數。含隨機基準對照（誠實呈現方法是否真的優於亂猜）。
// 免責：歷史表現不代表未來，樂透為獨立隨機事件，僅供參考。

import type { GameConfig, History } from "./types";
import { hotCold, omission, tailDistribution, zoneStats } from "./indicators";
import { comboScore } from "./score";
import { tailOf, zoneOf } from "./util";

export interface MethodResult {
  method: string;
  label: string;
  avgHits: number; // 每期平均命中數（滿分 = pick）
  hitRate: number; // avgHits / pick
  bestDraws: number; // 至少命中 (pick 一半，向上取整) 的期數
}

// 依各號碼分數取前 pick 名（分數高到低）
function topN(scores: Map<number, number>, pool: number, pick: number): number[] {
  const arr: { n: number; s: number }[] = [];
  for (let n = 1; n <= pool; n++) arr.push({ n, s: scores.get(n) ?? 0 });
  arr.sort((a, b) => b.s - a.s);
  return arr.slice(0, pick).map((x) => x.n);
}

// 簡單可重現的偽隨機（種子化），讓隨機基準每次建置一致
function seededPick(pool: number, pick: number, seed: number): number[] {
  let s = (seed * 2654435761) >>> 0;
  const set = new Set<number>();
  while (set.size < pick) {
    s = (s * 1103515245 + 12345) >>> 0;
    set.add((s % pool) + 1);
  }
  return [...set];
}

function pickByHot(hist: History, g: GameConfig, w: number): number[] {
  const hc = hotCold(hist, g, w);
  const m = new Map(hc.map((h) => [h.n, h.z]));
  return topN(m, g.pool, g.pick);
}
function pickByOmission(hist: History, g: GameConfig): number[] {
  const om = omission(hist, g);
  const m = new Map(om.map((o) => [o.n, o.ratio]));
  return topN(m, g.pool, g.pick);
}
function pickByTail(hist: History, g: GameConfig, w: number): number[] {
  const tails = tailDistribution(hist, g, w);
  const rate = new Map(tails.map((t) => [t.tail, t.rate]));
  const m = new Map<number, number>();
  for (let n = 1; n <= g.pool; n++) m.set(n, rate.get(tailOf(n)) ?? 0);
  return topN(m, g.pool, g.pick);
}
function pickByZone(hist: History, g: GameConfig, w: number): number[] {
  const zones = zoneStats(hist, g, 10, w);
  const rate = new Map(zones.map((z) => [z.zone, z.rate]));
  const m = new Map<number, number>();
  for (let n = 1; n <= g.pool; n++) m.set(n, rate.get(zoneOf(n, 10)) ?? 0);
  return topN(m, g.pool, g.pick);
}
function pickByScore(hist: History, g: GameConfig, w: number): number[] {
  return comboScore(hist, g, { window: w }).slice(0, g.pick).map((s) => s.n);
}

const METHODS: { method: string; label: string }[] = [
  { method: "score", label: "AI 綜合評分" },
  { method: "hot", label: "冷熱號" },
  { method: "omission", label: "遺漏回補" },
  { method: "tail", label: "尾數" },
  { method: "zone", label: "區間" },
  { method: "random", label: "隨機亂選（對照組）" },
];

export function backtest(history: History, g: GameConfig, opts: { k?: number; window?: number } = {}): {
  evaluated: number;
  pick: number;
  results: MethodResult[];
} {
  const w = opts.window ?? 50;
  const k = opts.k ?? 80;
  const start = Math.max(w + 1, history.length - k);
  const totals: Record<string, number> = {};
  const best: Record<string, number> = {};
  const halfHit = Math.ceil(g.pick / 2);
  let evaluated = 0;

  for (let t = start; t < history.length; t++) {
    const hist = history.slice(0, t);
    const actual = new Set(history[t].numbers);
    evaluated++;
    const picks: Record<string, number[]> = {
      score: pickByScore(hist, g, w),
      hot: pickByHot(hist, g, w),
      omission: pickByOmission(hist, g),
      tail: pickByTail(hist, g, w),
      zone: pickByZone(hist, g, w),
      random: seededPick(g.pool, g.pick, t),
    };
    for (const m of METHODS) {
      const hits = picks[m.method].filter((n) => actual.has(n)).length;
      totals[m.method] = (totals[m.method] ?? 0) + hits;
      if (hits >= halfHit) best[m.method] = (best[m.method] ?? 0) + 1;
    }
  }

  const results: MethodResult[] = METHODS.map((m) => {
    const avg = evaluated ? (totals[m.method] ?? 0) / evaluated : 0;
    return {
      method: m.method,
      label: m.label,
      avgHits: +avg.toFixed(3),
      hitRate: +(avg / g.pick).toFixed(4),
      bestDraws: best[m.method] ?? 0,
    };
  }).sort((a, b) => b.avgHits - a.avgHits);

  return { evaluated, pick: g.pick, results };
}
