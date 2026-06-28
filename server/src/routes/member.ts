import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { requireMember, issueSession, clearSession } from "../auth.js";
import { getLoginUrl, exchangeCode } from "../integrations/line.js";
import { usersRepo, subsRepo, pushRepo } from "../repos.js";
import { lineConfigured } from "../config.js";
import { loadFull } from "../reports.js";
import { tierMeets } from "../plans.js";
import { uuid } from "../util.js";

export const member = new Hono();

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
      await subsRepo.ensure(user.id);
    }
    await usersRepo.touchLogin(user.id);
    await pushRepo.upsert(user.id, prof.lineUserId, true);
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
  const sub = await subsRepo.ensure(user.id);
  const push = await pushRepo.forUser(user.id);
  return c.json({
    id: user.id,
    name: user.display_name,
    picture: user.picture_url,
    tier: sub.tier,
    subStatus: sub.status,
    periodEnd: sub.current_period_end,
    hasLine: Boolean(user.line_user_id),
    pushEnabled: push ? Boolean(push.enabled) : false,
  });
});

member.get("/api/me/picks", requireMember, async (c) => {
  const s = c.get("session") as { sub: string };
  const game = c.req.query("game") ?? "daily539";
  const sub = await subsRepo.ensure(s.sub);
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
