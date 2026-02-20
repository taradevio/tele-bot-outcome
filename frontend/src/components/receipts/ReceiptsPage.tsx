import { useState, useMemo, useCallback, useEffect } from "react";
import type { Receipt } from "@/types";
import { ReceiptHeader } from "./ReceiptHeader";
import { ReceiptSearchBar } from "./ReceiptSearchBar";
import { ReceiptFilterChips, type FilterType } from "./ReceiptFilterChips";
import { ActionRequiredSection } from "./ActionRequiredSection";
import { RecentActivityList } from "./RecentActivityList";
import { ReceiptEmptyState } from "./ReceiptEmptyState";
import { ReceiptsSkeleton } from "./ReceiptsSkeleton";
import { ReceiptEditModal } from "./ReceiptEditModal";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { Loader2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

// Mock receipt data for development
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
    receipt_items: [
      {
        id: "2a",
        name: "T-Shirt",
        qty: 2,
        price: 45000,
        total_price: 90000,
        category: "Clothing",
        created_at: "2023-10-24T16:30:00.000Z",
      },
      {
        id: "2b",
        name: "Socks Pack",
        qty: 1,
        price: 34500,
        total_price: 34500,
        category: "Clothing",
        created_at: "2023-10-24T16:30:00.000Z",
      },
    ],
  },
  {
    id: "3",
    store_name: "Coffee House",
    total_amount: 64500,
    transaction_date: "2023-10-23T08:15:00.000Z",
    status: "split",
    receipt_items: [
      {
        id: "3a",
        name: "Latte",
        qty: 2,
        price: 25000,
        total_price: 50000,
        category: "Food & Dining",
        created_at: "2023-10-23T08:15:00.000Z",
      },
      {
        id: "3b",
        name: "Croissant",
        qty: 1,
        price: 14500,
        total_price: 14500,
        category: "Food & Dining",
        created_at: "2023-10-23T08:15:00.000Z",
      },
    ],
  },
  {
    id: "4",
    store_name: "Electronics Store",
    total_amount: 2499900,
    transaction_date: "2023-10-20T13:20:00.000Z",
    status: "verified",
    receipt_items: [
      {
        id: "4a",
        name: "USB-C Cable",
        qty: 2,
        price: 75000,
        total_price: 150000,
        category: "Electronics",
        created_at: "2023-10-20T13:20:00.000Z",
      },
      {
        id: "4b",
        name: "Wireless Mouse",
        qty: 1,
        price: 2349900,
        total_price: 2349900,
        category: "Electronics",
        created_at: "2023-10-20T13:20:00.000Z",
      },
    ],
  },
  {
    id: "5",
    store_name: "Grocery Mart",
    total_amount: 87000,
    transaction_date: "2023-10-19T10:00:00.000Z",
    status: "pending",
    receipt_items: [
      {
        id: "5a",
        name: "Milk 1L",
        qty: 2,
        price: 18000,
        total_price: 36000,
        category: "Groceries",
        created_at: "2023-10-19T10:00:00.000Z",
      },
      {
        id: "5b",
        name: "Bread",
        qty: 1,
        price: 15000,
        total_price: 15000,
        category: "Groceries",
        created_at: "2023-10-19T10:00:00.000Z",
      },
      {
        id: "5c",
        name: "Cheese",
        qty: 1,
        price: 36000,
        total_price: 36000,
        category: "Groceries",
        created_at: "2023-10-19T10:00:00.000Z",
      },
    ],
  },
  {
    id: "6",
    store_name: "Coffee House",
    total_amount: 38000,
    transaction_date: "2023-10-18T14:45:00.000Z",
    status: "pending",
    receipt_items: [
      {
        id: "6a",
        name: "Cappuccino",
        qty: 1,
        price: 28000,
        total_price: 28000,
        category: "Food & Dining",
        created_at: "2023-10-18T14:45:00.000Z",
      },
      {
        id: "6b",
        name: "Cookie",
        qty: 1,
        price: 10000,
        total_price: 10000,
        category: "Food & Dining",
        created_at: "2023-10-18T14:45:00.000Z",
      },
    ],
  },
];

