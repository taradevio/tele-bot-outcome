import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export const ReceiptsSkeleton = () => {
  return (
    <div className="pb-24 animate-in fade-in duration-500">
      {/* Header Skeleton */}
      <div className="flex items-center justify-center relative px-4 pt-6 pb-4">
        <Skeleton className="absolute left-4 h-5 w-5 rounded-full bg-gray-800" />
        <Skeleton className="h-6 w-32 bg-gray-800" />
      </div>

      {/* Search Bar Skeleton */}
      <div className="px-4 pb-4">
        <div className="relative flex items-center">
          <Search className="absolute left-3 h-4 w-4 text-gray-700" />
          <Skeleton className="w-full h-[52px] rounded-xl bg-[#1a2129]" />
        </div>
      </div>

      {/* Filter Chips Skeleton */}
      <div className="px-4 pb-4">
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="relative">
              <Button
                variant="outline"
                size="sm"
                disabled
                className="rounded-full border-gray-800 bg-[#1a2129] text-gray-700 h-auto py-2 px-4"
              >
                <Skeleton className="h-3 w-12 bg-gray-800" />
                <ChevronDown className="h-3 w-3 ml-2 text-gray-700" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Action Required Skeleton */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-5 w-32 bg-gray-800" />
          <Skeleton className="h-4 w-20 bg-gray-800" />
        </div>

        <div className="flex gap-3 overflow-hidden pb-2 -mx-4 px-4">
          {[1, 2].map((i) => (
            <Card
              key={i}
              className="bg-[#1a2129] border-none rounded-2xl min-w-[280px] max-w-[280px] shrink-0"
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <Skeleton className="h-10 w-10 rounded-xl bg-gray-800" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-24 bg-gray-800" />
                    <Skeleton className="h-3 w-32 bg-gray-800" />
                  </div>
                </div>

                <Skeleton className="h-7 w-32 mb-3 bg-gray-800" />

                <div className="mb-3 space-y-2">
                  <Skeleton className="h-1.5 w-full bg-gray-800" />
                  <Skeleton className="h-3 w-20 ml-auto bg-gray-800" />
                </div>

                <Skeleton className="h-10 w-full rounded-xl bg-gray-800" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity Skeleton */}
      <div className="px-4 pb-4">
        <Skeleton className="h-5 w-36 mb-4 bg-gray-800" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-[#1a2129] border-none rounded-xl">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 w-full">
                  <Skeleton className="h-11 w-11 rounded-xl bg-gray-800 shrink-0" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32 bg-gray-800" />
                    <Skeleton className="h-3 w-24 bg-gray-800" />
                  </div>
                  <div className="space-y-2 flex flex-col items-end">
                    <Skeleton className="h-5 w-20 bg-gray-800" />
                    <Skeleton className="h-4 w-16 bg-gray-800" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
