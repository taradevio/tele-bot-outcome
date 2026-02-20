import type { Receipt } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formattedRupiah } from "@/utils/currency";
import {
  ShoppingBag,
  Coffee,
  Monitor,
  ShoppingCart,
  Store,
} from "lucide-react";

interface RecentActivityListProps {
  receipts: Receipt[];
  onReceiptClick?: (receipt: Receipt) => void;
}

const storeIcons: Record<string, { icon: typeof ShoppingBag; color: string }> =
  {
    default: { icon: Store, color: "bg-gray-600" },
  };

const iconPool = [
  { icon: ShoppingBag, color: "bg-red-500/80" },
  { icon: Coffee, color: "bg-amber-600/80" },
  { icon: Monitor, color: "bg-blue-500/80" },
  { icon: ShoppingCart, color: "bg-green-500/80" },
];

function getStoreIcon(storeName: string) {
  if (storeIcons[storeName]) return storeIcons[storeName];
  // Deterministic icon based on store name hash
  const hash = storeName
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const entry = iconPool[hash % iconPool.length];
  storeIcons[storeName] = entry;
  return entry;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  verified: {
    label: "VERIFIED",
    className: "bg-green-500/20 text-green-400 border-green-500/30",
  },
  split: {
    label: "SPLIT",
    className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  },
  pending: {
    label: "PENDING",
    className: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  },
};

export const RecentActivityList = ({
  receipts,
  onReceiptClick,
}: RecentActivityListProps) => {
  if (receipts.length === 0) return null;

  return (
    <div className="px-4 pb-4">
      <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
      <div className="space-y-3">
        {receipts.map((receipt) => {
          const date = new Date(receipt.transaction_date);
          const dateLabel = date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
          const timeLabel = date.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });

          const status = receipt.status || "verified";
          const statusInfo = statusConfig[status] || statusConfig.verified;
          const { icon: StoreIcon, color } = getStoreIcon(receipt.store_name);

          return (
            <Card
              key={receipt.id}
              className="bg-[#1a2129] border-none rounded-xl text-white cursor-pointer hover:bg-[#1e2730] transition-colors"
              onClick={() => onReceiptClick?.(receipt)}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`h-11 w-11 ${color} rounded-xl flex items-center justify-center shrink-0`}
                  >
                    <StoreIcon className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{receipt.store_name}</p>
                    <p className="text-sm text-gray-400">
                      {dateLabel} • {timeLabel}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0 ml-3">
                  <p className="font-semibold">
                    {formattedRupiah(receipt.total_amount)}
                  </p>
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-2 py-0 mt-1 rounded-full ${statusInfo.className}`}
                  >
                    <span className="mr-1">●</span>
                    {statusInfo.label}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
