import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { requireMember, issueSession, clearSession, isAdminUser } from "../auth.js";
import { getLoginUrl, exchangeCode, pushMessage } from "../integrations/line.js";
import { usersRepo, subsRepo, pushRepo, ordersRepo } from "../repos.js";
import { lineConfigured, config, ecpayConfigured } from "../config.js";
import { loadFull } from "../reports.js";
import { tierMeets, PLAN_SEED } from "../plans.js";
import type { Tier } from "../plans.js";
import { createSubscriptionCheckout, parseNotify } from "../integrations/newebpay.js";
import { liveAnalyze, liveDrag, liveMethodPicks } from "../analyze-live.js";
import { uuid } from "../util.js";

export const member = new Hono();

// VIP 白名單（站長本人）：登入時自動維持 max 旗艦、永久有效。
const VIP_LINE_IDS = new Set<string>([
  "U3237b62e01288cbf92e7872114e8427f", // 張博仁
  "U613581e7cbe8f5c3f2e1c31d3e1d6a24", // Ren (ren.studio.dev)
]);

async function applyVip(userId: string, lineUserId: string | null) {
  if (!lineUserId || !VIP_LINE_IDS.has(lineUserId)) return;
  const sub = await subsRepo.ensure(userId);
  await subsRepo.update(sub.id, {
    tier: "max" as Tier,
    status: "active",
    current_period_end: "2099-12-31T00:00:00.000Z",
    source: "vip",
  });
}

member.get("/auth/line/login", async (c) => {
  if (!lineConfigured()) {
    return c.text("LINE Login 尚未設定憑證。開發測試請用 /auth/dev-login。", 503);
  }
  const state = uuid();
  const nonce = uuid();
  setCookie(c, "line_state", state, { httpOnly: true, sameSite: "Lax", path: "/", maxAge: 600 });
  return c.redirect(getLoginUrl(state, nonce));
});

member.get("/auth/line/callback", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");
  const saved = getCookie(c, "line_state");
  if (!code || !state || state !== saved) return c.text("登入驗證失敗 (state 不符)", 400);
  try {
    const prof = await exchangeCode(code);
    let user = await usersRepo.byLineId(prof.lineUserId);
    if (!user) {
      user = await usersRepo.create({
        line_user_id: prof.lineUserId,
        display_name: prof.displayName,
        picture_url: prof.pictureUrl ?? null,
        email: prof.email ?? null,
      });
      // 首次註冊送 14 天旗艦試用（不含每日 LINE 推播，那是付費專屬）。
      const sub = await subsRepo.ensure(user.id);
      const end = new Date();
      end.setDate(end.getDate() + 14);
      await subsRepo.update(sub.id, {
        tier: "max",
        status: "trial",
        current_period_end: end.toISOString(),
        source: "trial",
      });
    }
    await usersRepo.touchLogin(user.id);
    await pushRepo.upsert(user.id, prof.lineUserId, true);
    await applyVip(user.id, user.line_user_id);
    await issueSession(c, { sub: user.id, role: "member", name: user.display_name });
    return c.redirect("/member/");
  } catch (e) {
    return c.text(`LINE 登入失敗：${(e as Error).message}`, 500);
  }
});

member.get("/auth/dev-login", async (c) => {
  if (lineConfigured()) return c.text("正式環境停用 dev-login", 403);
  const name = c.req.query("name") || "測試會員";
  const fakeLineId = `dev_${name}`;
  let user = await usersRepo.byLineId(fakeLineId);
  if (!user) {
    user = await usersRepo.create({ line_user_id: fakeLineId, display_name: name });
    await subsRepo.ensure(user.id);
  }
  await usersRepo.touchLogin(user.id);
  await pushRepo.upsert(user.id, fakeLineId, true);
  await issueSession(c, { sub: user.id, role: "member", name: user.display_name });
  return c.json({ ok: true, userId: user.id, name: user.display_name, note: "已登入 (dev)" });
});

member.get("/auth/logout", (c) => {
  clearSession(c);
  return c.redirect("/");
});

