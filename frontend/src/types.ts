export interface ReceiptItem {
  id: string;
  name: string;
  qty: number;
  price: number;
  total_price: number;
  category: string;
  created_at: string;
  confidence?: number; // 0-1 or 0-100
}

export interface Receipt {
  id: string;
  store_name: string;
  total_amount: number;
  tax?: number;
  transaction_date: string;
  status: "pending" | "action-required" | "verified";
  receipt_items: ReceiptItem[];
  confidence?: number;
  edited_fields?: string[];
  image_url?: string;
}

export type PageName = "home" | "receipts" | "stats" | "profile";
