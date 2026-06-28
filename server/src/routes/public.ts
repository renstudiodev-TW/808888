// 公開 API（免登入）：最新開獎號碼 + 樂透新聞。皆走 Cloudflare 邊緣快取，省外部請求。
import { Hono } from "hono";

export const publicApi = new Hono();

// ── 最新開獎（台彩官方 API）──
const TL_BASE = "https://api.taiwanlottery.com/TLCAPIWeB/Lottery";

interface GameMeta {
  id: string;
  name: string;
  pick: number;
  apiPath: string;
  resKey: string;
  special?: "lotto649" | "super638";
}
const DRAW_GAMES: GameMeta[] = [
  { id: "daily539", name: "今彩539", pick: 5, apiPath: "Daily539Result", resKey: "daily539Res" },
  { id: "lotto649", name: "大樂透", pick: 6, apiPath: "Lotto649Result", resKey: "lotto649Res", special: "lotto649" },
  { id: "superLotto638", name: "威力彩", pick: 6, apiPath: "SuperLotto638Result", resKey: "superLotto638Res", special: "super638" },
];

// 邊緣快取的 fetch（30 分鐘）。帶瀏覽器 UA，避免來源擋 datacenter 請求。
function cachedFetch(url: string, ttl = 1800): Promise<Response> {
  return fetch(url, {
    cf: { cacheTtl: ttl, cacheEverything: true },
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      Accept: "application/json, text/xml, application/rss+xml, */*",
    },
  } as RequestInit);
}

interface RawDraw {
  period?: number | string;
  lotteryDate?: string;
  drawNumberSize?: number[];
  [k: string]: unknown;
}

async function fetchMonth(g: GameMeta, ym: string): Promise<RawDraw[]> {
  const url = `${TL_BASE}/${g.apiPath}?month=${ym}&pageSize=50`;
  const res = await cachedFetch(url);
  if (!res.ok) return [];
  const json = (await res.json()) as { rtCode: number; content?: Record<string, unknown> };
  if (json.rtCode !== 0 || !json.content) return [];
  return (json.content[g.resKey] as RawDraw[] | undefined) ?? [];
}

function ymOf(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

async function latestDraw(g: GameMeta, now: Date) {
  // 先抓當月，沒有就抓上個月（月初時當月可能還沒開獎）
  let rows = await fetchMonth(g, ymOf(now));
  if (rows.length === 0) {
    const prev = new Date(now);
    prev.setUTCMonth(prev.getUTCMonth() - 1);
    rows = await fetchMonth(g, ymOf(prev));
  }
  if (rows.length === 0) return null;
  // 取 period 最大者
  const latest = rows.reduce((a, b) => (String(b.period ?? "") > String(a.period ?? "") ? b : a));
  let numbers = [...((latest.drawNumberSize as number[] | undefined) ?? [])].sort((a, b) => a - b);
  let special: number | undefined;
  if (g.special === "lotto649") {
    const sp = (latest.lotto649SpecialNumber ?? latest.specialNumber) as number | undefined;
    if (typeof sp === "number") special = sp;
    else if (numbers.length === g.pick + 1) { special = numbers[numbers.length - 1]; numbers = numbers.slice(0, g.pick); }
  } else if (g.special === "super638") {
    const sp = (latest.superLotto638SecondArea ?? latest.secondAreaNumber) as number | undefined;
    if (typeof sp === "number") special = sp;
    else if (numbers.length === g.pick + 1) { special = numbers[numbers.length - 1]; numbers = numbers.slice(0, g.pick); }
  }
  if (!latest.period || numbers.length === 0) return null;
  return {
    game: g.id,
    name: g.name,
    period: String(latest.period),
    date: (latest.lotteryDate ?? "").slice(0, 10),
    numbers,
    special,
  };
}

publicApi.get("/api/draws", async (c) => {
  const now = new Date();
  const results = await Promise.all(
    DRAW_GAMES.map((g) => latestDraw(g, now).catch(() => null))
  );
  return c.json({ draws: results.filter(Boolean), updatedAt: now.toISOString() });
});

// ── 樂透新聞（Google News RSS）──
function decodeEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
}

function parseRss(xml: string, max = 10) {
  const items: Array<{ title: string; link: string; date: string; source: string }> = [];
  const blocks = xml.split(/<item>/i).slice(1);
  for (const b of blocks.slice(0, max)) {
    const title = decodeEntities((b.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? "").trim());
    let link = (b.match(/<link>([\s\S]*?)<\/link>/i)?.[1] ?? "").trim();
    if (!link) link = (b.match(/<link[^>]*href="([^"]+)"/i)?.[1] ?? "").trim();
    const date = (b.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1] ?? "").trim();
    const source = decodeEntities((b.match(/<source[^>]*>([\s\S]*?)<\/source>/i)?.[1] ?? "").trim());
    if (title && link) items.push({ title, link, date, source });
  }
  return items;
}

publicApi.get("/api/news", async (c) => {
  const q = "樂透 威力彩 大樂透 今彩539";
  // 多來源 fallback：Bing News RSS 對 Worker 較友善，Google News 常擋 datacenter IP。
  const sources = [
    `https://www.bing.com/news/search?q=${encodeURIComponent(q)}&format=RSS&setlang=zh-TW&cc=TW`,
    `https://news.google.com/rss/search?q=${encodeURIComponent("樂透 OR 威力彩 OR 大樂透")}&hl=zh-TW&gl=TW&ceid=TW:zh-Hant`,
  ];
  let lastErr = "";
  for (const url of sources) {
    try {
      const res = await cachedFetch(url, 1800);
      if (!res.ok) { lastErr = `${new URL(url).host} ${res.status}`; continue; }
      const items = parseRss(await res.text());
      if (items.length) return c.json({ news: items });
      lastErr = `${new URL(url).host} empty`;
    } catch (e) {
      lastErr = (e as Error).message;
    }
  }
  return c.json({ news: [], error: lastErr });
});
