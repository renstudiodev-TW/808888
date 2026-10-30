// 故事抓牌：答案驗證與 AI 輸出檢查。純函式，前端與 Worker 共用。
import type { StoryGame } from "./types";
import { STORY_GAME_ORDER } from "./games";
import { getQuestionById } from "./questions";
import type { NumberInput } from "./numbers";

// ───────── 答案驗證 ─────────

export type ValidateResult =
  | { ok: true; game: StoryGame; answers: NumberInput[] }
  | { ok: false; code: "bad_request" | "invalid_answer"; message: string };

const MIN_ANSWERS = 3;
const MAX_ANSWERS = 4;
const TEXT_MAX = 20;

// 精簡的不當字詞清單（髒話、自殘、毒品、暴力）。比對前會轉小寫。
const BAD_WORDS = [
  "幹你", "幹妳", "幹您", "幹死", "操你", "操妳", "肏", "他媽", "媽的", "靠北", "靠腰", "三小",
  "機掰", "雞掰", "雞巴", "賤人", "婊子", "去死", "自殺", "自殘", "輕生", "殺人", "強姦",
  "毒品", "吸毒", "海洛因", "安非他命", "冰毒", "古柯鹼", "大麻",
  "fuck", "shit", "bitch", "suicide",
];

const URL_PATTERN = /https?:|ftp:|:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|tw|cc|io|co|me|app|xyz|info|top|link)\b/i;

// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001f\u007f-\u009f]/g;

function bad(message: string): ValidateResult {
  return { ok: false, code: "invalid_answer", message };
}

/** 清理文字題：去控制字元（換行、tab 等一併去掉）後去頭尾空白 */
export function cleanText(s: string): string {
  return s.replace(CONTROL_CHARS, "").trim();
}

function hasBadWord(s: string): boolean {
  const t = s.normalize("NFKC").toLowerCase().replace(/\s+/g, "");
  return BAD_WORDS.some((w) => t.includes(w));
}

/**
 * 驗證前端送來的請求 body。題目文字一律以題庫為準，只取 questionId 與 value。
 * 格式不對（不是物件、answers 不是陣列、欄位型別錯）回 bad_request；內容不合規則回 invalid_answer。
 */
export function validateStoryRequest(body: unknown): ValidateResult {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, code: "bad_request", message: "請求格式不正確，請重新整理頁面再試一次。" };
  }
  const b = body as Record<string, unknown>;
  if (!Array.isArray(b.answers)) {
    return { ok: false, code: "bad_request", message: "請求格式不正確，請重新整理頁面再試一次。" };
  }
  for (const a of b.answers) {
    if (!a || typeof a !== "object" || typeof (a as Record<string, unknown>).questionId !== "string" || typeof (a as Record<string, unknown>).value !== "string") {
      return { ok: false, code: "bad_request", message: "答案格式不正確，請重新整理頁面再試一次。" };
    }
  }

  if (typeof b.game !== "string" || !(STORY_GAME_ORDER as string[]).includes(b.game)) {
    return bad("請先選擇彩券種類（今彩539、大樂透或威力彩）。");
  }
  const game = b.game as StoryGame;

  const raw = b.answers as { questionId: string; value: string }[];
  if (raw.length < MIN_ANSWERS || raw.length > MAX_ANSWERS) {
    return bad(`請回答 ${MIN_ANSWERS} 到 ${MAX_ANSWERS} 題再送出。`);
  }

  const seen = new Set<string>();
  const answers: NumberInput[] = [];
  for (let i = 0; i < raw.length; i++) {
    const { questionId, value } = raw[i];
    const q = getQuestionById(questionId);
    if (!q) return bad(`第 ${i + 1} 題的題目已經不存在，請按「換一批題目」重新作答。`);
    if (seen.has(questionId)) return bad(`第 ${i + 1} 題和前面的題目重複了，請重新整理題目再作答。`);
    seen.add(questionId);

    if (q.kind === "number") {
      const v = value.trim();
      if (!/^-?\d+$/.test(v)) return bad(`第 ${i + 1} 題「${q.label}」請填整數，例如 7，不要填小數或文字。`);
      const n = Number(v);
      if (!Number.isSafeInteger(n) || (q.min !== undefined && n < q.min) || (q.max !== undefined && n > q.max)) {
        return bad(`第 ${i + 1} 題「${q.label}」請填 ${q.min ?? "任意"} 到 ${q.max ?? "任意"} 之間的整數。`);
      }
      answers.push({ question: q, value: String(n) });
    } else if (q.kind === "choice") {
      const v = value.trim();
      if (!q.options?.includes(v)) return bad(`第 ${i + 1} 題「${q.label}」請從選項中挑一個。`);
      answers.push({ question: q, value: v });
    } else {
      const v = cleanText(value);
      const len = [...v].length;
      if (len < 1) return bad(`第 ${i + 1} 題「${q.label}」還沒有填，請寫 1 到 ${TEXT_MAX} 個字。`);
      if (len > TEXT_MAX) return bad(`第 ${i + 1} 題「${q.label}」太長了（${len} 字），請縮短到 ${TEXT_MAX} 個字以內。`);
      if (URL_PATTERN.test(v)) return bad(`第 ${i + 1} 題「${q.label}」請不要填網址，換成一般的文字就好。`);
      if (hasBadWord(v)) return bad(`第 ${i + 1} 題「${q.label}」含有不適合的字詞，請換個說法。`);
      answers.push({ question: q, value: v });
    }
  }
  return { ok: true, game, answers };
}

