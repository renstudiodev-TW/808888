import type { Metadata } from "next";
import Link from "next/link";
import { SubscribeButton } from "@/components/SubscribeButton";

export const metadata: Metadata = {
  title: "訂閱方案 · 進階 AI 報牌與拖牌版路｜808888.tw",
  description:
    "808888 訂閱方案：免費看完整冷熱、遺漏、尾數統計；進階解鎖 AI 高機率精選號、拖牌版路、每日 LINE 報牌推播。以藍新金流定期定額扣款，可隨時取消。",
  alternates: { canonical: "/pricing/" },
};

interface Tier {
  id: string;
  name: string;
  price: string;
  unit: string;
  tagline: string;
  highlight?: boolean;
  cta: string;
  features: { text: string; on: boolean }[];
}

const TIERS: Tier[] = [
  {
    id: "free",
    name: "免費會員",
    price: "0",
    unit: "永久免費",
    tagline: "先用基本統計試水溫",
    cta: "免費開始",
    features: [
      { text: "冷熱號 / 遺漏值 / 尾數 / 區間", on: true },
      { text: "生肖球 / 和值 / AC / 奇偶型態", on: true },
      { text: "每日免費參考報牌（中機率號）", on: true },
      { text: "AI 高機率精選（只看分數＋問號）", on: true },
      { text: "完整 AI 精選號碼", on: false },
      { text: "拖牌 / 版路分析", on: false },
      { text: "每日 LINE 報牌推播", on: false },
      { text: "自訂統計區間、交叉選牌", on: false },
    ],
  },
  {
    id: "pro",
    name: "進階會員",
    price: "199",
    unit: "/ 月",
    tagline: "解鎖 AI 報牌與拖牌版路",
    highlight: true,
    cta: "訂閱進階",
    features: [
      { text: "免費會員全部功能", on: true },
      { text: "每日 AI 高機率精選完整號碼", on: true },
      { text: "拖牌 / 版路共現分析", on: true },
      { text: "AI 綜合評分組成明細", on: true },
      { text: "每日 LINE 報牌推播", on: true },
      { text: "全彩種（539 / 大樂透 / 威力彩）", on: true },
      { text: "自訂統計區間", on: false },
      { text: "複數抓牌法交叉選牌、歷史回測", on: false },
    ],
  },
  {
    id: "max",
    name: "旗艦會員",
    price: "499",
    unit: "/ 月",
    tagline: "進階玩家的完整武器庫",
    cta: "訂閱旗艦",
    features: [
      { text: "進階會員全部功能", on: true },
      { text: "自訂統計區間（近 10/30/50/100 期）", on: true },
      { text: "複數抓牌法交叉選牌（交集／聯集）", on: true },
      { text: "歷史回測（號碼組過去命中統計）", on: true },
      { text: "連碰 / 立柱 獎金試算器", on: true },
      { text: "多組號碼收藏與追蹤", on: true },
      { text: "新功能優先體驗", on: true },
      { text: "優先客服", on: true },
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="mb-3 text-center">
        <span className="tag mx-auto inline-flex border-[rgba(0,240,255,0.35)] text-[var(--neon)]">訂閱方案</span>
      </div>
      <h1 className="text-center font-display text-4xl font-bold text-gradient">選擇你的抓牌等級</h1>
      <p className="mx-auto mt-4 mb-3 max-w-xl text-center text-[var(--muted)]">
        免費版就能看完整冷熱遺漏統計；訂閱解鎖 AI 高機率精選號、拖牌版路、每日 LINE 報牌與交叉選牌。
      </p>
      <p className="mx-auto mb-10 max-w-xl text-center text-[12px] text-[var(--hot)]">
        ※ 以下方案與定價為草案，功能分級與價格將與你討論後調整。
      </p>

      <div className="grid gap-5 lg:grid-cols-3">
        {TIERS.map((t) => (
          <div
            key={t.id}
            className={`relative flex flex-col p-6 ${t.highlight ? "glow-wrap glass border-[rgba(139,92,246,0.5)]" : "glass"}`}
          >
            {t.highlight && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--primary)] px-3 py-0.5 text-[11px] font-bold text-white">
                最受歡迎
              </span>
            )}
            <h2 className="font-display text-xl font-bold text-[var(--text)]">{t.name}</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">{t.tagline}</p>
            <div className="mt-4 flex items-end gap-1">
              <span className="num text-sm text-[var(--muted)]">NT$</span>
              <span className="num text-4xl font-bold text-[var(--text)]">{t.price}</span>
              <span className="mb-1 text-sm text-[var(--muted)]">{t.unit}</span>
            </div>
            <ul className="mt-5 flex-1 space-y-2 text-sm">
              {t.features.map((f, i) => (
                <li
                  key={i}
                  className={`flex items-start gap-2 ${f.on ? "text-[var(--text)]" : "text-[var(--muted)] line-through opacity-60"}`}
                >
                  <span className={f.on ? "text-[var(--cold)]" : "text-[var(--muted)]"}>{f.on ? "✓" : "—"}</span>
                  <span>{f.text}</span>
                </li>
              ))}
            </ul>
            {t.id === "free" ? (
              <SubscribeButton tier="free" label={t.cta} highlight={t.highlight} />
            ) : (
              <>
                <button className={`mt-6 ${t.highlight ? "btn-primary" : "btn-ghost"} opacity-60`} disabled>
                  {t.cta}
                </button>
                <span className="mt-2 text-center text-[11px] text-[var(--muted)]">金流開通中，敬請期待</span>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="mt-12 glass p-6">
        <h3 className="font-display text-lg font-bold text-[var(--text)]">付費方式</h3>
        <p className="mt-2 text-sm text-[var(--muted)]">
          以藍新金流 NewebPay 信用卡定期定額每月自動扣款，使用 LINE 登入綁定會員，
          訂閱後即可在網站會員區與 LINE 同步收到每日報牌。可隨時於會員專區取消續訂，詳見
          <Link href="/refund" className="text-[var(--neon)] hover:underline">退費政策</Link>。
        </p>
      </div>

      <p className="mt-8 text-center text-[12px] text-[var(--muted)]">
        訂閱前請理性評估。樂透為獨立隨機事件，本服務僅提供統計分析輔助，
        <strong className="text-[var(--text)]">無法提高中獎率、不保證中獎</strong>。未滿 18 歲不得購買彩券。
      </p>
    </div>
  );
}
