// 藍新金流 NewebPay 定期定額（MPG / Period）整合 — Phase D 實作。
// RC 已申請藍新商店帳號（無實務串接經驗，屆時帶著做）。
//
// 藍新與綠界做法不同：請求資料要先用「HashKey/HashIV 做 AES-256-CBC 加密」成 TradeInfo，
// 再用「SHA256(HashKey=...&TradeInfo=...&HashIV=...)」算 TradeSha 一起送出。
// 回傳同樣是 AES 加密，需解密驗證。
//
// 這裡先放介面與 stub，等 Phase D 填入真實加解密與欄位。
import { config, ecpayConfigured as paymentConfigured } from "../config.js";

export interface SubscriptionCheckout {
  action: string;
  fields: Record<string, string>;
  stub?: boolean;
}

/** 建立定期定額付款表單（Phase D 實作藍新 AES 加密）。 */
export function createSubscriptionCheckout(input: {
  orderNo: string;
  amount: number;
  itemName: string;
  email: string;
  periodType?: "D" | "W" | "M" | "Y";
  returnUrl: string;
  notifyUrl: string;
}): SubscriptionCheckout {
  if (!paymentConfigured()) {
    return {
      action: "#newebpay-not-configured",
      stub: true,
      fields: {
        _note: "藍新憑證未設定（NEWEBPAY_MERCHANT_ID/HASH_KEY/HASH_IV）。Phase D 實作 AES 加密表單。",
        MerchantOrderNo: input.orderNo,
        Amt: String(input.amount),
        ItemDesc: input.itemName,
      },
    };
  }
  // TODO Phase D：組 PostData_ → AES-256-CBC 加密成 TradeInfo → SHA256 算 TradeSha
  return {
    action: config.pay.apiUrl,
    fields: {
      MerchantID_: config.pay.merchantId,
      TradeInfo: "TODO_AES_ENCRYPTED",
      TradeSha: "TODO_SHA256",
      Version: "1.5",
    },
  };
}

/** 驗證藍新回呼（Phase D：解密 TradeInfo + 比對 TradeSha）。 */
export function verifyCallback(_params: Record<string, string>): boolean {
  return false; // Phase D 實作
}
