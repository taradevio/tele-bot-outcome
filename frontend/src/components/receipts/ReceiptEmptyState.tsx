import { Receipt as ReceiptIcon, SearchX } from "lucide-react";

interface ReceiptEmptyStateProps {
  type?: "no-receipts" | "no-results";
}

export const ReceiptEmptyState = ({
  type = "no-receipts",
}: ReceiptEmptyStateProps) => {
  const isNoResults = type === "no-results";

  return (
    <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
      <div className="h-20 w-20 bg-[#1a2129] rounded-2xl flex items-center justify-center mb-6">
        {isNoResults ? (
          <SearchX className="h-10 w-10 text-gray-500" />
        ) : (
          <ReceiptIcon className="h-10 w-10 text-gray-500" />
        )}
      </div>
      <h3 className="text-lg font-semibold text-gray-200 mb-2">
        {isNoResults ? "No receipts found" : "No receipts yet"}
      </h3>
      <p className="text-sm text-gray-400 max-w-65">
        {isNoResults
          ? "Try adjusting your search or filters to find what you're looking for."
          : "Upload a receipt photo via the Telegram bot and it will appear here for review."}
      </p>
    </div>
  );
};
