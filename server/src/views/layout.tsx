// 後台共用版型 (神秘科技感暗色，與前台一致)
import type { FC, PropsWithChildren } from "hono/jsx";

const CSS = `
:root{--bg:#080b10;--surface:#121824;--surface2:#0e1420;--primary:#8b5cf6;--neon:#00f0ff;
--text:#f3f4f6;--muted:#9ca3af;--hot:#ff2a5f;--cold:#00ff87;--border:rgba(255,255,255,.08)}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font-family:"Microsoft JhengHei",system-ui,sans-serif;
background-image:linear-gradient(rgba(255,255,255,.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.015) 1px,transparent 1px);background-size:44px 44px}
a{color:var(--neon);text-decoration:none}
.mono{font-family:ui-monospace,"JetBrains Mono",monospace;font-variant-numeric:tabular-nums}
.wrap{max-width:1100px;margin:0 auto;padding:20px}
header.top{position:sticky;top:0;z-index:10;background:rgba(8,11,16,.85);backdrop-filter:blur(10px);
border-bottom:1px solid var(--border);padding:12px 20px;display:flex;align-items:center;justify-content:space-between}
.brand{font-weight:700;font-size:18px;background:linear-gradient(120deg,var(--neon),var(--primary));-webkit-background-clip:text;background-clip:text;color:transparent}
nav a{margin-left:16px;color:var(--muted);font-size:14px}
nav a:hover{color:var(--neon)}
.card{background:rgba(18,24,36,.72);border:1px solid var(--border);border-radius:14px;padding:18px;margin-bottom:16px}
.grid{display:grid;gap:14px}
.g4{grid-template-columns:repeat(4,1fr)}
.g3{grid-template-columns:repeat(3,1fr)}
.g2{grid-template-columns:repeat(2,1fr)}
@media(max-width:760px){.g4,.g3,.g2{grid-template-columns:1fr 1fr}}
.stat{font-size:30px;font-weight:700}
.muted{color:var(--muted);font-size:13px}
table{width:100%;border-collapse:collapse;font-size:14px}
th,td{text-align:left;padding:10px 8px;border-bottom:1px solid var(--border)}
th{color:var(--muted);font-weight:600;font-size:12px}
tr:hover td{background:rgba(255,255,255,.02)}
.badge{display:inline-block;padding:2px 9px;border-radius:999px;font-size:12px;border:1px solid var(--border)}
.b-free{color:var(--muted)}
.b-pro{color:#fff;background:rgba(139,92,246,.25);border-color:rgba(139,92,246,.5)}
.b-max{color:#fff;background:linear-gradient(120deg,var(--primary),#6d28d9);border-color:transparent}
.b-active{color:var(--cold);border-color:rgba(0,255,135,.4)}
.b-suspended,.b-expired,.b-canceled{color:var(--hot);border-color:rgba(255,42,95,.4)}
.b-trial{color:var(--neon);border-color:rgba(0,240,255,.4)}
input,select{background:var(--surface2);border:1px solid var(--border);color:var(--text);
border-radius:8px;padding:9px 11px;font-size:14px;font-family:inherit}
input:focus,select:focus{outline:none;border-color:var(--neon)}
.btn{display:inline-flex;align-items:center;gap:6px;border:none;cursor:pointer;border-radius:999px;
padding:9px 18px;font-weight:600;font-size:14px;font-family:inherit;
color:#fff;background:linear-gradient(120deg,var(--primary),#6d28d9)}
.btn:hover{box-shadow:0 0 18px rgba(139,92,246,.5)}
.btn.ghost{background:transparent;border:1px solid var(--border);color:var(--text)}
.btn.ghost:hover{border-color:var(--neon);color:var(--neon)}
.btn.danger{background:linear-gradient(120deg,#ff2a5f,#b91c4b)}
.row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.warn{border:1px solid rgba(255,42,95,.3);background:rgba(255,42,95,.06);border-radius:10px;padding:10px 14px;font-size:13px;color:var(--muted)}
label{font-size:12px;color:var(--muted);display:block;margin-bottom:4px}
h1{font-size:24px;margin:0 0 4px}
h2{font-size:18px;margin:0 0 12px}
`;

export const Layout: FC<PropsWithChildren<{ title: string; session?: { name: string } | null; configWarn?: string[] }>> = (props) => {
  return (
    <html lang="zh-Hant">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex" />
        <title>{props.title} · 17168 後台</title>
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
      </head>
      <body>
        {props.session && (
          <header class="top">
            <span class="brand">🔮 17168 後台</span>
            <nav>
              <a href="/admin">儀表板</a>
              <a href="/admin/members">會員</a>
              <a href="/admin/deliveries">報牌紀錄</a>
              <a href="/admin/audit">稽核</a>
              <a href="/admin/logout">登出</a>
            </nav>
          </header>
        )}
        <div class="wrap">
          {props.configWarn && props.configWarn.length > 0 && (
            <div class="warn">⚙️ 未設定的整合（功能以 stub 運作）：{props.configWarn.join("、")}。填入對應環境變數即為真實串接。</div>
          )}
          {props.children}
        </div>
      </body>
    </html>
  );
};
