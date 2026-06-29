// 抓牌指標：每個函式皆為純函式，輸入歷史開獎，輸出統計數值。
// 免責：僅將玩家手算自動化，無法提高中獎率、不保證中獎。

import type { Draw, GameConfig, History } from "./types";
import {
  acValue, combination, isPrime, maxRun, mean, sum,
  tailOf, zoneOf, zodiacOf,
} from "./util";

/** 出現布林矩陣 presence[drawIndex][number] (number 1..pool) */
export function buildPresence(history: History, pool: number): boolean[][] {
  return history.map((d) => {
    const row = new Array<boolean>(pool + 1).fill(false);
    for (const n of d.numbers) if (n >= 1 && n <= pool) row[n] = true;
    return row;
  });
}

/** 取最近 W 期 */
export function windowSlice(history: History, w: number): History {
  return w > 0 && w < history.length ? history.slice(history.length - w) : history;
}

export interface HotColdItem {
  n: number;
  freq: number;
  expected: number;
  z: number;
  tag: "hot" | "cold" | "normal";
}

/** 1. 冷熱號 (窗 W 期，z-score 判定) */
export function hotCold(history: History, g: GameConfig, w = 30): HotColdItem[] {
  const win = windowSlice(history, w);
  const W = win.length;
  const p = g.pick / g.pool;
  const E = W * p;
  const sd = Math.sqrt(W * p * (1 - p)) || 1;
  const freq = new Array<number>(g.pool + 1).fill(0);
  for (const d of win) for (const n of d.numbers) freq[n]++;
  const items: HotColdItem[] = [];
  for (let n = 1; n <= g.pool; n++) {
    const z = (freq[n] - E) / sd;
    items.push({
      n,
      freq: freq[n],
      expected: +E.toFixed(2),
      z: +z.toFixed(2),
      tag: z > 1 ? "hot" : z < -1 ? "cold" : "normal",
    });
  }
  return items;
}

export interface OmissionItem {
  n: number;
  currentMiss: number;
  avgMiss: number;
  maxMiss: number;
  ratio: number; // current / avg
}

/** 2. 遺漏值 (當前/平均/最大遺漏) */
export function omission(history: History, g: GameConfig): OmissionItem[] {
  const total = history.length;
  const items: OmissionItem[] = [];
  for (let n = 1; n <= g.pool; n++) {
    // 找出每次出現的 index
    const appears: number[] = [];
    for (let i = 0; i < total; i++) {
      if (history[i].numbers.includes(n)) appears.push(i);
    }
    let currentMiss: number;
    let avgMiss: number;
    let maxMiss: number;
    if (appears.length === 0) {
      currentMiss = total;
      avgMiss = total;
      maxMiss = total;
    } else {
      currentMiss = total - 1 - appears[appears.length - 1];
      // 相鄰出現間隔
      const gaps: number[] = [];
      for (let k = 1; k < appears.length; k++) gaps.push(appears[k] - appears[k - 1]);
      avgMiss = gaps.length ? mean(gaps) : total / appears.length;
      maxMiss = Math.max(currentMiss, ...(gaps.length ? gaps : [currentMiss]));
    }
    items.push({
      n,
      currentMiss,
      avgMiss: +avgMiss.toFixed(2),
      maxMiss,
      ratio: +(currentMiss / (avgMiss || 1)).toFixed(2),
    });
  }
  return items;
}

export interface TailItem {
  tail: number;
  freq: number;
  members: number[];
  rate: number; // 正規化 freq/(成員數*W)
  tag: "hot" | "cold" | "normal";
}

/** 3. 尾數分佈 */
export function tailDistribution(history: History, g: GameConfig, w = 30): TailItem[] {
  const win = windowSlice(history, w);
  const W = win.length || 1;
  const members: number[][] = Array.from({ length: 10 }, () => []);
  for (let n = 1; n <= g.pool; n++) members[tailOf(n)].push(n);
  const freq = new Array<number>(10).fill(0);
  for (const d of win) for (const n of d.numbers) freq[tailOf(n)]++;
  const rates = freq.map((f, d) => (members[d].length ? f / (members[d].length * W) : 0));
  const avg = mean(rates.filter((_, d) => members[d].length > 0));
  return freq.map((f, d) => {
    const rate = rates[d];
    return {
      tail: d,
      freq: f,
      members: members[d],
      rate: +rate.toFixed(3),
      tag: members[d].length === 0 ? "normal" : rate > avg * 1.2 ? "hot" : rate < avg * 0.8 ? "cold" : "normal",
    };
  });
}

/** 4a. 拖牌：a 在 t 期開出後，b 在 t+1 期跟出的條件機率 */
export interface DragResult {
  a: number;
  top: { b: number; count: number; rate: number }[];
}
export function dragFor(history: History, g: GameConfig, a: number, topK = 6): DragResult {
  let aCount = 0;
  const bCount = new Array<number>(g.pool + 1).fill(0);
  for (let t = 0; t < history.length - 1; t++) {
    if (history[t].numbers.includes(a)) {
      aCount++;
      for (const b of history[t + 1].numbers) bCount[b]++;
    }
  }
  const top = [];
  for (let b = 1; b <= g.pool; b++) {
    if (b === a) continue;
    if (bCount[b] > 0) top.push({ b, count: bCount[b], rate: +(bCount[b] / (aCount || 1)).toFixed(3) });
  }
  top.sort((x, y) => y.count - x.count);
  return { a, top: top.slice(0, topK) };
}