export const ReceiptsPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType | null>(null);
  const [filterValues, setFilterValues] = useState<{
    date: string | null;
    store: string | null;
    status: string | null;
  }>({ date: null, store: null, status: null });

  // Data state
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  // Edit Modal State
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Simulate initial fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      setReceipts(mockReceipts);
      setIsLoading(false);
    }, 1500); // 1.5s delay to show skeleton
    return () => clearTimeout(timer);
  }, []);

  // Pull to refresh handler
  const handleRefresh = async () => {
    // Simulate network request
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setReceipts(mockReceipts); // Refresh data
  };

  const { contentRef, pullY, isRefreshing, handlers } =
    usePullToRefresh(handleRefresh);

  // Extract unique store names for filter
  const availableStores = useMemo(() => {
    const stores = [...new Set(receipts.map((r) => r.store_name))];
    return stores.sort();
  }, [receipts]);

  // Filter receipts
  const filteredReceipts = useMemo(() => {
    return receipts.filter((receipt) => {
      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesStore = receipt.store_name.toLowerCase().includes(q);
        const matchesAmount = receipt.total_amount.toString().includes(q);
        const matchesItem = receipt.receipt_items.some((item) =>
          item.name.toLowerCase().includes(q),
        );
        if (!matchesStore && !matchesAmount && !matchesItem) return false;
      }

      // Status filter
      if (filterValues.status) {
        if ((receipt.status || "verified") !== filterValues.status)
          return false;
      }

      // Store filter
      if (filterValues.store) {
        if (receipt.store_name !== filterValues.store) return false;
      }

      // Date filter
      if (filterValues.date) {
        const receiptDate = new Date(receipt.transaction_date);
        const now = new Date();

        switch (filterValues.date) {
          case "today":
            if (receiptDate.toDateString() !== now.toDateString()) return false;
            break;
          case "week": {
            const weekAgo = new Date(now);
            weekAgo.setDate(weekAgo.getDate() - 7);
            if (receiptDate < weekAgo) return false;
            break;
          }
          case "month": {
            if (
              receiptDate.getMonth() !== now.getMonth() ||
              receiptDate.getFullYear() !== now.getFullYear()
            )
              return false;
            break;
          }
        }
      }

      return true;
    });
  }, [receipts, searchQuery, filterValues]);

  // Separate action-required (pending) from recent activity
  const actionRequiredReceipts = useMemo(
    () => filteredReceipts.filter((r) => r.status === "pending"),
    [filteredReceipts],
  );

  const recentReceipts = filteredReceipts;

  const hasAnyReceipts = receipts.length > 0;
  const hasFilteredResults = filteredReceipts.length > 0;

  const handleFilterToggle = useCallback((filter: FilterType) => {
    setActiveFilter((prev) => (prev === filter ? null : filter));
  }, []);

  const handleFilterSelect = useCallback(
    (filter: FilterType, value: string | null) => {
      setFilterValues((prev) => ({ ...prev, [filter]: value }));
      setActiveFilter(null);
    },
    [],
  );

  const handleReviewReceipt = useCallback((receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setIsEditModalOpen(true);
  }, []);

  const handleSaveReceipt = useCallback((updatedReceipt: Receipt) => {
    setReceipts((prev) =>
      prev.map((r) => (r.id === updatedReceipt.id ? updatedReceipt : r)),
    );
    // Here you would also call API to update backend
  }, []);

  const handleViewAllActionRequired = () => {
    // Navigate to dedicated page
    navigate({ to: "/receipts/action-required" });
  };

  if (isLoading) {
    return <ReceiptsSkeleton />;
  }

  return (
    <div
      ref={contentRef}
      className="pb-24 min-h-screen relative"
      onClick={() => {
        // Close filter dropdowns when clicking outside
        if (activeFilter) setActiveFilter(null);
      }}
      // Attach touch handlers for pull-to-refresh
      onTouchStart={handlers.onTouchStart}
      onTouchMove={handlers.onTouchMove}
      onTouchEnd={handlers.onTouchEnd}
    >
      {/* Pull to refresh indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center pointer-events-none transition-transform duration-200"
        style={{
          height: "60px",
          transform: `translateY(${pullY - 60}px)`,
          opacity: Math.min(pullY / 40, 1),
        }}
      >
        {isRefreshing ? (
          <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
        ) : (
          <div className="h-1.5 w-12 bg-gray-700 rounded-full opacity-50" /> // subtle indicator
        )}
      </div>

      <div
        style={{
          transform: `translateY(${pullY > 0 ? pullY * 0.4 : 0}px)`,
          transition: isRefreshing ? "transform 0.2s" : "none",
        }}
      >
        <ReceiptHeader />
        <ReceiptSearchBar value={searchQuery} onChange={setSearchQuery} />
        <div onClick={(e) => e.stopPropagation()}>
          <ReceiptFilterChips
            activeFilter={activeFilter}
            onFilterToggle={handleFilterToggle}
            filterValues={filterValues}
            availableStores={availableStores}
            onFilterSelect={handleFilterSelect}
          />
        </div>

        {!hasAnyReceipts ? (
          <ReceiptEmptyState type="no-receipts" />
        ) : !hasFilteredResults ? (
          <ReceiptEmptyState type="no-results" />
        ) : (
          <>
            <ActionRequiredSection
              receipts={actionRequiredReceipts}
              onViewAll={handleViewAllActionRequired}
              onReviewReceipt={handleReviewReceipt}
            />
            <RecentActivityList
              receipts={recentReceipts}
              onReceiptClick={handleReviewReceipt}
            />
          </>
        )}
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
