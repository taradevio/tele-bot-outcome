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
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { getToken } from "@/lib/auth";

const queryClient = new QueryClient();
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

interface LowConfidenceFields {
  field: string;
  confidence: number;
  value: string | number | null;
}
interface ReceiptItem {
  id: string;
  name: string;
  qty: number;
  price: number;
  total_price: number;
  category: string;
  created_at: string;
}
interface UserReceipts {
  id: string;
  store_name: string;
  total_amount: number;
  transaction_date: string;
  status: "pending" | "action-required" | "verified";
  low_confidence_fields: LowConfidenceFields[];
  receipt_items: ReceiptItem[];
}
interface UserData {
  receipts: UserReceipts[];
}

// Mock receipt data for development
// const mockReceipts: Receipt[] = [
//   {
//     id: "1",
//     store_name: "Grocery Mart",
//     total_amount: 45200,
//     transaction_date: new Date().toISOString(),
//     status: "action-required",
//     confidence: 0.65,
//     tax: 3500,
//     receipt_items: [
//       {
//         id: "1a",
//         name: "Rice 5kg",
//         qty: 1,
//         price: 15000,
//         total_price: 15000,
//         category: "Groceries",
//         created_at: new Date().toISOString(),
//       },
//       {
//         id: "1b",
//         name: "Cooking Oil",
//         qty: 2,
//         price: 8000,
//         total_price: 16000,
//         category: "Groceries",
//         created_at: new Date().toISOString(),
//       },
//       {
//         id: "1c",
//         name: "Eggs",
//         qty: 1,
//         price: 14200,
//         total_price: 14200,
//         category: "Groceries",
//         created_at: new Date().toISOString(),
//       },
//     ],
//   },
//   {
//     id: "10",
//     store_name: "Unidentified Store",
//     total_amount: 15000,
//     transaction_date: new Date().toISOString(),
//     status: "pending",
//     receipt_items: [],
//   },
//   {
//     id: "2",
//     store_name: "Retail Center",
//     total_amount: 124500,
//     transaction_date: "2023-10-24T16:30:00.000Z",
//     status: "verified",
//     receipt_items: [
//       {
//         id: "2a",
//         name: "T-Shirt",
//         qty: 2,
//         price: 45000,
//         total_price: 90000,
//         category: "Clothing",
//         created_at: "2023-10-24T16:30:00.000Z",
//       },
//       {
//         id: "2b",
//         name: "Socks Pack",
//         qty: 1,
//         price: 34500,
//         total_price: 34500,
//         category: "Clothing",
//         created_at: "2023-10-24T16:30:00.000Z",
//       },
//     ],
//   },
//   {
//     id: "3",
//     store_name: "Coffee House",
//     total_amount: 64500,
//     transaction_date: "2023-10-23T08:15:00.000Z",
//     status: "verified",
//     receipt_items: [
//       {
//         id: "3a",
//         name: "Latte",
//         qty: 2,
//         price: 25000,
//         total_price: 50000,
//         category: "Food & Dining",
//         created_at: "2023-10-23T08:15:00.000Z",
//       },
//       {
//         id: "3b",
//         name: "Croissant",
//         qty: 1,
//         price: 14500,
//         total_price: 14500,
//         category: "Food & Dining",
//         created_at: "2023-10-23T08:15:00.000Z",
//       },
//     ],
//   },
// ];

export const ReceiptsPage = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Receipts />
    </QueryClientProvider>
  );
};