member.get("/api/me", requireMember, async (c) => {
  const s = c.get("session") as { sub: string };
  const user = await usersRepo.byId(s.sub);
  if (!user) return c.json({ error: "not found" }, 404);
  const sub = await subsRepo.ensureActive(user.id);
  const push = await pushRepo.forUser(user.id);
  // 每日 LINE 推播為正式付費（active）會員專屬，試用(trial)不含。
  const canPush = tierMeets(sub.tier, "pro") && sub.status === "active";
  return c.json({
    id: user.id,
    name: user.display_name,
    picture: user.picture_url,
    tier: sub.tier,
    subStatus: sub.status,
    source: sub.source,
    periodEnd: sub.current_period_end,
    hasLine: Boolean(user.line_user_id),
    pushEnabled: push ? Boolean(push.enabled) : false,
    canPush,
    isAdmin: await isAdminUser(user.id),
  });
});

// 旗艦會員自訂母數即時分析：可選任意視窗期數重算。
member.get("/api/me/analyze", requireMember, async (c) => {
  const s = c.get("session") as { sub: string };
  const sub = await subsRepo.ensureActive(s.sub);
  if (!tierMeets(sub.tier, "max")) return c.json({ error: "需要旗艦會員" }, 403);
  const game = c.req.query("game") ?? "daily539";
  const window = parseInt(c.req.query("window") ?? "50", 10);
  const result = liveAnalyze(game, window);
  if (!result) return c.json({ error: "no data" }, 404);
  return c.json(result);
});

// 複數抓牌法交叉選牌（旗艦）。
member.get("/api/me/cross", requireMember, async (c) => {
  const s = c.get("session") as { sub: string };
  const sub = await subsRepo.ensureActive(s.sub);
  if (!tierMeets(sub.tier, "max")) return c.json({ error: "需要旗艦會員" }, 403);
  const game = c.req.query("game") ?? "daily539";
  const window = parseInt(c.req.query("window") ?? "50", 10);
  const n = parseInt(c.req.query("n") ?? "8", 10);
  const result = liveMethodPicks(game, window, n);
  if (!result) return c.json({ error: "no data" }, 404);
  return c.json(result);
});

// 拖牌/版路分析（進階以上）。
member.get("/api/me/drag", requireMember, async (c) => {
  const s = c.get("session") as { sub: string };
  const sub = await subsRepo.ensureActive(s.sub);
  if (!tierMeets(sub.tier, "pro")) return c.json({ error: "需要進階以上訂閱" }, 403);
  const game = c.req.query("game") ?? "daily539";
  const result = liveDrag(game);
  if (!result) return c.json({ error: "no data" }, 404);
  return c.json(result);
});

member.get("/api/me/picks", requireMember, async (c) => {
  const s = c.get("session") as { sub: string };
  const game = c.req.query("game") ?? "daily539";
  const sub = await subsRepo.ensureActive(s.sub);
  if (!tierMeets(sub.tier, "pro")) {
    return c.json({ error: "需要進階以上訂閱", tier: sub.tier }, 403);
  }
  const b = loadFull(game);
  if (!b) return c.json({ error: "no data" }, 404);
  const picks = b.score.slice(0, b.pick).map((x) => ({ n: x.n, score: x.score }));
  return c.json({ game, period: b.latest?.period, picks });
});

member.post("/api/me/push", requireMember, async (c) => {
  const s = c.get("session") as { sub: string };
  const user = await usersRepo.byId(s.sub);
  if (!user?.line_user_id) return c.json({ error: "無 LINE 綁定" }, 400);
  const body = await c.req.parseBody().catch(() => ({}));
  const enabled = String((body as Record<string, unknown>).enabled ?? "true") !== "false";
  await pushRepo.upsert(user.id, user.line_user_id, enabled);
  return c.json({ ok: true, enabled });
});

