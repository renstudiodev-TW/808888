import type { Metadata } from "next";
import { LegalPage, Section, COMPANY } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "隱私權政策｜808888.tw",
  description: "808888.tw 如何蒐集、利用與保護您的個人資料。",
  alternates: { canonical: "/privacy/" },
};

export default function PrivacyPage() {
  return (
    <LegalPage title="隱私權政策" updated="2026-06-28">
      <Section heading="一、我們蒐集的資料">
        <p>當您使用本服務時，我們可能蒐集以下資料：</p>
        <p>1. LINE 登入提供的顯示名稱、頭像與電子信箱。</p>
        <p>2. 訂閱方案、扣款與交易紀錄（信用卡完整卡號由藍新金流處理，本服務不留存）。</p>
        <p>3. 服務使用紀錄，例如登入時間與瀏覽頁面，用於改善服務。</p>
      </Section>

      <Section heading="二、利用目的">
        <p>您的資料用於會員身分識別、報牌與通知推播、金流付款處理、客戶服務與服務品質改善。</p>
      </Section>

      <Section heading="三、第三方服務">
        <p>為提供服務，我們會將必要資料交付下列合作方處理：</p>
        <p>1. 藍新金流（NewebPay）：處理信用卡定期定額付款。</p>
        <p>2. LINE：提供會員登入與訊息推播。</p>
        <p>我們不會將您的個人資料出售或出租給第三方。</p>
      </Section>

      <Section heading="四、資料保護">
        <p>我們以合理的技術與管理措施保護您的資料，付款連線採加密傳輸，並僅在達成上述目的之必要範圍內保存。</p>
      </Section>

      <Section heading="五、您的權利">
        <p>依個人資料保護法，您可向我們查詢、閱覽、複製、補充或更正您的個人資料，或請求停止利用與刪除。</p>
      </Section>

      <Section heading="六、Cookie 與登入狀態">
        <p>本服務使用必要的 Cookie 或同等技術維持您的登入狀態，您可於瀏覽器停用，但可能影響部分功能。</p>
      </Section>

      <Section heading="七、政策修訂">
        <p>本政策如有修訂，將於本頁更新並標示最後更新日期。</p>
      </Section>

      <Section heading="八、聯絡方式">
        <p>
          如對個資處理有任何疑問，請聯絡 {COMPANY.name}：{COMPANY.email}　{COMPANY.phone}。
        </p>
      </Section>
    </LegalPage>
  );
}
