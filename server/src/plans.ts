// 訂閱方案定義 (與前端 /pricing 一致，草案，可後台調整)

export type Tier = "free" | "pro" | "max";

export interface PlanSeed {
  tier: Tier;
  name: string;
  priceTwd: number;
  /** 年繳金額（選填）。目前只有旗艦提供年繳優惠。 */
  annualPriceTwd?: number;
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
    priceTwd: 99,
    sortOrder: 1,
    features: ["完整 AI 高評分精選號碼", "拖牌/版路分析", "評分組成明細", "每日 LINE 精選推播", "全彩種"],
  },
  {
    tier: "max",
    name: "旗艦會員",
    priceTwd: 188,
    annualPriceTwd: 1688,
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

/**
 * 每日 LINE 精選推播資格（單一來源，三處共用：/api/me、push/test、每日 cron）。
 * 規則：進階(pro)以上，且訂閱為「有效(active)」或「試用(trial)」。
 *
 * ⚠️ 到期保護：本函式只看當下 tier/status，不負責判斷到期。呼叫前務必先經
 *    subsRepo.ensureActive()，它會把過期的付費/試用降為 free + expired；
 *    降級後 tier 為 free → tierMeets 失敗 → 自動鎖住。傳入未經 ensureActive
 *    的訂閱會繞過到期鎖，務必不要這樣用。
 */
export function canReceivePush(tier: Tier, subStatus: string): boolean {
  return tierMeets(tier, "pro") && (subStatus === "active" || subStatus === "trial");
}
