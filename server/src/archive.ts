// 封存模式的 Worker 入口（2026-11 起）。樂透抓牌服務已停止，整個網域只回一頁停止服務說明。
// 完整功能的最後版本在 git tag `final-live`，原本的入口是 src/worker.ts，程式與素材都保留在 repo。
// 圖示檔放在 archive-assets/，由 Cloudflare 靜態資源直接回應，不會進到這裡。

const PAGE = `<!doctype html>
<html lang="zh-Hant-TW">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>808888.tw</title>
<link rel="icon" href="/favicon.ico">
<link rel="apple-touch-icon" href="/apple-icon.png">
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
    padding: 24px 16px; background: #1a0f0f; color: #f3e9d2;
    font-family: system-ui, -apple-system, "PingFang TC", "Noto Sans TC", "Microsoft JhengHei", sans-serif;
  }
  main { max-width: 420px; text-align: center; }
  img { width: 72px; height: 72px; border-radius: 16px; }
  h1 { margin: 20px 0 12px; font-size: 28px; letter-spacing: 2px; color: #e8c170; }
  p { margin: 0 0 12px; line-height: 1.8; font-size: 16px; color: #d9cdb4; }
  .small { margin-top: 28px; font-size: 13px; color: #9c8f78; }
  a { color: #e8c170; }
</style>
</head>
<body>
<main>
  <img src="/icon.png" alt="">
  <h1>808888.tw</h1>
  <p>樂透抓牌服務已經停止，謝謝這段時間來玩的每一位朋友。</p>
  <p>網站之後會換成新的內容，有機會再見。</p>
  <p class="small">如果你曾用 LINE 登入，想刪除留在本站的會員資料，請來信 <a href="mailto:ren.studio.dev@gmail.com">ren.studio.dev@gmail.com</a>。</p>
</main>
</body>
</html>`;

const HTML_HEADERS = {
  "content-type": "text/html; charset=utf-8",
  "cache-control": "public, max-age=3600",
};

export default {
  async fetch(req: Request): Promise<Response> {
    const { pathname } = new URL(req.url);
    if (pathname === "/robots.txt") {
      return new Response("User-agent: *\nAllow: /\n", { headers: { "content-type": "text/plain; charset=utf-8" } });
    }
    // 首頁回 200，其他舊網址一律 404 加同一頁說明，讓搜尋引擎慢慢把舊的樂透頁面移除
    return new Response(PAGE, { status: pathname === "/" ? 200 : 404, headers: HTML_HEADERS });
  },
};