// ───────── AI 輸出檢查 ─────────

export const STORY_MAX_LENGTH = 150;

const FORBIDDEN_PHRASES = ["必中", "保證", "穩贏", "破解", "明牌"];

// 常見簡體專用字（繁體寫法不同的字）。命中任一個就視為簡體輸出。
const SIMPLIFIED_CHARS = new Set(
  [
    ...("这们个来时会说对为发现钱号码运气门见车东过还没头样让给钟点实学国开关长电话书写问题经网认进动应觉听错热爱单业买卖边远选达带师总结织红级纪约统绝继续维线练细终组绍脑体务产亲观规设计论识语误请该详读调谈谢财赚赢输购贵费贴资赛赞赠赶跃踪轻较载辆迟遗邮郑际阳阴阵队阶陆险随难雾韩顺须预频颜风飞饭饮馆驾验骗鱼鸟鸡麦齐龄龙"),
    ...("爷妈亿仅从仓价众优伤伦传侠侣债倾偿儿兰养冲决冻净减凤击刘则刚创办务劝励势区医华协单卫厂厅压县参双变叙叹启吗吨听启员响哑园围图坏坚块场坛垫埃墙增壮声壳处备复够夹夺奋奖妇姗娱嫌孙宁宝实审宪宫宽导将尔层属岁岗峡币帅帐师库应庙废异弯弹强归当录彻悬惊惯愿战拥择挂挡挥损摇摆摄敌数断旧显晓晕暂术杀杂权条极构样桥梦检楼欢欧毕气汉汤沟沧泽洁济浓涛润涨渐渔湾温灭灯灵灾炉烟烦烧热爱爷牺犹狮独狭猎猪献玛环现琐电画畅疗疯监盖盘睁矿码础确离秘积称稳窃竞笔笼筑签简类粮紧纠红纤纪纯纲纳纸纹线练组细织终绍经结绕绘给络绝统继绩绪续维综缓编缘缩网罗罚职联聪肃肠胜脏脚脸腊艰艺节芦苏苹茧药荐荣获莲萝营蓝虑虽补装裤见观览规视览觉誉计订认讨让训议记讲许论设访证评识诉诊词译试诗该详语误说请诸读课谁调谈谊谋谓谢谱贝贞负贡财责贤败账货质贩贪购贯贵贷贸费贺贼资赋赌赏赔赖赘赛赞赠赵趋跃踪车轨轮软轰轻载轿较辅辈辉输辞边辽达迁过运还进远连迟适选逊递逻遗邓邮邻释针钉钓钢钥钦钱钻铁铃铜银铺链销锁锅锋锐错键锡锦闭问闯间闷闹闻阅队阳阴阵阶际陆陈险随隐难雏雾静顶项顺须顾顿颁颂预领颇频颗题颜额风飘飞饥饭饮饰饱馆驱驶驻驾骂验骑骗鱼鲜鸟鸡鸭鸿鹅鹤麦黄齐齿龄龙龟"),
  ].filter((c) => c.trim() !== ""),
);

export interface CheckResult {
  ok: boolean;
  reason?: string;
}

/** 號碼是否以獨立的阿拉伯數字出現（前後不能接其他數字；個位數可寫成 7 或 07） */
function hasStandaloneNumber(text: string, n: number): boolean {
  const body = n < 10 ? `0?${n}` : String(n);
  return new RegExp(`(?<!\\d)${body}(?!\\d)`).test(text);
}

/**
 * 檢查故事文字（AI 產出與範本共用同一套）。
 * numbers 是第一區要出現的全部號碼，second 是威力彩第二區號碼。
 */
export function checkStoryOutput(text: string, numbers: number[], second?: number): CheckResult {
  const t = text.trim();
  if (!t) return { ok: false, reason: "內容是空的" };
  if ([...t].length > STORY_MAX_LENGTH) return { ok: false, reason: `超過 ${STORY_MAX_LENGTH} 字` };
  for (const n of numbers) {
    if (!hasStandaloneNumber(t, n)) return { ok: false, reason: `缺少號碼 ${n}` };
  }
  if (second !== undefined && !hasStandaloneNumber(t, second)) return { ok: false, reason: `缺少第二區號碼 ${second}` };
  for (const w of FORBIDDEN_PHRASES) {
    if (t.includes(w)) return { ok: false, reason: `含有不可使用的詞「${w}」` };
  }
  for (const ch of t) {
    if (SIMPLIFIED_CHARS.has(ch)) return { ok: false, reason: `含有簡體字「${ch}」` };
  }
  if (t.includes("—")) return { ok: false, reason: "含有破折號" };
  return { ok: true };
}
