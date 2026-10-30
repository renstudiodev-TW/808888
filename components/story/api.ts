// 故事抓牌 API 呼叫。後端是 POST /api/story（Worker），格式見 lib/story/types.ts。
import { STORY_GAMES } from "@/lib/story/games";
import { getQuestionById } from "@/lib/story/questions";
import type { StoryErrorCode, StoryRequest, StoryResult } from "@/lib/story/types";

const TIMEOUT_MS = 15000;

export class StoryApiError extends Error {
  code: StoryErrorCode | "network" | "timeout";
  status: number;
  constructor(code: StoryApiError["code"], message: string, status = 0) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export async function requestStory(req: StoryRequest): Promise<StoryResult> {
  // 本機開發時後端不在 Next dev server 上，開關打開就回假資料（只在 NEXT_PUBLIC_STORY_MOCK=1 時生效）
  if (process.env.NEXT_PUBLIC_STORY_MOCK === "1") return mockStory(req);

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch("/api/story", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(req),
      signal: ctrl.signal,
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new StoryApiError("timeout", "老師傅想太久了，等了 15 秒沒有回音，請再試一次。");
    }
    throw new StoryApiError("network", "網路好像不太穩，連不上老師傅，請檢查網路後再試一次。");
  } finally {
    clearTimeout(timer);
  }

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // 回的不是 JSON，下面統一處理
  }

  if (!res.ok) {
    const d = data as { error?: StoryErrorCode; message?: string } | null;
    const code: StoryErrorCode = d?.error ?? (res.status >= 500 ? "server_error" : "bad_request");
    throw new StoryApiError(code, d?.message || "老師傅這邊出了點狀況，請稍後再試一次。", res.status);
  }
  const ok = data as StoryResult | null;
  if (!ok || !Array.isArray(ok.numbers) || typeof ok.story !== "string") {
    throw new StoryApiError("server_error", "老師傅回的內容怪怪的，請再試一次。", res.status);
  }
  return ok;
}

// ---- 以下是本機假資料，只在 mock 開關打開時使用 ----

function pickDistinct(count: number, pool: number): number[] {
  const set = new Set<number>();
  while (set.size < count) set.add(1 + Math.floor(Math.random() * pool));
  return [...set].sort((a, b) => a - b);
}

async function mockStory(req: StoryRequest): Promise<StoryResult> {
  await new Promise((r) => setTimeout(r, 400));
  const spec = STORY_GAMES[req.game];
  const nums = pickDistinct(spec.pick, spec.pool);
  const sources = req.answers.map((a) => {
    const q = getQuestionById(a.questionId);
    return `${q?.label.replace(/[？?].*$/, "") ?? "你的答案"} ${a.value}`.slice(0, 16);
  });
  const numbers = nums.map((n, i) => ({ n, source: sources[i] ?? "綜合你的答案推算" }));
  const second = spec.second
    ? { n: pickDistinct(1, spec.second.pool)[0], source: sources[0] ?? "綜合你的答案推算" }
    : undefined;
  const first = req.answers[0]?.value ?? "";
  const story =
    `早上出門前你看了一眼「${first}」，總覺得今天有點不一樣。路過 ${nums[0]} 號門牌時，` +
    `巷口的老闆笑著遞來一張紙條，上面寫著 ${nums.slice(1).join("、")}。` +
    (second ? `最後一行小字是 ${second.n}，你把它收進口袋。` : "你把紙條收進口袋，心想今天也許真的有好事。") +
    "（這是本機測試用的假故事）";
  const date = new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);
  return { game: req.game, date, numbers, second, story, storySource: "ai", remaining: 2 };
}
