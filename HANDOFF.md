# 808888（發發發發）· 交班說明

## ⭐ 最新狀態（Phase B 完成）
- **品牌定案：808888，網域 808888.tw（+ 808888.com.tw）已在 CloudMax 購買**。前台＋後台已全面改名。
- **架構定案：一站式 Cloudflare**（單一 Worker：靜態前台＋Hono 後端＋D1＋Cron）。
- **DNS：808888.tw 註冊在 CloudMax**，要把 nameserver 從 CloudMax 預設（ns1~ns4.ix1000.com）改成 Cloudflare 給的 2 組（在 CloudMax「網域管理→技術設定→DNS 自管」頁）。待 RC 開 Cloudflare 帳號後一起做。
- **後端已改成可直接上 Cloudflare D1**：DB 層 async + AsyncLocalStorage 注入（本地 node:sqlite / 正式 D1 共用同一套碼）。`server/wrangler.toml`、`server/migrations/0001_init.sql`、`server/src/worker.ts` 都備好。本地實測全綠（後台、付費解鎖）。
- **金流商更正：藍新 NewebPay**（非綠界），已移除 ecpay、改 `newebpay.ts` placeholder，Phase D 實作。
- **卡點（需 RC）**：Cloudflare 帳號、改 NS 指向 Cloudflare、LINE Login channel 憑證、藍新憑證。

### 部署到 Cloudflare 的步驟（RC 帳號就緒後一起做）
1. Cloudflare 開帳號 → Add a site：808888.tw → 取得 2 組 Cloudflare nameserver
2. 到 CloudMax「DNS 自管」把 ns 換成那 2 組（生效 24-48h）
3. `cd server && npm i`，`wrangler login`
4. `wrangler d1 create lottery808888` → 把 database_id 填進 `wrangler.toml`
5. `wrangler d1 migrations apply lottery808888 --remote`（建表）
6. 專案根 `next build`（**不要**帶 NEXT_PUBLIC_BASE_PATH，產生根路徑 out/）
7. `wrangler secret put ADMIN_PASSWORD / SESSION_SECRET / LINE_* / NEWEBPAY_*`
8. `cd server && npm run deploy`，Cloudflare 後台把 808888.tw 綁到此 Worker

## 線上網址（前台臨時站）
**https://renstudiodev-tw.github.io/808888/**

GitHub repo（public）：https://github.com/renstudiodev-TW/808888

> 這是**臨時**部署點（GitHub Pages）。正式版規劃搬到 Cloudflare Pages + 自有網域（要你登入授權時再做，純靜態搬家零成本）。

## 今晚做了什麼
- 核心分析庫 `lib/lottery/`：冷熱號(z-score)、遺漏值、尾數、拖牌共現、生肖球、區間、和值/AC/奇偶型態、連碰試算、**AI 綜合評分**（透明加權 ensemble）。
- 資料管線 `scripts/build-data.ts`：抓台彩官方 JSON API → 完整分析（`data/full/`，**私有、gitignore**）+ 遮罩公開版（`public/data/`，前端用）。
- **付費牆機制**：高機率號碼**不送進瀏覽器**，前端只拿得到分數+問號。完整號碼留 server 端，未來由認證 API 發。
- 前端 Next.js 16 靜態輸出 + 神秘科技感暗色主題：首頁、539/大樂透/威力彩分析頁、訂閱方案頁。
- 全站免責聲明（樂透為獨立隨機事件、不保證中獎、滿18）。

## 三件需要你授權我才能做的事
1. **加 GitHub Actions 自動部署**：今晚 OAuth token 沒有 `workflow` scope，workflow 檔被擋下，先改名成 `deploy-workflow.yml.txt`。你執行 `gh auth refresh -s workflow` 後，把它移回 `.github/workflows/deploy.yml`，之後 push 就自動部署，不用再手動。
2. **Cloudflare 正式部署**：要你登入 Cloudflare（或給 API token）。
3. **綠界特約賣家申請**：金流要用公司（統編 61138241）申請。

## 明天一起決定（你說要刪改）
- **訂閱分級草案**（目前寫在 /pricing，標了「草案」）：
  - 免費：冷熱/遺漏/尾數/區間/生肖/型態 + 每日中機率參考號 + 高機率只看分數
  - 進階 NT$99/月：解鎖完整 AI 精選號、拖牌版路、LINE 報牌、全彩種
  - 旗艦 NT$188/月，或 NT$1688/年（可切換）：自訂統計區間、複數抓牌法交叉選牌、歷史回測、連碰試算器
  - → 等級數、價格、各層功能切分都可改。
- **報牌邏輯**：目前免費露「綜合評分排名 6-10 名」（中機率），鎖「排名 1-5 名」（高機率）。要不要調整門檻/數量？
- 站名「牌靈 AI」是暫定，可改。

## 已知問題（明天修）
- **雙贏彩**抓到 2023-12 後 API 回 0 期（resKey 可能改版），今晚先排除沒上線。
- **大樂透/威力彩的「特別號」**值是猜欄位名抓的，要跟官網對一次確認正確。
- 3星/4星彩還沒做（號碼結構不同，需逐位獨立邏輯）。
- AI 綜合評分的權重是預設值（冷熱.25/遺漏.25/尾數.2/區間.15/拖牌.15），可調。

## 常用指令
```bash
npm run dev        # 本地開發
npm run data       # 重抓開獎+重算分析（539/大樂透/威力彩）
npm run build      # 靜態輸出到 out/
```

## Phase 2 後端：後台會員管理系統（已完成本地版，在 `server/`）

獨立 Hono 後端，本地用 node:sqlite，正式環境共用同一套碼上 Cloudflare Workers + D1。

**怎麼跑（本地）：**
```bash
cd server
npm install
npm run seed     # 建表 + 塞 10 筆測試會員
npm run start    # http://localhost:8787  後台在 /admin
```
後台預設帳密 `admin` / `changeme-dev-only`（在 `server/.env` 覆蓋，範本見 `.env.example`）。

**已做：**
- 後台介面（神秘科技風）：登入、儀表板統計、會員列表(搜尋/篩選)、會員詳情(改等級/狀態/延長天數/停權)、稽核日誌、報牌紀錄、手動觸發報牌
- 會員資料模型：users / subscriptions / push_targets / pick_deliveries / admin_audit / plans
- 會員 API：`/api/me`、`/api/me/picks`（**tier≥pro 才回完整高機率號**，付費牆閉環）、推播開關
- LINE Login OAuth 流程 + 開發用 `/auth/dev-login`
- 整合骨架：LINE 推播、綠界定期定額（CheckMacValue 已實作），未設憑證時走 stub
- 報牌服務：讀 `data/full` 完整分析 → 依訂閱資格推播 → 記錄

**還要你給憑證才能通的（都在 `server/.env`）：**
1. LINE Login 頻道（LINE_CHANNEL_ID/SECRET）→ 真實 LINE 登入
2. LINE 官方帳號 Messaging token → 真實報牌推播
3. 綠界 ECPay 商家金鑰（用公司統編申請）→ 真實金流

**還沒接線的：**
- `server/src/worker.ts` 是 Cloudflare Workers 入口骨架，repos 要從「模組級 node:sqlite」改成「per-request 注入 D1（async）」才能上 Workers，檔頭有註解。今晚先讓本地完整可跑。
- 前台（Next 靜態站）與後端會員區尚未串接（登入後導向、會員儀表板頁），下一步做。

架構決策都在 memory/decisions 記錄。
