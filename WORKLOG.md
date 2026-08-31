# WORKLOG

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
