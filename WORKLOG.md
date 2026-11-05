# WORKLOG

## 2026-11-01

### 做了什麼
- 10/30～10/31 做了「故事抓牌」並上線：首頁改成選彩種、回答隨機題目，用 Workers AI 寫一段含號碼的短故事（號碼由程式算，不交給 AI）。統計工具移到 `/analysis`。資安修補也上線了，包括呼叫 AI 前先扣次數、檢查來源網站、輸入輸出過濾。
- RC 試玩後覺得無聊，擬了「冒險版」計畫（6 幕互動加擲筊開籤），後來沒有執行。
- 11/01 RC 決定停掉樂透站，封存：
  - 正式站 Worker 入口改成 `server/src/archive.ts`：首頁回一頁停止服務說明（200、noindex），其他路徑回 404，圖示檔放 `server/archive-assets/`。
  - `server/wrangler.toml` 拿掉 D1、AI binding，`crons = []` 清掉排程。
  - `.github/workflows/daily-update.yml` 改成只能手動觸發的 `archive-deploy.yml`，部署後刪掉 Worker 上的 `NEWEBPAY_*` 與 `GH_PAT` 密鑰（run 41311032696 成功）。
  - 封存前的完整版本打 tag `final-live` 並推上去。README 最上面加封存說明。
  - 正式站驗證：`/` 200，`/pricing/`、`/api/pay/checkout`、`/api/pay/newebpay/notify`、`/api/story`、`/admin` 全部 404。
  - 官網 renstudio.tw 作品集移除「賽博財神爺」：main 是 99d9ea4（已上正式站並驗證），草稿分支 `site-copy-pwa` 是 ece48ff（連同截圖一起刪）。
- Vault 專案登記簿把「樂透張」改成已封存。

### 決策
- 停掉樂透站，網域 808888.tw 保留另做他用。見 DECISIONS.md。

### 未完成
- RC 端：藍新後台確認沒有進行中的定期定額委託並決定商店是否停用；GitHub 撤銷原本給 Cron 用的 PAT；CloudMax 確認 808888.tw 到期日並續約；LINE Login／Messaging 頻道可留可刪。
- 本機資料夾還在 `case/808888`，照結案 SOP 要移到 `archive/paused/`（搬移會讓正在用的 session 路徑失效，所以收工後再搬）。

### 卡點
- 無。本機 `CLOUDFLARE_API_TOKEN` 仍然失效，但封存後只剩手動 workflow，不影響。

### 下一步
- RC 想好 808888.tw 要做什麼新站再開新計畫。之前發想過的方向：發票＋樂透對獎中心、尾牙活動抽獎工具、線上拜拜求籤。

## 2026-08-31

### 做了什麼
- 首頁「今日精選」區塊原本只有今彩539，大樂透雖已是上線彩種（`SHIPPING_GAMES` 內）卻沒有對應卡片，使用者反應首頁看不到大樂透 AI 選號。在 `app/page.tsx` 補上跟 539 一致的「今日精選・大樂透」區塊（`PremiumPicks` + `LockedPicks` + `FreePicks`），位置在 539 精選之後、彩種卡片之前。
- `npm run build` 確認編譯與 TS 型別通過，`check-simplified.py` 掃描無簡體字。
- commit + push 到 `main`（push 前遠端已有每日自動資料更新的 commit，用 `git pull --rebase` 接上）。
- 本機 `wrangler deploy` 失敗（`CLOUDFLARE_API_TOKEN` 認證錯誤 code 10000，帳號 ID 也抓不到），改用 `gh workflow run daily-update.yml` 觸發 GitHub Actions 走原本的 build + `wrangler deploy` 流程，跑完 status=success。
- 用 Claude in Chrome 開 https://808888.tw 抓頁面文字，確認正式站首頁已出現「今日精選・大樂透」區塊，功能上線驗證完成。

### 決策
- 部署走「push 完手動觸發 GitHub Actions（`gh workflow run daily-update.yml`）」而不是修本機 wrangler 認證，因為 CI 的 secrets 是對的、本機 token 已失效。見 DECISIONS.md。

### 未完成
- 無。

### 卡點
- 本機 `CLOUDFLARE_API_TOKEN`（環境變數）對 `wrangler deploy` 認證失敗，需要 RC 之後找時間重產一支新的 token 並更新本機環境變數，不然下次要本機直接 deploy（不透過 GitHub Actions）會卡在同一個地方。

### 下一步
- 若本機 wrangler 部署要能用，先處理 `CLOUDFLARE_API_TOKEN` 失效問題。
- 平常功能改動走「push → `gh workflow run daily-update.yml`」即可，不用等每日 cron。
