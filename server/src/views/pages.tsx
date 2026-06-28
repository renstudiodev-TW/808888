import type { FC } from "hono/jsx";
import { Layout } from "./layout.js";
import type { MemberRow, Subscription, User } from "../repos.js";
import { PLAN_SEED } from "../plans.js";

const TIER_NAME: Record<string, string> = { free: "免費", pro: "進階", max: "旗艦" };

function TierBadge({ tier }: { tier: string | null }) {
  const t = tier ?? "free";
  return <span class={`badge b-${t}`}>{TIER_NAME[t] ?? t}</span>;
}
function StatusBadge({ status }: { status: string | null }) {
  const s = status ?? "active";
  return <span class={`badge b-${s}`}>{s}</span>;
}

export const LoginPage: FC<{ error?: string }> = ({ error }) => (
  <Layout title="登入">
    <div style="max-width:380px;margin:8vh auto">
      <div class="card">
        <div class="brand" style="font-size:26px;margin-bottom:6px">🔮 808888</div>
        <h2>後台管理登入</h2>
        {error && <div class="warn" style="margin-bottom:12px">{error}</div>}
        <form method="post" action="/admin/login">
          <div style="margin-bottom:12px">
            <label>帳號</label>
            <input name="user" autocomplete="username" style="width:100%" />
          </div>
          <div style="margin-bottom:16px">
            <label>密碼</label>
            <input name="password" type="password" autocomplete="current-password" style="width:100%" />
          </div>
          <button class="btn" type="submit" style="width:100%">登入</button>
        </form>
      </div>
      <p class="muted" style="text-align:center">僅限管理者。預設帳密請在環境變數覆蓋。</p>
    </div>
  </Layout>
);

interface DashStats {
  totalUsers: number;
  byTier: Record<string, number>;
  paying: number;
  recentMembers: MemberRow[];
}

export const Dashboard: FC<{ session: { name: string }; stats: DashStats; configWarn: string[] }> = ({ session, stats, configWarn }) => (
  <Layout title="儀表板" session={session} configWarn={configWarn}>
    <h1>儀表板</h1>
    <p class="muted">會員與訂閱概況</p>
    <div class="grid g4" style="margin:16px 0">
      <div class="card"><div class="muted">總會員</div><div class="stat mono">{stats.totalUsers}</div></div>
      <div class="card"><div class="muted">付費會員</div><div class="stat mono" style="color:var(--cold)">{stats.paying}</div></div>
      <div class="card"><div class="muted">進階 Pro</div><div class="stat mono" style="color:var(--primary)">{stats.byTier.pro ?? 0}</div></div>
      <div class="card"><div class="muted">旗艦 Max</div><div class="stat mono" style="color:var(--neon)">{stats.byTier.max ?? 0}</div></div>
    </div>
    <div class="card">
      <h2>最新加入</h2>
      <MembersTable rows={stats.recentMembers} />
    </div>
  </Layout>
);

const MembersTable: FC<{ rows: MemberRow[] }> = ({ rows }) => (
  <table>
    <thead>
      <tr><th>會員</th><th>等級</th><th>狀態</th><th>到期</th><th>加入</th><th></th></tr>
    </thead>
    <tbody>
      {rows.map((m) => (
        <tr>
          <td>
            <div>{m.display_name || "(未命名)"}</div>
            <div class="muted mono" style="font-size:11px">{m.line_user_id ?? m.email ?? m.id.slice(0, 8)}</div>
          </td>
          <td><TierBadge tier={m.tier} /></td>
          <td>{m.status === "suspended" ? <span class="badge b-suspended">停權</span> : <StatusBadge status={m.sub_status} />}</td>
          <td class="mono muted">{m.current_period_end ? m.current_period_end.slice(0, 10) : "—"}</td>
          <td class="mono muted">{m.created_at.slice(0, 10)}</td>
          <td><a href={`/admin/members/${m.id}`}>管理 →</a></td>
        </tr>
      ))}
      {rows.length === 0 && <tr><td colspan={6} class="muted">沒有資料</td></tr>}
    </tbody>
  </table>
);

export const MembersPage: FC<{ session: { name: string }; rows: MemberRow[]; q: string; tier: string; configWarn: string[] }> = ({ session, rows, q, tier, configWarn }) => (
  <Layout title="會員管理" session={session} configWarn={configWarn}>
    <h1>會員管理</h1>
    <div class="card">
      <form method="get" action="/admin/members" class="row">
        <div>
          <label>搜尋 (名稱/Email/LINE ID)</label>
          <input name="q" value={q} placeholder="關鍵字" />
        </div>
        <div>
          <label>等級</label>
          <select name="tier">
            <option value="" selected={tier === ""}>全部</option>
            <option value="free" selected={tier === "free"}>免費</option>
            <option value="pro" selected={tier === "pro"}>進階</option>
            <option value="max" selected={tier === "max"}>旗艦</option>
          </select>
        </div>
        <div style="align-self:end"><button class="btn ghost" type="submit">篩選</button></div>
      </form>
    </div>
    <div class="card"><MembersTable rows={rows} /></div>
  </Layout>
);

