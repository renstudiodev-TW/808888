// 訂閱方案定義 (與前端 /pricing 一致，草案，可後台調整)

export type Tier = "free" | "pro" | "max";

export interface PlanSeed {
  tier: Tier;
  name: string;
  priceTwd: number;
  features: string[];
  sortOrder: number;
}

export const PLAN_SEED: PlanSeed[] = [
  {
    tier: "free",
    name: "免費會員",
    priceTwd: 0,
    sortOrder: 0,
    features: ["冷熱/遺漏/尾數/區間/生肖/型態統計", "每日中評分參考精選", "AI 高評分精選只看分數"],
  },
  {
    tier: "pro",
    name: "進階會員",
    priceTwd: 199,
    sortOrder: 1,
    features: ["完整 AI 高評分精選號碼", "拖牌/版路分析", "評分組成明細", "每日 LINE 精選推播", "全彩種"],
  },
  {
    tier: "max",
    name: "旗艦會員",
    priceTwd: 499,
    sortOrder: 2,
    features: ["自訂統計區間", "複數抓牌法交叉選牌", "歷史回測", "連碰/立柱獎金試算器", "新功能優先"],
  },
];

/** 等級高低 (gating 用) */
export const TIER_RANK: Record<Tier, number> = { free: 0, pro: 1, max: 2 };

/** 檢查使用者等級是否達到所需等級 */
export function tierMeets(userTier: Tier, required: Tier): boolean {
  return TIER_RANK[userTier] >= TIER_RANK[required];
}