const Receipts = () => {
  const navigate = useNavigate();
  // const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType | null>(null);
  const [filterValues, setFilterValues] = useState<{
    date: string | null;
    store: string | null;
    status: string | null;
  }>({ date: null, store: null, status: null });

  // Data state with localStorage persistence
  // const [receipts, setReceipts] = useState<Receipt[]>(() => {
  //   const saved = localStorage.getItem("mock_receipts");
  //   return saved ? JSON.parse(saved) : [];
  // });

  // Edit Modal State
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Initial fetch/sync
  // useEffect(() => {
  //   const saved = localStorage.getItem("mock_receipts");
  //   if (!saved || JSON.parse(saved).length === 0) {
  //     setReceipts(mockReceipts);
  //   }
  //   const timer = setTimeout(() => setIsLoading(false), 1000);
  //   return () => clearTimeout(timer);
  // }, []);

  // Persist changes
  // useEffect(() => {
  //   if (receipts.length > 0) {
  //     localStorage.setItem("mock_receipts", JSON.stringify(receipts));
  //   }
  // }, [receipts]);

  const { data, error, refetch, isLoading } = useQuery<UserData>({
    queryKey: ["userReceipts"],
    queryFn: async () => {

      const token = await getToken();
      if(!token) throw new Error("Unauthenticated")

      const res = await fetch(`${BACKEND_URL}/api/receipts`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        credentials: "include",
      });
      if (!res) throw new Error("Failed to fetch receipts");

      console.log("Status:", res.status);
      console.log("Response:", await res.clone().text());

      if (!res.ok) throw new Error(`Failed: ${res.status}`);

      return (await res.json()) as UserData;
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (data) {
      console.log(data);
    }
  }, [data]);

  const receipts: UserReceipts[] = data?.receipts ?? [];

  // Pull to refresh handler
  const handleRefresh = async () => {
    await refetch();
  };

  const { contentRef, pullY, isRefreshing, handlers } =
    usePullToRefresh(handleRefresh);

  // Extract unique store names for filter
  const availableStores = useMemo(() => {
    const stores = [...new Set(receipts.map((r) => r.store_name))];
    return stores.sort();
  }, [receipts]);

  // Shared filter function
  const applyFilters = useCallback(
    (receipt: Receipt) => {
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
    },
    [searchQuery, filterValues],
  );

  // Filtered Action Required receipts
  const actionRequiredResults = useMemo(() => {
    return receipts.filter(
      (r) => r.status === "action-required" && applyFilters(r),
    );
  }, [receipts, applyFilters]);

  // Filtered Recent Activity receipts (excluding action-required)
  const recentActivityResults = useMemo(() => {
    return receipts.filter(
      (r) => r.status !== "action-required" && applyFilters(r),
    );
  }, [receipts, applyFilters]);

  const hasAnyReceipts = receipts.length > 0;
  const hasActionResults = actionRequiredResults.length > 0;
  const hasRecentResults = recentActivityResults.length > 0;
  const isSearching =
    searchQuery !== "" ||
    filterValues.date !== null ||
    filterValues.store !== null ||
    filterValues.status !== null;

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

  const handleStatusClick = useCallback(
    (receipt: Receipt) => {
      if (receipt.status === "verified" || receipt.status === "pending") {
        handleReviewReceipt(receipt);
      }
    },
    [handleReviewReceipt],
  );
  const handleSaveReceipt = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleViewAllActionRequired = () => {
    navigate({ to: "/receipts/action-required" });
  };

  const isReadOnly =
    selectedReceipt?.status === "verified" ||
    selectedReceipt?.status === "pending";

  if (isLoading) {
    return <ReceiptsSkeleton />;
  }

  if (error) throw new Error("Data tidak keangkut cuy...", error);

  return (
    <div
      ref={contentRef}
      className="pb-24 min-h-screen relative bg-[#0b0e11]"
      onClick={() => {
        if (activeFilter) setActiveFilter(null);
      }}
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
          <div className="h-1.5 w-12 bg-gray-700 rounded-full opacity-50" />
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
        ) : (
          <>
            {!isSearching && hasActionResults && (
              <ActionRequiredSection
                receipts={actionRequiredResults}
                onViewAll={handleViewAllActionRequired}
                onReviewReceipt={handleReviewReceipt}
              />
            )}

            {!hasRecentResults && isSearching ? (
              <ReceiptEmptyState type="no-results" />
            ) : (
              <RecentActivityList
                receipts={recentActivityResults}
                onReceiptClick={handleReviewReceipt}
                onStatusClick={handleStatusClick}
              />
            )}
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
          isReadOnly={isReadOnly}
        />
      )}
    </div>
  );
};
