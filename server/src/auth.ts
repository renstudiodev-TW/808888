// 認證：JWT cookie session。後台 admin 用帳密；會員用 LINE Login。
import { sign, verify } from "hono/jwt";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import type { Context, MiddlewareHandler } from "hono";
import { config } from "./config.js";
import { usersRepo } from "./repos.js";

const COOKIE = "plsess";

// 站長的 LINE 帳號：用 LINE 登入即等同管理員，免再輸入後台帳密。
export const ADMIN_LINE_IDS = new Set<string>([
  "U613581e7cbe8f5c3f2e1c31d3e1d6a24", // Ren (ren.studio.dev)
  "U3237b62e01288cbf92e7872114e8427f", // 張博仁
]);

export async function isAdminUser(userId: string): Promise<boolean> {
  const user = await usersRepo.byId(userId);
  return Boolean(user?.line_user_id && ADMIN_LINE_IDS.has(user.line_user_id));
}

export interface Session {
  sub: string; // userId 或 "admin"
  role: "admin" | "member";
  name: string;
  exp?: number;
}

export async function issueSession(c: Context, s: Omit<Session, "exp">, days = 7) {
  const exp = Math.floor(Date.now() / 1000) + days * 86400;
  const token = await sign({ ...s, exp }, config.sessionSecret, "HS256");
  setCookie(c, COOKIE, token, {
    httpOnly: true,
    sameSite: "Lax",
    path: "/",
    maxAge: days * 86400,
    secure: config.baseUrl.startsWith("https"),
  });
}

export function clearSession(c: Context) {
  deleteCookie(c, COOKIE, { path: "/" });
}

export async function readSession(c: Context): Promise<Session | null> {
  const token = getCookie(c, COOKIE);
  if (!token) return null;
  try {
    return (await verify(token, config.sessionSecret, "HS256")) as unknown as Session;
  } catch {
    return null;
  }
}

/** 後台守衛：admin 帳密 session，或站長 LINE 帳號(白名單)皆可進入 */
export const requireAdmin: MiddlewareHandler = async (c, next) => {
  const s = await readSession(c);
  if (s?.role === "admin") {
    c.set("session", s);
    return next();
  }
  if (s?.role === "member" && (await isAdminUser(s.sub))) {
    c.set("session", { ...s, role: "admin" });
    return next();
  }
  // 未登入 → 去 LINE 登入；已登入但非站長 → 回首頁。
  return c.redirect(s ? "/" : "/auth/line/login");
};

/** 會員 API 守衛：未登入回 401 */
export const requireMember: MiddlewareHandler = async (c, next) => {
  const s = await readSession(c);
  if (!s || s.role !== "member") return c.json({ error: "unauthorized" }, 401);
  c.set("session", s);
  await next();
};

