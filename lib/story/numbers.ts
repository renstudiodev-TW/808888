// 故事抓牌的號碼換算：純函式，不依賴任何執行環境（前端與 Worker 共用）。
// 原則：號碼是用答案「算」出來的，同樣的輸入加同一天一定得到同樣的結果。
import type { PickedNumber, Question, StoryGame } from "./types";
import { STORY_GAMES } from "./games";

/** 已驗證過的單題答案：題目定義取自題庫，value 是清理後的值 */
export interface NumberInput {
  question: Question;
  value: string;
}

export interface StoryNumbers {
  numbers: PickedNumber[]; // 第一區，依號碼由小到大
  second?: PickedNumber; // 只有威力彩
}

const FILL_SOURCE = "綜合你的答案推算";

/** cyrb53：字串轉 53 位元雜湊（整數），可帶種子 */
export function cyrb53(str: string, seed = 0): number {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

/** mulberry32：可重現的亂數產生器，回傳 [0,1) */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 文字題正規化：全形轉半形（NFKC）、去頭尾空白、英文轉小寫 */
export function normalizeText(s: string): string {
  return s.normalize("NFKC").trim().toLowerCase();
}

/** 把任意整數換算進 1～pool（n = 0 對應 pool） */
function wrapToPool(n: number, pool: number): number {
  return ((((n - 1) % pool) + pool) % pool) + 1;
}

function shortName(q: Question): string {
  return q.short || q.label.replace(/[？?：:\s]+$/u, "");
}

/** 中文單位前面補空格（12 則），% 這類符號直接黏著 */
function unitSuffix(unit?: string): string {
  if (!unit) return "";
  return /^[一-鿿]/.test(unit) ? ` ${unit}` : unit;
}

function sourceOf(q: Question, value: string): string {
  const name = shortName(q);
  return q.kind === "number" ? `${name} ${value}${unitSuffix(q.unit)}` : `${name} ${value}`;
}

/** 單題答案換算成 1～pool 的候選號碼（尚未處理撞號） */
function candidate(a: NumberInput, pool: number, date: string): number {
  const { question: q, value } = a;
  if (q.kind === "number") return wrapToPool(Number(value), pool);
  if (q.kind === "choice") return (cyrb53(`${q.id}:${value}`) % pool) + 1; // 不混日期：同選項永遠同號
  return (cyrb53(`${q.id}:${normalizeText(value)}:${date}`) % pool) + 1; // 混日期：隔天會變
}

/** 撞到已選的就 +1 往後找，超過 pool 繞回 1 */
function nextFree(n: number, pool: number, taken: Set<number>): number {
  let x = n;
  while (taken.has(x)) x = x === pool ? 1 : x + 1;
  return x;
}

export function computeStoryNumbers(game: StoryGame, answers: NumberInput[], date: string): StoryNumbers {
  const spec = STORY_GAMES[game];
  const taken = new Set<number>();
  const picked: PickedNumber[] = [];

  for (const a of answers) {
    if (picked.length >= spec.pick) break;
    const n = nextFree(candidate(a, spec.pool, date), spec.pool, taken);
    taken.add(n);
    picked.push({ n, source: sourceOf(a.question, a.value) });
  }

  // 題目給的號碼不夠，用「全部答案 + 日期」當種子補齊
  if (picked.length < spec.pick) {
    const seedStr = [game, date, ...answers.map((a) => `${a.question.id}=${a.question.kind === "text" ? normalizeText(a.value) : a.value}`).sort()].join("|");
    const rng = mulberry32(cyrb53(seedStr) >>> 0);
    while (picked.length < spec.pick) {
      const n = nextFree(Math.floor(rng() * spec.pool) + 1, spec.pool, taken);
      taken.add(n);
      picked.push({ n, source: FILL_SOURCE });
    }
  }

  picked.sort((x, y) => x.n - y.n);

  let second: PickedNumber | undefined;
  if (spec.second && answers.length > 0) {
    const first = answers[0];
    const pool = spec.second.pool;
    const n = first.question.kind === "number" ? wrapToPool(Number(first.value), pool) : candidate(first, pool, date);
    second = { n, source: sourceOf(first.question, first.value) };
  }
  return { numbers: picked, second };
}
