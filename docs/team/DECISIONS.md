# DECISIONS

## 2026-11-01 — 停掉樂透站，封存，網域保留

**決定**：樂透站停止服務。正式站只部署 `server/src/archive.ts`（一頁說明），金流（藍新）、LINE 登入、AI 故事、後台、每日排程全部停用。程式、素材、D1 資料庫都保留，完整版在 tag `final-live`。網域 808888.tw 保留，之後做其他網站。

**為什麼**：RC 判斷電腦算牌沒有意義，樂透每期獨立隨機，統計與 AI 選號不會比亂選更準；娛樂化的故事抓牌試玩後也不夠好玩。網域很吉利又已付費，所以留著。

**部署方式變更**：2026-08-31 那條「`gh workflow run daily-update.yml`」已作廢。現在只有 `gh workflow run archive-deploy.yml`（只部署封存頁並清密鑰）。要復活完整功能時，從 `final-live` 還原 `server/wrangler.toml` 與 `daily-update.yml`，並重新設定藍新與 GH_PAT 密鑰。

**殘餘風險**：D1 裡仍有 LINE 登入會員的資料（LINE user id、暱稱），封存頁有提供來信刪除的管道。如果確定不復活，建議之後把會員資料刪掉。

## 2026-08-31 — 部署方式：push 後手動觸發 GitHub Actions，不修本機 wrangler 認證

**決定**：這個專案 push 到 `main` 不會自動部署，正式的部署只有兩個管道：
1. `.github/workflows/daily-update.yml` 的排程（每日 23:00 台灣時間）
2. 手動觸發同一支 workflow：`gh workflow run daily-update.yml`

需要立即上線的改動，一律用第 2 種方式觸發，不要嘗試在本機直接 `cd server && wrangler deploy`。

**為什麼**：2026-08-31 實測本機環境變數 `CLOUDFLARE_API_TOKEN` 對 `wrangler deploy` 回傳 `Authentication error [code: 10000]`，`wrangler whoami` 也抓不到 account ID，判斷是這支 token 已失效或權限不足。GitHub Actions 用的是存在 repo secrets 裡的另一支 `CLOUDFLARE_API_TOKEN`，實測有效（workflow run 33408368762 成功部署）。與其去猜本機 token 哪裡壞掉，直接借用已經驗證有效的 CI 管道更快、更不會出錯。

**殘餘風險**：`gh workflow run daily-update.yml` 會連帶重跑「抓最新開獎資料」與「重新產生精選」的步驟，不是單純的「只重新部署現有 build」。目前資料每天都會更新，重跑沒有副作用，但如果之後這支 workflow 加了會有副作用的步驟，要重新評估這個做法是否還適用。

**待辦**：本機 `CLOUDFLARE_API_TOKEN` 失效問題還沒修，只是繞過而已。RC 之後要本機直接部署（不透過 GitHub Actions）時，需要先去 Cloudflare 後台重產一支新的 API Token 並更新本機環境變數。
