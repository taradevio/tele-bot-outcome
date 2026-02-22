import type { Receipt } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// import { Progress } from "@/components/ui/progress";
import { formattedRupiah } from "@/utils/currency";
import { ShoppingBag } from "lucide-react";

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
        <h2 className="text-lg font-bold text-white">
          Action Required ({receipts.length})
        </h2>
        <button
          onClick={onViewAll}
          className="text-sm text-blue-500 hover:text-blue-400 transition-colors font-medium"
        >
          View all
        </button>
      </div>

      {/* Stacked Cards Layout */}
      <div className="relative h-45 w-full mt-2">
        {receipts.slice(0, 3).map((receipt, index) => {
          // Bottom card has index 2 (if 3 items), Top card has index 0
          // const reversedIndex = receipts.slice(0, 3).length - 1 - index;
          const displayIndex = index;

          return (
            <ActionRequiredCard
              key={receipt.id}
              receipt={receipt}
              onReview={() => onReviewReceipt(receipt)}
              style={{
                zIndex: 30 - displayIndex,
                transform: `translateY(${displayIndex * 12}px) scale(${1 - displayIndex * 0.05})`,
                opacity: 1 - displayIndex * 0.1,
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

interface ActionRequiredCardProps {
  receipt: Receipt;
  onReview: () => void;
  style?: React.CSSProperties;
}

const ActionRequiredCard = ({
  receipt,
  onReview,
  style,
}: ActionRequiredCardProps) => {
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
    <Card
      className="bg-[#1a2129] border border-gray-800/50 rounded-[24px] text-white shadow-2xl transition-all duration-300"
      style={style}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-[#252a31] rounded-xl flex items-center justify-center shrink-0">
              <div className="text-gray-400">
                <ShoppingBag className="h-6 w-6" />
                <div className="absolute bottom-0 right-0 transform translate-x-1/4 translate-y-1/4">
                  {/* small receipt mini icon if needed */}
                </div>
              </div>
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
