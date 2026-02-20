import type { Receipt } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formattedRupiah } from "@/utils/currency";
import { Receipt as ReceiptIcon } from "lucide-react";

interface ActionRequiredSectionProps {
  receipts: Receipt[];
  onViewAll: () => void;
  onReviewReceipt: (receipt: Receipt) => void;
}

export const ActionRequiredSection = ({
  receipts,
  onViewAll,
  onReviewReceipt,
}: ActionRequiredSectionProps) => {
  if (receipts.length === 0) return null;

  return (
    <div className="px-4 pb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Action Required</h2>
        <button
          onClick={onViewAll}
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          View all ({receipts.length})
        </button>
      </div>

      {/* Horizontal Scroll Cards */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {receipts.map((receipt) => (
          <ActionRequiredCard
            key={receipt.id}
            receipt={receipt}
            onReview={() => onReviewReceipt(receipt)}
          />
        ))}
      </div>
    </div>
  );
};

interface ActionRequiredCardProps {
  receipt: Receipt;
  onReview: () => void;
}

const ActionRequiredCard = ({ receipt, onReview }: ActionRequiredCardProps) => {
  const date = new Date(receipt.transaction_date);
  const isToday = new Date().toDateString() === date.toDateString();
  const dateLabel = isToday
    ? "Today"
    : date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
  const timeLabel = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <Card className="bg-[#1a2129] border-none rounded-2xl min-w-[280px] max-w-[280px] shrink-0 text-white">
      <CardContent className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="h-10 w-10 bg-gray-700 rounded-xl flex items-center justify-center shrink-0">
            <ReceiptIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="min-w-0">
            <p className="font-medium truncate">{receipt.store_name}</p>
            <p className="text-xs text-gray-400">
              {dateLabel} • {timeLabel}
            </p>
          </div>
        </div>

        <p className="text-xl font-bold mb-3">
          {formattedRupiah(receipt.total_amount)}{" "}
          <span className="text-xs text-gray-400 font-normal">(Est)</span>
        </p>

        <div className="mb-3">
          <Progress value={75} className="h-1.5 bg-gray-700" />
          <p className="text-xs text-yellow-500 mt-1 text-right">
            Action Required
          </p>
        </div>

        <Button
          onClick={onReview}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5"
        >
          Review Receipt
        </Button>
      </CardContent>
    </Card>
  );
};