export const MemberDetail: FC<{
  session: { name: string };
  user: User;
  sub: Subscription;
  deliveries: Array<{ game: string; channel: string; status: string; created_at: string }>;
  configWarn: string[];
}> = ({ session, user, sub, deliveries, configWarn }) => (
  <Layout title="會員詳情" session={session} configWarn={configWarn}>
    <div class="row" style="justify-content:space-between">
      <h1>{user.display_name || "(未命名會員)"}</h1>
      <a href="/admin/members" class="muted">← 返回列表</a>
    </div>

    <div class="grid g2">
      <div class="card">
        <h2>基本資料</h2>
        <table>
          <tbody>
            <tr><th>內部 ID</th><td class="mono">{user.id}</td></tr>
            <tr><th>LINE userId</th><td class="mono">{user.line_user_id ?? "—"}</td></tr>
            <tr><th>Email</th><td>{user.email ?? "—"}</td></tr>
            <tr><th>帳號狀態</th><td>{user.status === "suspended" ? <span class="badge b-suspended">停權</span> : <span class="badge b-active">正常</span>}</td></tr>
            <tr><th>加入時間</th><td class="mono muted">{user.created_at.slice(0, 19).replace("T", " ")}</td></tr>
            <tr><th>最後登入</th><td class="mono muted">{user.last_login_at?.slice(0, 19).replace("T", " ") ?? "—"}</td></tr>
          </tbody>
        </table>
        <form method="post" action={`/admin/members/${user.id}/status`} style="margin-top:12px">
          {user.status === "suspended"
            ? <button class="btn" name="status" value="active">解除停權</button>
            : <button class="btn danger" name="status" value="suspended">停權此會員</button>}
        </form>
      </div>

      <div class="card">
        <h2>訂閱管理</h2>
        <div class="row" style="margin-bottom:12px">
          <TierBadge tier={sub.tier} /><StatusBadge status={sub.status} />
        </div>
        <table>
          <tbody>
            <tr><th>來源</th><td>{sub.source === "ecpay" ? "綠界定期定額" : "後台手動"}</td></tr>
            <tr><th>開始</th><td class="mono muted">{sub.started_at.slice(0, 10)}</td></tr>
            <tr><th>本期到期</th><td class="mono muted">{sub.current_period_end?.slice(0, 10) ?? "永久/免費"}</td></tr>
            <tr><th>綠界綁定</th><td class="mono muted">{sub.ecpay_merchant_member_id ?? "—"}</td></tr>
          </tbody>
        </table>
        <form method="post" action={`/admin/members/${user.id}/subscription`} style="margin-top:14px">
          <div class="row">
            <div>
              <label>調整等級</label>
              <select name="tier">
                {PLAN_SEED.map((p) => <option value={p.tier} selected={sub.tier === p.tier}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label>狀態</label>
              <select name="status">
                {["active", "trial", "canceled", "expired"].map((s) => <option value={s} selected={sub.status === s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label>延長天數 (選填)</label>
              <input name="extendDays" type="number" placeholder="30" style="width:90px" />
            </div>
          </div>
          <div style="margin-top:12px"><button class="btn" type="submit">儲存訂閱變更</button></div>
        </form>
      </div>
    </div>

    <div class="card">
      <h2>精選寄送紀錄</h2>
      <table>
        <thead><tr><th>彩種</th><th>管道</th><th>狀態</th><th>時間</th></tr></thead>
        <tbody>
          {deliveries.map((d) => (
            <tr><td>{d.game}</td><td>{d.channel}</td><td>{d.status}</td><td class="mono muted">{d.created_at.slice(0, 19).replace("T", " ")}</td></tr>
          ))}
          {deliveries.length === 0 && <tr><td colspan={4} class="muted">尚無紀錄</td></tr>}
        </tbody>
      </table>
    </div>
  </Layout>
);

export const AuditPage: FC<{ session: { name: string }; rows: Array<{ actor: string; action: string; target_user: string | null; detail: string | null; created_at: string }>; configWarn: string[] }> = ({ session, rows, configWarn }) => (
  <Layout title="稽核日誌" session={session} configWarn={configWarn}>
    <h1>稽核日誌</h1>
    <div class="card">
      <table>
        <thead><tr><th>時間</th><th>操作者</th><th>動作</th><th>對象</th><th>明細</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr>
              <td class="mono muted">{r.created_at.slice(0, 19).replace("T", " ")}</td>
              <td>{r.actor}</td><td>{r.action}</td>
              <td class="mono muted">{r.target_user?.slice(0, 8) ?? "—"}</td>
              <td class="muted">{r.detail ?? ""}</td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colspan={5} class="muted">尚無紀錄</td></tr>}
        </tbody>
      </table>
    </div>
  </Layout>
);

export const DeliveriesPage: FC<{ session: { name: string }; rows: Array<{ display_name: string; game: string; channel: string; status: string; created_at: string }>; configWarn: string[] }> = ({ session, rows, configWarn }) => (
  <Layout title="精選紀錄" session={session} configWarn={configWarn}>
    <div class="row" style="justify-content:space-between">
      <h1>精選寄送紀錄</h1>
      <form method="post" action="/admin/deliveries/run"><button class="btn ghost" type="submit">▶ 手動觸發今日精選 (測試)</button></form>
    </div>
    <div class="card">
      <table>
        <thead><tr><th>會員</th><th>彩種</th><th>管道</th><th>狀態</th><th>時間</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr><td>{r.display_name}</td><td>{r.game}</td><td>{r.channel}</td><td>{r.status}</td><td class="mono muted">{r.created_at.slice(0, 19).replace("T", " ")}</td></tr>
          ))}
          {rows.length === 0 && <tr><td colspan={5} class="muted">尚無紀錄</td></tr>}
        </tbody>
      </table>
    </div>
  </Layout>
);
