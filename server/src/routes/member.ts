import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { requireMember, issueSession, clearSession, isAdminUser } from "../auth.js";
import { getLoginUrl, exchangeCode, pushMessage } from "../integrations/line.js";
import { usersRepo, subsRepo, pushRepo, ordersRepo, auditRepo } from "../repos.js";
import { lineConfigured, config, ecpayConfigured } from "../config.js";
import { loadFull, buildTestFlex } from "../reports.js";
import { tierMeets, canReceivePush, PLAN_SEED } from "../plans.js";
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
      // 首次註冊送 14 天旗艦試用（含每日 LINE 精選推播，讓試用者實際體驗；到期自動降級鎖住）。
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
  // 每日 LINE 推播：進階以上的付費或試用會員皆可用；ensureActive 已把過期試用降級鎖住。
  const canPush = canReceivePush(sub.tier, sub.status);
  return c.json({
    id: user.id,
    name: user.display_name,
    picture: user.picture_url,
    email: user.email,
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

// 付款人 Email：LINE 登入通常拿不到 email，訂閱前補填，供藍新扣款通知/電子發票寄送。
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
member.post("/api/me/email", requireMember, async (c) => {
  const s = c.get("session") as { sub: string };
  const body = await c.req.parseBody().catch(() => ({}));
  const email = String((body as Record<string, unknown>).email ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return c.json({ ok: false, error: "Email 格式不正確" }, 400);
  }
  await usersRepo.setEmail(s.sub, email);
  return c.json({ ok: true, email });
});

// 傳一則測試推播給自己（驗證整條 LINE 推播鏈是否打通）。
member.post("/api/me/push/test", requireMember, async (c) => {
  const s = c.get("session") as { sub: string };
  const user = await usersRepo.byId(s.sub);
  if (!user?.line_user_id) return c.json({ ok: false, error: "無 LINE 綁定" }, 400);
  const sub = await subsRepo.ensureActive(s.sub);
  if (!canReceivePush(sub.tier, sub.status)) {
    return c.json({ ok: false, error: "每日 LINE 推播需進階以上的付費或試用資格，試用到期後請訂閱。" }, 403);
  }
  const res = await pushMessage(user.line_user_id, [buildTestFlex()]);
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
  const cycle: "M" | "Y" = String((body as Record<string, unknown>).cycle ?? "M") === "Y" ? "Y" : "M";
  const plan = PLAN_SEED.find((p) => p.tier === tier && p.priceTwd > 0);
  if (!plan) return c.json({ error: "方案不存在" }, 400);
  if (cycle === "Y" && !plan.annualPriceTwd) return c.json({ error: "此方案不支援年繳" }, 400);
  const amount = cycle === "Y" ? plan.annualPriceTwd! : plan.priceTwd;

  // 藍新委託扣款需付款人 Email 寄送扣款通知/電子發票。缺 email 先請前端補填，
  // 不再自動塞 uXXXX@808888.tw 佔位假信箱（會導致通知/發票寄不到）。
  const email = (user.email ?? "").trim();
  if (!EMAIL_RE.test(email)) {
    return c.json({ error: "請先填寫付款通知 Email", needEmail: true }, 422);
  }

  const merOrderNo = "P" + uuid().replace(/-/g, "").slice(0, 20);
  await ordersRepo.create({ merOrderNo, userId: user.id, tier: plan.tier, amount, cycle });

  const base = config.baseUrl;
  const now = new Date();
  // 月繳：每月固定扣款「日」(01~31)；年繳：週年扣款「月日」(MMDD)。
  const periodPoint =
    cycle === "Y"
      ? String(now.getUTCMonth() + 1).padStart(2, "0") + String(now.getUTCDate()).padStart(2, "0")
      : String(now.getUTCDate()).padStart(2, "0");
  const checkout = createSubscriptionCheckout({
    orderNo: merOrderNo,
    amount,
    itemName: `808888 ${plan.name}${cycle === "Y" ? "（年繳）" : ""}`,
    email,
    periodType: cycle,
    periodPoint,
    periodStartType: 2,
    returnUrl: `${base}/api/pay/return`,
    notifyUrl: `${base}/api/pay/newebpay/notify`,
  });
  return c.json({ action: checkout.action, fields: checkout.fields });
});

// 付款完成後藍新以 Form POST 導回 → 轉回會員頁。
member.all("/api/pay/return", async (c) => {
  try {
    const body = await c.req.parseBody().catch(() => ({}));
    const dump = JSON.stringify(body).slice(0, 600);
    console.log("[pay/return] 藍新導回內容:", dump);
    await auditRepo.log("system", "藍新導回", undefined, dump);
  } catch (e) {
    await auditRepo.log("system", "藍新導回-錯誤", undefined, String(e));
  }
  return c.redirect("/member/?pay=done");
});

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

  // 定期定額每期(首期+續扣)都會送 notify。每次成功就把到期日設為「現在+1個計費週期」
  // (月繳+1個月／年繳+1年，週期存在下單當下的 order.cycle)。
  // period_end 為絕對值(非累加)，藍新若重送同一期也只是設成相同日期，天然冪等。
  const end = new Date();
  if (order.cycle === "Y") end.setFullYear(end.getFullYear() + 1);
  else end.setMonth(end.getMonth() + 1);
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