/** 4b. 共現矩陣 (同期一起開出次數，無向)。回傳 pool x pool 上三角展平 */
export function coOccurrence(history: History, g: GameConfig): number[][] {
  const m: number[][] = Array.from({ length: g.pool + 1 }, () => new Array<number>(g.pool + 1).fill(0));
  for (const d of history) {
    const ns = d.numbers;
    for (let i = 0; i < ns.length; i++)
      for (let j = i + 1; j < ns.length; j++) {
        m[ns[i]][ns[j]]++;
        m[ns[j]][ns[i]]++;
      }
  }
  return m;
}

export interface ZodiacItem {
  zodiac: string;
  members: number[];
  freq: number;
}
/** 6. 生肖球 (依年份)，近 W 期各生肖出現次數 */
export function zodiacStats(history: History, g: GameConfig, year: number, w = 30): ZodiacItem[] {
  const win = windowSlice(history, w);
  const members: Record<string, number[]> = {};
  for (let n = 1; n <= g.pool; n++) {
    const z = zodiacOf(n, g.pool, year);
    (members[z] ??= []).push(n);
  }
  const freq: Record<string, number> = {};
  for (const d of win) for (const n of d.numbers) {
    const z = zodiacOf(n, g.pool, year);
    freq[z] = (freq[z] ?? 0) + 1;
  }
  return Object.keys(members).map((z) => ({
    zodiac: z,
    members: members[z].sort((a, b) => a - b),
    freq: freq[z] ?? 0,
  }));
}

export interface ZoneItem {
  zone: number;
  label: string;
  freq: number;
  rate: number;
  size: number;
}
/** 7. 區間冷熱 */
export function zoneStats(history: History, g: GameConfig, zoneSize = 10, w = 30): ZoneItem[] {
  const win = windowSlice(history, w);
  const W = win.length || 1;
  const zoneCount = Math.ceil(g.pool / zoneSize);
  const sizes = new Array<number>(zoneCount).fill(0);
  for (let n = 1; n <= g.pool; n++) sizes[zoneOf(n, zoneSize)]++;
  const freq = new Array<number>(zoneCount).fill(0);
  for (const d of win) for (const n of d.numbers) freq[zoneOf(n, zoneSize)]++;
  return freq.map((f, z) => {
    const lo = z * zoneSize + 1;
    const hi = Math.min((z + 1) * zoneSize, g.pool);
    return {
      zone: z,
      label: `${lo}-${hi}`,
      freq: f,
      rate: +(f / (sizes[z] * W)).toFixed(3),
      size: sizes[z],
    };
  });
}

/** 8. 單期型態指標 */
export interface PatternStat {
  period: string;
  date: string;
  odd: number;
  even: number;
  big: number;
  small: number;
  sum: number;
  ac: number;
  prime: number;
  maxRun: number;
  carryOver: number; // 連莊：與上一期重複的號碼數
}
export function patternSeries(history: History, g: GameConfig): PatternStat[] {
  const mid = Math.ceil(g.pool / 2);
  return history.map((d, i) => {
    const ns = d.numbers;
    const odd = ns.filter((n) => n % 2 === 1).length;
    const big = ns.filter((n) => n >= mid).length;
    const prime = ns.filter((n) => isPrime(n)).length;
    const prev = i > 0 ? history[i - 1].numbers : [];
    const carryOver = ns.filter((n) => prev.includes(n)).length;
    return {
      period: d.period,
      date: d.date,
      odd,
      even: ns.length - odd,
      big,
      small: ns.length - big,
      sum: sum(ns),
      ac: acValue(ns),
      prime,
      maxRun: maxRun(ns),
      carryOver,
    };
  });
}

export interface SecondAreaItem {
  n: number;
  freq: number; // 近 W 期出現次數
  currentMiss: number; // 當前遺漏期數
  rate: number; // freq / W
  tag: "hot" | "cold" | "normal";
}

/** 9. 第二區冷熱／遺漏 (威力彩第二區 1..pool 取 1，存於 special 欄位) */
export function secondAreaStats(history: History, secondPool: number, w = 50): SecondAreaItem[] {
  const win = windowSlice(history, w);
  const W = win.length || 1;
  const freq = new Array<number>(secondPool + 1).fill(0);
  for (const d of win) if (typeof d.special === "number") freq[d.special]++;
  const expected = W / secondPool; // 均勻分佈期望次數
  const items: SecondAreaItem[] = [];
  for (let n = 1; n <= secondPool; n++) {
    // 當前遺漏：從最新往回數，連續幾期沒開出 n
    let miss = 0;
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].special === n) break;
      miss++;
    }
    const f = freq[n];
    items.push({
      n,
      freq: f,
      currentMiss: miss,
      rate: +(f / W).toFixed(3),
      tag: f > expected * 1.3 ? "hot" : f < expected * 0.7 ? "cold" : "normal",
    });
  }
  return items;
}

/** 5. 連碰試算 (純數學)：碰數 C(n,r)；若命中 m 個則中 C(m,r) 組 */
export function comboCalc(pickedCount: number, star: number, betPerCombo: number, oddsPerCombo: number, hit: number) {
  const combos = combination(pickedCount, star);
  const cost = combos * betPerCombo;
  const winningCombos = combination(hit, star);
  const prize = winningCombos * oddsPerCombo;
  return { combos, cost, winningCombos, prize, net: prize - cost };
}

/** 立柱：每柱號數相乘 */
export function pillarCombos(pillars: number[]): number {
  return pillars.reduce((a, b) => a * b, 1);
}

/** 和值理論平均 */
export function expectedSum(g: GameConfig): number {
  return g.pick * (g.pool + 1) / 2;
}
