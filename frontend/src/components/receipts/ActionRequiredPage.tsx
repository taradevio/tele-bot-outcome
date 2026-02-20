import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Receipt } from "@/types";
import { useMemo, useState, useCallback } from "react";
import { ReceiptEditModal } from "./ReceiptEditModal";
import { Card, CardContent } from "@/components/ui/card";
import { formattedRupiah } from "@/utils/currency";

// Mock data (shared with ReceiptsPage)
const mockReceipts: Receipt[] = [
  {
    id: "1",
    store_name: "Grocery Mart",
    total_amount: 45200,
    transaction_date: new Date().toISOString(),
    status: "action-required",
    confidence: 0.65,
    tax: 3500,
    receipt_items: [
      {
        id: "1a",
        name: "Rice 5kg",
        qty: 1,
        price: 15000,
        total_price: 15000,
        category: "Groceries",
        created_at: new Date().toISOString(),
      },
      {
        id: "1b",
        name: "Cooking Oil",
        qty: 2,
        price: 8000,
        total_price: 16000,
        category: "Groceries",
        created_at: new Date().toISOString(),
      },
      {
        id: "1c",
        name: "Eggs",
        qty: 1,
        price: 14200,
        total_price: 14200,
        category: "Groceries",
        created_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: "11",
    store_name: "Supermarket Plus",
    total_amount: 89000,
    transaction_date: new Date().toISOString(),
    status: "action-required",
    confidence: 0.45,
    receipt_items: [],
  },
];

export const ActionRequiredPage = () => {
  const navigate = useNavigate();
  const [receipts, setReceipts] = useState<Receipt[]>(mockReceipts);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const actionRequiredReceipts = useMemo(
    () => receipts.filter((r) => r.status === "action-required"),
    [receipts],
  );

  const handleBack = () => {
    navigate({ to: "/receipts" });
  };

  const handleReviewReceipt = useCallback((receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setIsEditModalOpen(true);
  }, []);

  const handleSaveReceipt = useCallback((updatedReceipt: Receipt) => {
    setReceipts((prev) =>
      prev.map((r) => (r.id === updatedReceipt.id ? updatedReceipt : r)),
    );
  }, []);

  return (
    <div className="pb-24 min-h-screen bg-[#0b0e11] text-white">
      {/* Header */}
      <div className="py-6 px-4 flex items-center gap-4 sticky top-0 bg-[#0b0e11]/80 backdrop-blur-md z-10 border-b border-gray-800/50">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="text-white hover:bg-white/10 p-0 h-10 w-10 shrink-0"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-black bg-linear-to-r from-white to-gray-400 bg-clip-text text-transparent">
          Action Required
        </h1>
      </div>

      <div className="p-4">
        <p className="text-gray-500 font-bold text-sm mb-6 px-1">
          {actionRequiredReceipts.length} RECEIPTS REQUIRE YOUR REVIEW
        </p>

        <div className="space-y-4">
          {actionRequiredReceipts.map((receipt) => (
            <ActionRequiredListItem
              key={receipt.id}
              receipt={receipt}
              onReview={() => handleReviewReceipt(receipt)}
            />
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      {selectedReceipt && (
        <ReceiptEditModal
          receipt={selectedReceipt}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveReceipt}
        />
      )}
    </div>
  );
};

interface ActionRequiredListItemProps {
  receipt: Receipt;
  onReview: () => void;
}

const ActionRequiredListItem = ({
  receipt,
  onReview,
}: ActionRequiredListItemProps) => {
  const date = new Date(receipt.transaction_date);
  const dateLabel = "Today"; // Simple for mock
  const timeLabel = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <Card className="bg-[#1a2129] border border-gray-800/50 rounded-[24px] text-white overflow-hidden shadow-xl">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-12 w-12 bg-[#252a31] rounded-xl flex items-center justify-center shrink-0">
              <ShoppingBag className="h-6 w-6 text-gray-400" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-base truncate">
                {receipt.store_name}
              </p>
              <p className="text-xs text-gray-400">
                {dateLabel} • {timeLabel}
              </p>
            </div>
          </div>
          <Button
            onClick={onReview}
            variant="ghost"
            className="text-blue-500 hover:text-blue-400 hover:bg-blue-500/10 font-bold p-0 h-auto"
          >
            Verify Now
          </Button>
        </div>

        <div className="flex items-baseline gap-1 mb-5">
          <span className="text-2xl font-black text-white">
            {formattedRupiah(receipt.total_amount)}
          </span>
          <span className="text-sm text-gray-500 font-medium">(Est)</span>
        </div>

        <div className="space-y-2">
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-500 rounded-full"
              style={{ width: `${(receipt.confidence || 0.65) * 100}%` }}
            />
          </div>
          <div className="flex justify-end">
            <span className="text-xs font-bold text-yellow-500">
              Confirm Total
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
