# DECISIONS

## 2026-08-31 — 部署方式：push 後手動觸發 GitHub Actions，不修本機 wrangler 認證

**決定**：這個專案 push 到 `main` 不會自動部署，正式的部署只有兩個管道：
1. `.github/workflows/daily-update.yml` 的排程（每日 23:00 台灣時間）
2. 手動觸發同一支 workflow：`gh workflow run daily-update.yml`

需要立即上線的改動，一律用第 2 種方式觸發，不要嘗試在本機直接 `cd server && wrangler deploy`。

**為什麼**：2026-08-31 實測本機環境變數 `CLOUDFLARE_API_TOKEN` 對 `wrangler deploy` 回傳 `Authentication error [code: 10000]`，`wrangler whoami` 也抓不到 account ID，判斷是這支 token 已失效或權限不足。GitHub Actions 用的是存在 repo secrets 裡的另一支 `CLOUDFLARE_API_TOKEN`，實測有效（workflow run 33408368762 成功部署）。與其去猜本機 token 哪裡壞掉，直接借用已經驗證有效的 CI 管道更快、更不會出錯。

**殘餘風險**：`gh workflow run daily-update.yml` 會連帶重跑「抓最新開獎資料」與「重新產生精選」的步驟，不是單純的「只重新部署現有 build」。目前資料每天都會更新，重跑沒有副作用，但如果之後這支 workflow 加了會有副作用的步驟，要重新評估這個做法是否還適用。

**待辦**：本機 `CLOUDFLARE_API_TOKEN` 失效問題還沒修，只是繞過而已。RC 之後要本機直接部署（不透過 GitHub Actions）時，需要先去 Cloudflare 後台重產一支新的 API Token 並更新本機環境變數。