// 傳一則測試推播給自己（驗證整條 LINE 推播鏈是否打通）。
member.post("/api/me/push/test", requireMember, async (c) => {
  const s = c.get("session") as { sub: string };
  const user = await usersRepo.byId(s.sub);
  if (!user?.line_user_id) return c.json({ ok: false, error: "無 LINE 綁定" }, 400);
  const sub = await subsRepo.ensureActive(s.sub);
  if (!(tierMeets(sub.tier, "pro") && sub.status === "active")) {
    return c.json({ ok: false, error: "每日 LINE 推播為正式付費會員專屬，試用/免費不含。" }, 403);
  }
  const res = await pushMessage(user.line_user_id, [
    {
      type: "text",
      text: "🔮 808888 測試推播\n你已成功開通 LINE 精選推播！開獎前老師傅會把當日精選號送到這裡。\n\n⚠️ 樂透為獨立隨機事件，僅供參考娛樂，不保證中獎。",
    },
  ]);
  if (res.stub) return c.json({ ok: false, error: "推播未設定（缺 access token）" }, 503);
  if (!res.ok) {
    // 最常見：用戶尚未加 808888 官方帳號好友 → LINE 拒收
    return c.json({ ok: false, error: `LINE 拒收（status ${res.status}）。請先把 @808888.tw 加為好友。` }, 502);
  }
  return c.json({ ok: true });
});

// ── 金流：藍新定期定額 ──

// 建立訂閱付款：產生委託表單欄位，前端自動 POST 到藍新付款頁。
member.post("/api/pay/checkout", requireMember, async (c) => {
  if (!ecpayConfigured()) return c.json({ error: "金流尚未設定" }, 503);
  const s = c.get("session") as { sub: string };
  const user = await usersRepo.byId(s.sub);
  if (!user) return c.json({ error: "not found" }, 404);
  const body = await c.req.parseBody().catch(() => ({}));
  const tier = String((body as Record<string, unknown>).tier ?? "");
  const plan = PLAN_SEED.find((p) => p.tier === tier && p.priceTwd > 0);
  if (!plan) return c.json({ error: "方案不存在" }, 400);

  const merOrderNo = "P" + uuid().replace(/-/g, "").slice(0, 20);
  await ordersRepo.create({ merOrderNo, userId: user.id, tier: plan.tier, amount: plan.priceTwd });

  const base = config.baseUrl;
  const day = String(new Date().getUTCDate()).padStart(2, "0"); // 每月扣款日
  const checkout = createSubscriptionCheckout({
    orderNo: merOrderNo,
    amount: plan.priceTwd,
    itemName: `808888 ${plan.name}`,
    email: user.email ?? `u${user.id.slice(0, 8)}@808888.tw`,
    periodType: "M",
    periodPoint: day,
    periodStartType: 2,
    returnUrl: `${base}/api/pay/return`,
    notifyUrl: `${base}/api/pay/newebpay/notify`,
  });
  return c.json({ action: checkout.action, fields: checkout.fields });
});

// 付款完成後藍新以 Form POST 導回 → 轉回會員頁。
member.all("/api/pay/return", (c) => c.redirect("/member/?pay=done"));

// 藍新幕後通知（server-to-server）：解密、開通訂閱。公開、不需登入。
member.post("/api/pay/newebpay/notify", async (c) => {
  const body = await c.req.parseBody().catch(() => ({}));
  const period = String((body as Record<string, unknown>).Period ?? "");
  if (!period) return c.text("0|no period", 400);
  let notify;
  try {
    notify = parseNotify(period);
  } catch {
    return c.text("0|decrypt fail", 400);
  }
  const result = notify.result as Record<string, unknown>;
  const merOrderNo = String(result.MerchantOrderNo ?? "");
  const order = merOrderNo ? await ordersRepo.byOrderNo(merOrderNo) : undefined;
  if (!order) return c.text("1|order not found", 200); // 回 200 避免藍新重試風暴

  if (notify.status !== "SUCCESS") {
    await ordersRepo.markFailed(merOrderNo, JSON.stringify(notify));
    return c.text("1|failed-logged", 200);
  }

  // 定期定額每期(首期+每月續扣)都會送 notify。每次成功就把到期日設為「現在+1個月」。
  // period_end 為絕對值(非累加)，藍新若重送同一期也只是設成相同日期，天然冪等。
  const end = new Date();
  end.setMonth(end.getMonth() + 1);
  const sub = await subsRepo.ensure(order.user_id);
  await subsRepo.update(sub.id, {
    tier: order.tier as Tier,
    status: "active",
    current_period_end: end.toISOString(),
    source: "newebpay",
  });
  await ordersRepo.markPaid(merOrderNo, {
    periodNo: String(result.PeriodNo ?? ""),
    tradeNo: String(result.TradeNo ?? ""),
    raw: JSON.stringify(notify),
  });
  return c.text("1|OK", 200);
});
