import type { Metadata } from "next";
import { LegalPage, Section, COMPANY } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "退費政策｜808888.tw",
  description: "808888.tw 訂閱方案的取消與退費說明。",
  alternates: { canonical: "/refund/" },
};

export default function RefundPage() {
  return (
    <LegalPage title="退費政策" updated="2026-06-28">
      <Section heading="一、訂閱與扣款方式">
        <p>
          付費方案採信用卡定期定額，透過藍新金流依您選擇的週期（例如每月）自動扣款，每期金額與週期於訂閱頁清楚揭示。
          首期於您完成刷卡授權時起算。
        </p>
      </Section>

      <Section heading="二、取消續訂">
        <p>
          您可隨時於會員專區或來信申請取消訂閱。取消後，系統將停止下一期扣款，您已開通的當期權益持續到該期到期日為止，
          到期後自動轉為免費會員。
        </p>
      </Section>

      <Section heading="三、數位服務鑑賞期說明">
        <p>
          本服務屬於「以數位方式即時提供、一經開通即為完成」的線上服務。依消費者保護法及其施行細則相關規定，此類服務
          於您完成訂閱並同意後即時提供，<strong className="text-[var(--text)]">不適用七日猶豫期</strong>。您完成付款即表示
          已了解並同意此條件。
        </p>
      </Section>

      <Section heading="四、退費處理">
        <p>
          若因本服務發生重大技術故障，導致您於已扣款期間實質無法使用主要付費功能，您可於該情形發生後 7 日內提出退費申請，
          我們將核實後就無法提供服務之期間按比例退還。
        </p>
        <p>非屬上述情形（例如個人不再需要、未中獎、改變心意等），已扣款之當期費用恕不退還，但您仍可取消後續扣款。</p>
      </Section>

      <Section heading="五、聯絡我們">
        <p>
          退費或取消訂閱請聯絡：{COMPANY.email}　或致電 {COMPANY.phone}。請提供您的登入名稱與訂單編號，以利為您處理。
        </p>
        <p>
          營業人：{COMPANY.name}（統一編號 {COMPANY.taxId}）
        </p>
      </Section>
    </LegalPage>
  );
}
