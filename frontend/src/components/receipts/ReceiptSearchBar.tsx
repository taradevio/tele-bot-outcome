import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ReceiptSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export const ReceiptSearchBar = ({
  value,
  onChange,
}: ReceiptSearchBarProps) => {
  return (
    <div className="px-4 pb-4">
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search store, item, or amount..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-[#1a2129] border-none pl-10 pr-12 py-5 rounded-xl text-gray-200 placeholder:text-gray-400"
        />
        {value && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 text-gray-300 hover:text-white"
            onClick={() => onChange("")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
