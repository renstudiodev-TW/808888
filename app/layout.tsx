import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono, Noto_Sans_TC } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import { AuthNav } from "@/components/AuthNav";
import { VisitCounter } from "@/components/VisitCounter";
import "./globals.css";

const LINE_ADD_URL = "https://line.me/R/ti/p/%40808888.tw";

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

// next/image 不會自動為絕對路徑 src 補上 basePath，GitHub Pages 專案頁需手動帶入。
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const siteUrl = "https://808888.tw";
const shareTitle = "808888.tw｜全亞洲最發發發的 AI 老師傅";
const shareDesc =
  "把玄學變成數據。冷熱號、遺漏值、尾數、拖牌版路…十多種台灣民間抓牌絕活，AI 一次算給你看，每天開獎前自動更新。僅供參考娛樂，無法保證中獎。";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: shareTitle,
  description: shareDesc,
  applicationName: "808888.tw",
  keywords: [
    "今彩539", "大樂透", "威力彩", "樂透分析", "樂透統計", "冷熱號", "遺漏值",
    "拖牌", "尾數", "AI 選號", "樂透統計", "開獎號碼", "樂透走勢", "抓牌技巧", "538",
  ],
  alternates: { canonical: "/" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  openGraph: {
    type: "website",
    locale: "zh_TW",
    url: siteUrl,
    siteName: "808888.tw",
    title: shareTitle,
    description: shareDesc,
    images: [{ url: "/caishen.png", width: 640, height: 640, alt: "808888 賽博財神爺" }],
  },
  twitter: {
    card: "summary_large_image",
    title: shareTitle,
    description: shareDesc,
    images: ["/caishen.png"],
  },
};

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[rgba(8,11,16,0.8)] backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <Link href="/" className="flex min-w-0 shrink items-center gap-2">
          <span className="relative block h-9 w-9 shrink-0 overflow-hidden rounded-full ring-1 ring-[rgba(0,240,255,0.3)]">
            <Image
              src={`${basePath}/caishen.webp`}
              alt="808888 財神爺"
              width={64}
              height={64}
              className="absolute left-1/2 top-0 w-[185%] max-w-none -translate-x-1/2"
              style={{ marginTop: "-4%" }}
            />
          </span>
          <span className="whitespace-nowrap font-display text-lg font-extrabold tracking-wide text-gradient sm:text-2xl">808888.tw</span>
          <span className="ml-1 hidden rounded-full border border-[rgba(255,42,95,0.5)] bg-[rgba(255,42,95,0.12)] px-3 py-1 text-base font-extrabold text-[var(--hot)] shadow-[0_0_16px_rgba(255,42,95,0.35)] lg:inline">
            幫您發發發發
          </span>
        </Link>
        <nav className="flex shrink-0 items-center gap-2 text-sm sm:gap-4">
          <Link href="/games/daily539" className="hidden px-2 py-1 text-[var(--muted)] hover:text-[var(--neon)] sm:inline">今彩539</Link>
          <Link href="/games/lotto649" className="hidden px-2 py-1 text-[var(--muted)] hover:text-[var(--neon)] sm:inline">大樂透</Link>
          <Link href="/games/superLotto638" className="hidden px-2 py-1 text-[var(--muted)] hover:text-[var(--neon)] sm:inline">威力彩</Link>
          <Link href="/pricing" className="btn-primary shrink-0 whitespace-nowrap !px-3 !py-1.5 text-sm sm:!px-4">訂閱方案</Link>
          <AuthNav />
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
        <nav className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-[13px]">
          <Link href="/pricing" className="hover:text-[var(--neon)]">訂閱方案</Link>
          <Link href="/terms" className="hover:text-[var(--neon)]">服務條款</Link>
          <Link href="/refund" className="hover:text-[var(--neon)]">退費政策</Link>
          <Link href="/privacy" className="hover:text-[var(--neon)]">隱私權政策</Link>
        </nav>
        <div className="mb-3 text-[13px] leading-relaxed">
          <div className="text-[var(--text)]">仁格數位科技工坊　統一編號 61138241</div>
          <div>高雄市前鎮區武德街153巷17號　聯絡電話 0976-858-794　Email ren.studio.dev@gmail.com</div>
        </div>
        <div className="mb-3 text-[13px] text-[var(--muted)]">
          <VisitCounter />
        </div>
        <div className="flex flex-col items-start justify-between gap-2 sm:flex-row">
          <span>© {new Date().getFullYear()} 808888.tw · 由 仁格數位科技工坊（renstudio.tw）開發營運</span>
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "808888.tw",
              alternateName: "808888 樂透抓牌 AI 分析",
              url: siteUrl,
              description: shareDesc,
              inLanguage: "zh-Hant",
              publisher: {
                "@type": "Organization",
                name: "仁格數位科技工坊",
                url: "https://renstudio.tw",
              },
            }),
          }}
        />
        <a
          href={LINE_ADD_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-[#06C755] px-3 py-1.5 text-center text-[12px] font-bold text-white transition hover:brightness-110 sm:text-sm"
        >
          🟢 加官方 LINE <span className="underline underline-offset-2">@808888.tw</span> 好友<span className="hidden sm:inline">，每日精選不錯過</span> →
        </a>
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
