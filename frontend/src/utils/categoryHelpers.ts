// utils/categoryHelpers.ts

interface CategoryData {
  id: string;
  name: string;
  total: number;
  percentage: number;
  color: string;
  icon: string;
}

const CATEGORY_CONFIG: Record<string, { color: string; icon: string }> = {
  "Food & Beverage": { color: "bg-orange-500", icon: "🍔" },
  Shopping: { color: "bg-pink-500", icon: "🛍️" },
  Transport: { color: "bg-blue-500", icon: "🚗" },
  "Bills & Utilities": { color: "bg-green-500", icon: "💡" },
  Health: { color: "bg-red-500", icon: "💊" },
  Entertainment: { color: "bg-purple-500", icon: "🎮" },
  Electronics: { color: "bg-cyan-500", icon: "💻" },
  Others: { color: "bg-gray-500", icon: "📋" },
};

export const transformCategoryData = (
  categoryTotals: Record<string, number>,
): CategoryData[] => {
  const grandTotal = Object.values(categoryTotals).reduce((a, b) => a + b, 0);

  return Object.entries(categoryTotals)
    .map(([name, amount]) => ({
      id: name,
      name,
      total: amount,
      percentage: grandTotal > 0 ? Math.round((amount / grandTotal) * 100) : 0,
      color: CATEGORY_CONFIG[name]?.color || "bg-gray-500",
      icon: CATEGORY_CONFIG[name]?.icon || "📋",
    }))
    .sort((a, b) => b.total - a.total);
};
