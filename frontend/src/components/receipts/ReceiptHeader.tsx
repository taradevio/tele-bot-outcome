import { ArrowLeft } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

interface ReceiptHeaderProps {
  title?: string;
}

export const ReceiptHeader = ({
  title = "My Receipts",
}: ReceiptHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center relative px-4 pt-6 pb-4">
      <button
        onClick={() => navigate({ to: "/" })}
        className="absolute left-4 text-white hover:text-gray-300 transition-colors"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      <h1 className="text-lg font-semibold">{title}</h1>
    </div>
  );
};
