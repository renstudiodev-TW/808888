import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono, Noto_Sans_TC } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});
const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});
const noto = Noto_Sans_TC({
  variable: "--font-noto",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "17168 · 一起一路發｜樂透抓牌 AI 統計分析",
  description:
    "17168 用台灣民間抓牌技巧 + AI 統計，把冷熱號、遺漏值、尾數、拖牌版路自動算給你看。僅供參考娛樂，無法保證中獎。",
};

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[rgba(8,11,16,0.8)] backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl">🔮</span>
          <span className="font-display text-lg font-bold tracking-wide text-gradient">17168</span>
          <span className="hidden text-xs text-[var(--muted)] sm:inline">一起一路發</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm sm:gap-4">
          <Link href="/games/daily539" className="px-2 py-1 text-[var(--muted)] hover:text-[var(--neon)]">今彩539</Link>
          <Link href="/games/lotto649" className="hidden px-2 py-1 text-[var(--muted)] hover:text-[var(--neon)] sm:inline">大樂透</Link>
          <Link href="/games/superLotto638" className="hidden px-2 py-1 text-[var(--muted)] hover:text-[var(--neon)] sm:inline">威力彩</Link>
          <Link href="/pricing" className="btn-primary !px-4 !py-1.5 text-sm">訂閱方案</Link>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-20 border-t border-[var(--border)] bg-[var(--surface-2)]">
      <div className="mx-auto max-w-6xl px-5 py-10 text-sm text-[var(--muted)]">
        <div className="mb-4 rounded-xl border border-[rgba(255,42,95,0.25)] bg-[rgba(255,42,95,0.05)] p-4 text-[13px] leading-relaxed">
          <strong className="text-[var(--text)]">免責聲明：</strong>
          樂透每期皆為獨立隨機事件，歷史開獎號碼<strong className="text-[var(--text)]">不影響</strong>未來開獎機率。
          本站所有分析（冷熱號、遺漏值、尾數、拖牌、AI 綜合評分等）僅是將玩家原本的手算統計自動化與視覺化，
          <strong className="text-[var(--text)]">無法提高中獎率、不保證任何中獎結果</strong>，僅供參考娛樂。
          購買彩券請理性節制，未滿 18 歲不得購買。
        </div>
        <div className="flex flex-col items-start justify-between gap-2 sm:flex-row">
          <span>© {new Date().getFullYear()} 17168 · 由 仁格數位科技工坊 開發</span>
          <span className="text-[var(--muted)]">資料來源：台灣彩券公開開獎結果</span>
        </div>
      </div>
    </footer>
  );
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="zh-Hant"
      className={`${spaceGrotesk.variable} ${jetbrains.variable} ${noto.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
