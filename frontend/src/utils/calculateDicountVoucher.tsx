import type { ReceiptItem } from "@/types";

export const calculateItemSubtotal = (item: ReceiptItem): number => {
  return item.qty * item.price;
};

export const calculateItemDiscount = (item: ReceiptItem): number => {
  const subtotal = calculateItemSubtotal(item);
  return item.discount_type === "percentage"
    ? (subtotal * (item.discount_value ?? 0)) / 100
    : (item.discount_value ?? 0);
};

export const calculateItemVoucher = (item: ReceiptItem): number => {
  return item.voucher_amount ?? 0;
};

export const calculateTotal = (item: ReceiptItem): number => {
  const subtotal = calculateItemSubtotal(item);
  const discountAmount = calculateItemDiscount(item);
  const voucherAmount = calculateItemVoucher(item);

  return subtotal - discountAmount - voucherAmount;
};

export const calculateReceiptSummary = (items: ReceiptItem[]) => {
  return items.reduce(
    (acc, item) => {
      const subtotal = calculateItemSubtotal(item);
      const discount = calculateItemDiscount(item);
      const voucher = calculateItemVoucher(item);

      return {
        subtotal: acc.subtotal + subtotal,
        discount: acc.discount + discount,
        voucher: acc.voucher + voucher,
        total: acc.total + (subtotal - discount - voucher),
      };
    },
    { subtotal: 0, discount: 0, voucher: 0, total: 0 },
  );
};
