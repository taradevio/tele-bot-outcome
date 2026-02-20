import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecentActivityList } from "./RecentActivityList";
import type { Receipt } from "@/types";
import { useMemo, useState, useCallback } from "react";
import { ReceiptEditModal } from "./ReceiptEditModal";

// Mock data (same as ReceiptsPage)
const mockReceipts: Receipt[] = [
  {
    id: "1",
    store_name: "Grocery Mart",
    total_amount: 45200,
    transaction_date: new Date().toISOString(),
    status: "pending",
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
    id: "2",
    store_name: "Retail Center",
    total_amount: 124500,
    transaction_date: "2023-10-24T16:30:00.000Z",
    status: "verified",
    receipt_items: [],
  },
  {
    id: "3",
    store_name: "Coffee House",
    total_amount: 64500,
    transaction_date: "2023-10-23T08:15:00.000Z",
    status: "split",
    receipt_items: [],
  },
  {
    id: "5",
    store_name: "Grocery Mart",
    total_amount: 87000,
    transaction_date: "2023-10-19T10:00:00.000Z",
    status: "pending",
    receipt_items: [],
  },
  {
    id: "6",
    store_name: "Coffee House",
    total_amount: 38000,
    transaction_date: "2023-10-18T14:45:00.000Z",
    status: "pending",
    receipt_items: [],
  },
];

export const ActionRequiredPage = () => {
  const navigate = useNavigate();
  const [receipts, setReceipts] = useState<Receipt[]>(mockReceipts);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const pendingReceipts = useMemo(
    () => receipts.filter((r) => r.status === "pending"),
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
    <div className="pb-24 min-h-screen bg-background">
      {/* Header */}
      <div className="py-6 px-4 flex items-center gap-4 sticky top-0 bg-background/95 backdrop-blur z-10 border-b border-border/50">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="hover:bg-accent hover:text-white"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-bold bg-linear-to-r from-white to-gray-400 bg-clip-text text-transparent">
          Action Required
        </h1>
      </div>

      <div className="p-4">
        <p className="text-gray-400 mb-4 text-sm">
          {pendingReceipts.length} receipts require your review
        </p>

        <RecentActivityList
          receipts={pendingReceipts}
          onReceiptClick={handleReviewReceipt}
        />
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
