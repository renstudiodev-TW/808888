# 牌靈 AI · 交班說明（2026-06-28 夜）

## 線上網址（已部署）
**https://renstudiodev-tw.github.io/lotterychang/**

GitHub repo（public）：https://github.com/renstudiodev-TW/lotterychang

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
  - 進階 NT$199/月：解鎖完整 AI 精選號、拖牌版路、LINE 報牌、全彩種
  - 旗艦 NT$499/月：自訂統計區間、複數抓牌法交叉選牌、歷史回測、連碰試算器
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

## Phase 2 待辦（會員/訂閱/推播）
LINE Login 登入 → 綠界定期定額金流 → Cloudflare D1 存會員/訂閱 → Cron 每日報牌 → LINE Messaging API 推播（注意每月免費 200 則，超過付費）。架構已在 memory/decisions 記錄。
