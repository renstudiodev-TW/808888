// 故事抓牌題庫。目前是骨架與少量範例題，完整題庫（約 40 題）由前端分身補齊。
// Worker 依 id 回查這份題庫驗證答案，所以 id 一旦上線就不要改。
import type { Question } from "./types";

export const QUESTIONS: Question[] = [
  { id: "battery", kind: "number", label: "手機電量剩幾 %？", min: 0, max: 100, unit: "%" },
  { id: "age", kind: "number", label: "你今年幾歲？", min: 18, max: 120, unit: "歲" },
  {
    id: "zodiacSign",
    kind: "choice",
    label: "你的星座是？",
    options: ["牡羊座", "金牛座", "雙子座", "巨蟹座", "獅子座", "處女座", "天秤座", "天蠍座", "射手座", "摩羯座", "水瓶座", "雙魚座"],
  },
  { id: "firstSight", kind: "text", label: "今天出門看到的第一個東西是？", placeholder: "例如：黑貓、紅色機車" },
];

export function getQuestionById(id: string): Question | undefined {
  return QUESTIONS.find((q) => q.id === id);
}

/** 隨機抽一組題目（3～4 題，三種類型都要有）。前端呼叫，每次進站或按「換一批題目」都重抽。 */
export function drawQuestions(count = 3): Question[] {
  const pool = [...QUESTIONS].sort(() => Math.random() - 0.5);
  return pool.slice(0, Math.min(count, pool.length));
}
