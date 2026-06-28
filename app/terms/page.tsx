import type { Metadata } from "next";
import { LegalPage, Section, COMPANY } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "服務條款｜808888.tw",
  description: "808888.tw 樂透統計分析服務條款。",
  alternates: { canonical: "/terms/" },
};

export default function TermsPage() {
  return (
    <LegalPage title="服務條款" updated="2026-06-28">
      <Section heading="一、服務內容">
        <p>
          808888.tw（以下稱本服務）由 {COMPANY.name}（統一編號 {COMPANY.taxId}）提供，內容為台灣彩券公開開獎結果的
          統計分析與抓牌技巧視覺化，包含冷熱號、遺漏值、尾數、區間、拖牌版路、AI 綜合評分等參考資訊。
        </p>
        <p>本服務所有內容僅供娛樂與參考，不構成任何投注建議。</p>
      </Section>

      <Section heading="二、使用資格">
        <p>您須年滿 18 歲始得使用本服務與購買彩券。未滿 18 歲者不得使用付費功能。</p>
      </Section>

      <Section heading="三、會員帳號">
        <p>
          您可透過 LINE 登入建立會員身分。您應妥善保管自己的登入狀態，凡經由您帳號進行的操作，視為您本人所為。
        </p>
      </Section>

      <Section heading="四、訂閱與付款">
        <p>
          本服務分為免費與付費方案。付費方案以信用卡定期定額方式，透過藍新金流（NewebPay）依您選擇的週期自動扣款，
          扣款金額與週期於訂閱頁明確揭示。您可隨時取消續訂，詳見退費政策。
        </p>
      </Section>

      <Section heading="五、重要免責聲明">
        <p>
          樂透每期皆為獨立隨機事件，歷史開獎號碼不影響未來開獎機率。本服務的所有分析與評分，僅是將玩家原本的手算統計
          自動化與視覺化，<strong className="text-[var(--text)]">無法提高中獎率，也不保證任何中獎結果</strong>。
        </p>
        <p>您因使用本服務內容所做的任何投注決定與盈虧，由您自行負責，本服務不負任何賠償責任。</p>
      </Section>

      <Section heading="六、智慧財產權">
        <p>本服務之介面、文字、圖像、分析方法與程式碼，著作權均屬本服務所有，未經同意不得重製、散布或商業使用。</p>
      </Section>

      <Section heading="七、禁止行為">
        <p>您不得以自動化程式大量擷取資料、嘗試破解付費牆、干擾系統運作，或從事任何違反法令的行為。</p>
      </Section>

      <Section heading="八、服務變更與中止">
        <p>本服務得因維護、調整或不可抗力暫停或變更部分功能。若有重大變更，將於站內或以適當方式通知。</p>
      </Section>

      <Section heading="九、準據法與管轄">
        <p>本條款以中華民國法律為準據法。因本服務所生爭議，以台灣高雄地方法院為第一審管轄法院。</p>
      </Section>

      <Section heading="十、營業人資訊">
        <p>營業人名稱：{COMPANY.name}</p>
        <p>統一編號：{COMPANY.taxId}</p>
        <p>負責人：{COMPANY.owner}</p>
        <p>地址：{COMPANY.address}</p>
        <p>
          聯絡電話：{COMPANY.phone}　Email：{COMPANY.email}
        </p>
      </Section>
    </LegalPage>
  );
}
