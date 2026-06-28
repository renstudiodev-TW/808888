// 首頁常見問題（FAQ）。兼顧:①關鍵字長尾內容利於 SEO ②FAQPage JSON-LD 可上 Google 常見問題 rich result。
// 答案誠實，符合「不保證中獎」原則。

const FAQ: { q: string; a: string }[] = [
  {
    q: "808888.tw 是什麼？",
    a: "808888.tw 是用 AI 統計把台灣樂透（今彩539、大樂透、威力彩）的民間抓牌技巧自動化的分析網站，提供冷熱號、遺漏值、尾數、區間、拖牌、和值走勢等指標與每日報牌參考。僅供參考娛樂，無法提高中獎率、不保證中獎。",
  },
  {
    q: "冷熱號是怎麼判斷的？",
    a: "我們用近 50 期的出現次數計算 z-score（標準分數）：出現次數明顯高於期望值的號碼判為熱號、明顯低於的判為冷號。這只是把玩家手算的統計自動化呈現，不代表未來開獎機率。",
  },
  {
    q: "遺漏值是什麼意思？",
    a: "遺漏值是某號碼距離上次開出已經過了幾期。當前遺漏除以平均遺漏即「遺漏比」，是不少玩家用來判斷號碼是否「該回補」的參考訊號。樂透為獨立隨機事件，遺漏值不影響開獎機率。",
  },
  {
    q: "AI 選號會中獎嗎？",
    a: "不會保證中獎。樂透每期都是獨立隨機事件，歷史號碼不影響未來開獎。本站的 AI 綜合評分只是把多個統計指標加權整合，方便比較參考，無法提高中獎率。請理性購彩。",
  },
  {
    q: "今彩539、大樂透、威力彩的開獎時間？",
    a: "今彩539 每週一至週六開獎；大樂透每週二、週五開獎；威力彩每週一、週四開獎（以台灣彩券官方公告為準）。本站開獎號碼會自動同步台灣彩券公開結果。",
  },
  {
    q: "報牌跟分析是免費的嗎？",
    a: "冷熱、遺漏、尾數、區間、和值走勢等完整統計與每日中機率參考號免費看；AI 高機率精選號、拖牌版路、每日 LINE 報牌推播等進階功能為付費訂閱。",
  },
];

export function Faq() {
  return (
    <section className="mb-16">
      <h2 className="mb-4 font-display text-2xl font-extrabold text-[var(--text)] sm:text-3xl">常見問題</h2>
      <div className="space-y-3">
        {FAQ.map((f) => (
          <details key={f.q} className="glass group p-4">
            <summary className="cursor-pointer list-none font-display font-bold text-[var(--text)] marker:hidden">
              <span className="text-[var(--neon)]">Q.</span> {f.q}
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{f.a}</p>
          </details>
        ))}
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        }}
      />
    </section>
  );
}
