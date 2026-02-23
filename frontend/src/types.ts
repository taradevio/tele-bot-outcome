export interface ReceiptItem {
  id: string;
  name: string;
  qty: number;
  price: number;
  total_price: number;
  category: string;
  created_at: string;
}

interface LowConfidenceFields {
  field: string;
  confidence: number;
  value: string | number | null;
}

export interface UserReceipts {
  id: string;
  store_name: string;
  total_amount: number;
  transaction_date: string;
  status: "PENDING" | "ACTION_REQUIRED" | "VERIFIED";
  low_confidence_fields: LowConfidenceFields[];
  receipt_items: ReceiptItem[];
  edited_fields?: string[];
}

export interface UserData {
  receipts: UserReceipts[];
}

export type PageName = "home" | "receipts" | "stats" | "profile";
