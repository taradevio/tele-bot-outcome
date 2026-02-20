import { useState, useRef, useEffect } from "react";
import type { Receipt, ReceiptItem } from "@/types";
import {
  X,
  ZoomIn,
  ZoomOut,
  Calendar,
  Clock,
  AlertTriangle,
  Plus,
  Trash2,
  Maximize2,
  CheckCircle2,
  Info,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formattedRupiah } from "@/utils/currency"; // Assuming we have this or similar currency formatter

// Custom Input with dark theme styling to match design
const DarkInput = ({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className={`bg-[#0f1419] border border-gray-800 rounded-lg px-3 py-2 text-white w-full focus:outline-none focus:border-blue-500 transition-colors ${className}`}
    {...props}
  />
);

interface ReceiptEditModalProps {
  receipt: Receipt;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedReceipt: Receipt) => void;
}

export const ReceiptEditModal = ({
  receipt,
  isOpen,
  onClose,
  onSave,
}: ReceiptEditModalProps) => {
  const [editedReceipt, setEditedReceipt] = useState<Receipt>(receipt);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showFullImage, setShowFullImage] = useState(false);

  // Initialize state when receipt changes
  useEffect(() => {
    setEditedReceipt(receipt);
  }, [receipt]);

  if (!isOpen) return null;

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.5, 3));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.5, 1));

  const itemsTotal = editedReceipt.receipt_items.reduce(
    (sum, item) => sum + item.total_price,
    0,
  );

  const totalMismatch = Math.abs(itemsTotal - editedReceipt.total_amount) > 100; // Allow small rounding diff

  const handleSave = () => {
    onSave({ ...editedReceipt, status: "verified" });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background animate-in slide-in-from-bottom-full duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-[#0f1419] border-b border-gray-800 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-gray-400 hover:text-white"
        >
          <X className="h-6 w-6" />
        </Button>
        <span className="text-lg font-semibold text-white">Verify Receipt</span>
        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      {/* Main Content - Split or Scrollable */}
      <div className="flex-1 overflow-y-auto bg-[#0b0e11] relative">
        {/* Image Section */}
        <div className="h-[300px] bg-[#1a2129] relative overflow-hidden group shrink-0">
          {/* Mock Receipt Image */}
          <div
            className="w-full h-full flex items-center justify-center cursor-move"
            style={{
              transform: `scale(${zoomLevel}) translate(${panPosition.x}px, ${panPosition.y}px)`,
              transition: isDragging ? "none" : "transform 0.2s ease-out",
            }}
            onMouseDown={(e) => {
              setIsDragging(true);
              setDragStart({
                x: e.clientX - panPosition.x,
                y: e.clientY - panPosition.y,
              });
            }}
            onMouseMove={(e) => {
              if (isDragging) {
                setPanPosition({
                  x: e.clientX - dragStart.x,
                  y: e.clientY - dragStart.y,
                });
              }
            }}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
          >
            <img
              src="https://images.unsplash.com/photo-1596558450268-9c27524ba856?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
              alt="Receipt"
              className="max-w-none w-auto h-auto min-w-[200px] object-contain opacity-80"
            />
            {/* Mock Overlay Box */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-2 border-yellow-500 bg-yellow-500/10 w-48 h-24 rounded pointer-events-none" />
          </div>

          {/* Image Controls */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-2">
            <Button
              size="icon"
              variant="secondary"
              className="bg-gray-800 text-white rounded-full h-10 w-10"
              onClick={handleZoomIn}
            >
              <Plus className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="bg-gray-800 text-white rounded-full h-10 w-10"
              onClick={handleZoomOut}
            >
              <div className="h-0.5 w-4 bg-white" />
            </Button>
          </div>

          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            {/* Simple visual cue for low confidence if needed */}
          </div>
        </div>

        {/* Drag Handle for Bottom Sheet look */}
        <div className="bg-[#0f1419] rounded-t-3xl -mt-6 relative pt-2 px-6 pb-24 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
          <div className="w-12 h-1.5 bg-gray-700 rounded-full mx-auto mb-6" />

          {/* Section: Details */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-blue-600/20 p-1.5 rounded-lg">
                <ReceiptIcon className="h-5 w-5 text-blue-500" />
              </div>
              <h3 className="text-lg font-bold text-white">Details</h3>
            </div>

            <div className="space-y-4">
              {/* Store Name */}
              <div>
                <label className="text-gray-400 text-sm mb-1.5 block">
                  Store Name
                </label>
                <div className="relative">
                  <DarkInput
                    value={editedReceipt.store_name}
                    onChange={(e) =>
                      setEditedReceipt({
                        ...editedReceipt,
                        store_name: e.target.value,
                      })
                    }
                    className="pr-10 border-yellow-600/50" // Highlighting low confidence
                  />
                  <AlertTriangle className="absolute right-3 top-2.5 h-5 w-5 text-yellow-500" />
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />
                  <span className="text-xs text-yellow-500">
                    Low confidence score (65%)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Date */}
                <div>
                  <label className="text-gray-400 text-sm mb-1.5 block">
                    Date
                  </label>
                  <div className="relative">
                    <DarkInput
                      value={new Date(
                        editedReceipt.transaction_date,
                      ).toLocaleDateString()}
                      onChange={() => {}} // Read-only for mock
                      className="pr-10"
                    />
                    <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                  </div>
                </div>

                {/* Time */}
                <div>
                  <label className="text-gray-400 text-sm mb-1.5 block">
                    Time
                  </label>
                  <div className="relative">
                    <DarkInput
                      value={new Date(
                        editedReceipt.transaction_date,
                      ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      onChange={() => {}}
                      className="pr-10"
                    />
                    <Clock className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Total Amount */}
                <div>
                  <label className="text-gray-400 text-sm mb-1.5 block">
                    Total Amount
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-2.5 text-gray-400 font-semibold">
                      $
                    </div>
                    {/* Using $ for styling per design, though app uses Rp */}
                    <DarkInput
                      value={editedReceipt.total_amount}
                      onChange={(e) =>
                        setEditedReceipt({
                          ...editedReceipt,
                          total_amount: Number(e.target.value),
                        })
                      }
                      className="pl-7 text-lg font-semibold bg-blue-900/10 border-blue-500/30 text-blue-100"
                    />
                    <Maximize2 className="absolute right-3 top-3 h-4 w-4 text-blue-500" />
                  </div>
                </div>

                {/* Tax */}
                <div>
                  <label className="text-gray-400 text-sm mb-1.5 block">
                    Tax
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-400">
                      $
                    </span>
                    <DarkInput
                      value={editedReceipt.tax || 0}
                      onChange={(e) =>
                        setEditedReceipt({
                          ...editedReceipt,
                          tax: Number(e.target.value),
                        })
                      }
                      className="pl-6"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-gray-800 my-6" />

          {/* Section: Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="bg-blue-600/20 p-1.5 rounded-lg">
                  <ListChecks className="h-5 w-5 text-blue-500" />
                </div>
                <h3 className="text-lg font-bold text-white">Items</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-400 hover:text-blue-300 gap-1 pr-0"
              >
                <Plus className="h-4 w-4" /> Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {editedReceipt.receipt_items.map((item, idx) => (
                <div key={item.id} className="group">
                  <div className="flex items-end gap-3 mb-2">
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 mb-1 block">
                        Item Name
                      </label>
                      <DarkInput
                        value={item.name}
                        onChange={(e) => {
                          const newItems = [...editedReceipt.receipt_items];
                          newItems[idx].name = e.target.value;
                          setEditedReceipt({
                            ...editedReceipt,
                            receipt_items: newItems,
                          });
                        }}
                        className="rounded-b-none border-b-0 focus:border-b"
                      />
                    </div>
                    <div className="w-24">
                      <label className="text-xs text-gray-500 mb-1 block text-right">
                        Price
                      </label>
                      <div className="relative">
                        <span className="absolute left-2 top-2 text-gray-500 text-sm">
                          $
                        </span>
                        <DarkInput
                          value={item.total_price}
                          onChange={(e) => {
                            const newItems = [...editedReceipt.receipt_items];
                            newItems[idx].total_price = Number(e.target.value);
                            setEditedReceipt({
                              ...editedReceipt,
                              receipt_items: newItems,
                            });
                          }}
                          className="text-right pl-5 rounded-b-none border-b-0"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="w-full h-px bg-gray-800" />
                  {/* Low confidence indicator for specific item */}
                  {idx === 2 && (
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <AlertTriangle className="h-3 w-3 text-yellow-500" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {totalMismatch && (
              <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-between">
                <span className="text-gray-400 text-sm">Sum of items</span>
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold">
                    ${itemsTotal.toLocaleString()}
                  </span>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </div>
              </div>
            )}

            {totalMismatch && (
              <p className="text-xs text-red-400 mt-2 text-right">
                Sum of items does not match Receipt Total ($
                {editedReceipt.total_amount.toLocaleString()})
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 bg-[#0f1419] border-t border-gray-800 shrink-0 mb-4">
        {" "}
        {/* mb-4 for bottom spacing on mobile */}
        <Button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12 text-lg font-semibold mb-4"
          onClick={handleSave}
        >
          <CheckCircle2 className="mr-2 h-5 w-5" />
          Confirm & Save
        </Button>
        <div className="text-center">
          <button className="text-gray-500 text-sm flex items-center justify-center gap-2 mx-auto hover:text-gray-300">
            <AlertTriangle className="h-3 w-3" /> Report OCR Error
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper components not imported
const ReceiptIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z" />
    <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
    <path d="M12 17V7" />
  </svg>
);

const ListChecks = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M10 6h11" />
    <path d="M10 12h11" />
    <path d="M10 18h11" />
    <path d="M4 6h1" />
    <path d="M4 12h1" />
    <path d="M4 18h1" />
  </svg>
);
