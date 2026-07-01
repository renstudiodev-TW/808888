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

// ── 反向驗證：已知某一期開獎，回推「哪個抓法 × 哪組參數」命中最多 ──
// 誠實框架：這是事後諸葛（已知開獎才回推），不是預測。用來透明呈現工具的擬合力，
// 並揭露不同抓法/參數的高低起伏，非「保證中獎」。

export interface AttributionEntry {
  method: string;
  label: string;
  window: number; // 0 = 不分視窗（遺漏用全期）
  hits: number;
  picks: number[];
}

export interface ReverseAttribution {
  period: string;
  date: string;
  actual: number[];
  special: number | null;
  pick: number;
  windows: number[];
  best: AttributionEntry;
  entries: AttributionEntry[]; // 各抓法的最佳表現，依命中高到低
  aiHits: number; // 當期 AI 精選（近 50 期）命中，當基準
  randomHits: number; // 隨機對照平均命中，當基準
}

/** 對「最新一期」反推最強抓法組合。用開獎前的資料算，避免未卜先知。 */
export function attributionForLatest(
  history: History,
  g: GameConfig,
  opts: { windows?: number[] } = {}
): ReverseAttribution | null {
  if (history.length < 15) return null;
  const t = history.length - 1;
  const hist = history.slice(0, t);
  const draw = history[t];
  const actual = new Set(draw.numbers);
  const windows = (opts.windows ?? [10, 20, 30, 50, 80, 120]).filter((w) => w < hist.length);
  if (windows.length === 0) return null;
  const hitsOf = (picks: number[]) => picks.filter((n) => actual.has(n)).length;

  const windowed: { method: string; label: string; fn: (w: number) => number[] }[] = [
    { method: "score", label: "AI 綜合評分", fn: (w) => pickByScore(hist, g, w) },
    { method: "hot", label: "冷熱號", fn: (w) => pickByHot(hist, g, w) },
    { method: "tail", label: "尾數", fn: (w) => pickByTail(hist, g, w) },
    { method: "zone", label: "區間", fn: (w) => pickByZone(hist, g, w) },
  ];

  const entries: AttributionEntry[] = [];
  for (const m of windowed) {
    let best: AttributionEntry = { method: m.method, label: m.label, window: windows[0], hits: -1, picks: [] };
    for (const w of windows) {
      const picks = m.fn(w);
      const h = hitsOf(picks);
      if (h > best.hits) best = { method: m.method, label: m.label, window: w, hits: h, picks };
    }
    entries.push(best);
  }
  // 遺漏回補（不分視窗）
  const omPicks = pickByOmission(hist, g);
  entries.push({ method: "omission", label: "遺漏回補", window: 0, hits: hitsOf(omPicks), picks: omPicks });

  entries.sort((a, b) => b.hits - a.hits || a.window - b.window);

  // 基準：當期 AI 精選（近 50 期）與隨機平均
  const aiHits = hitsOf(pickByScore(hist, g, 50));
  let randTotal = 0;
  const seeds = 5;
  for (let s = 0; s < seeds; s++) randTotal += hitsOf(seededPick(g.pool, g.pick, t * 7 + s + 1));

  return {
    period: draw.period,
    date: draw.date,
    actual: draw.numbers,
    special: draw.special ?? null,
    pick: g.pick,
    windows,
    best: entries[0],
    entries,
    aiHits,
    randomHits: +(randTotal / seeds).toFixed(1),
  };
}

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
