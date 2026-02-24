import type { ReceiptItem } from "@/types";


export const calculateTotal = (item: ReceiptItem): number => {
  const subtotal = item.qty * item.price;
  
  const discountAmount = item.discount_type === "percentage"
    ? subtotal * (item.discount_value ?? 0) / 100
    : (item.discount_value ?? 0);
  
  const voucherAmount = item.voucher_amount ?? 0;
  
  return subtotal - discountAmount - voucherAmount;
};