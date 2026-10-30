import type { Metadata } from "next";
import { CodeRain } from "@/components/CodeRain";
import { LatestDraws } from "@/components/LatestDraws";
import { LotteryNews } from "@/components/LotteryNews";
import { Faq } from "@/components/Faq";
import { StoryPicker } from "@/components/story/StoryPicker";

export const metadata: Metadata = {
  description:
    "選彩種、回答幾個隨機小問題，AI 幫你把今天的生活編成一段藏著號碼的短故事。今彩539、大樂透、威力彩都能抽，結果還能分享到 LINE。純屬娛樂，不影響中獎機率。",
};

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-5">
      {/* Hero：故事抓牌 */}
      <section className="relative overflow-hidden py-8 text-center sm:py-14">
        {/* 駭客任務代碼雨背景 */}
        <CodeRain className="[mask-image:radial-gradient(ellipse_60%_70%_at_50%_45%,transparent_30%,black_100%)]" />
        <div className="relative z-10 mx-auto max-w-3xl">
          <h1 className="font-display text-3xl leading-tight font-bold sm:text-5xl">
            <span className="text-[var(--text)]">把今天，</span>
            <span className="text-gradient">抓成一組號碼</span>
          </h1>
          <p className="mx-auto mt-3 mb-6 max-w-xl text-sm text-[var(--muted)] sm:text-base">
            回答幾個小問題，AI 老師傅幫你編一段藏著號碼的小故事。好玩就丟到 LINE 群組給朋友看。
          </p>
          <StoryPicker />
          <p className="mt-4 text-[12px] text-[var(--muted)]">
            ⚠️ 樂透為獨立隨機事件，本站僅供參考娛樂，無法提高中獎率、不保證中獎。
          </p>
        </div>
      </section>

      {/* 最新開獎 */}
      <section className="mb-16">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-2xl font-extrabold text-[var(--text)] sm:text-3xl">最新開獎號碼</h2>
          <span className="text-xs text-[var(--muted)]">資料來源：台灣彩券</span>
        </div>
        <LatestDraws />
      </section>

      {/* 樂透新聞 */}
      <section className="mb-16">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-2xl font-extrabold text-[var(--text)] sm:text-3xl">樂透新聞</h2>
          <span className="text-xs text-[var(--muted)]">即時彙整</span>
        </div>
        <LotteryNews />
      </section>

      {/* 常見問題 (FAQ + JSON-LD) */}
      <Faq />
    </div>
  );
}
