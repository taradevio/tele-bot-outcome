import { Link, useLocation } from "@tanstack/react-router";
import { House, Receipt, ChartPie, User } from "lucide-react";

const navItems = [
  { name: "Home", icon: House, to: "/" as const },
  { name: "Receipts", icon: Receipt, to: "/receipts" as const },
  { name: "Stats", icon: ChartPie, to: "/stats" as const },
  { name: "Profile", icon: User, to: "/profile" as const },
];

export const BottomNav = () => {
  const location = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#0f1419] border-t border-gray-800 px-8 py-3 z-50">
      <div className="flex items-center justify-between">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.name}
              to={item.to}
              className={`flex flex-col items-center gap-1 transition-colors ${
                isActive ? "text-blue-400" : "text-gray-400"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
