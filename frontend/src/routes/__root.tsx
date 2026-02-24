import { createRootRoute, Outlet } from "@tanstack/react-router";
import { BottomNav } from "@/components/BottomNav";
import { Toaster } from "@/components/ui/sonner";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <div className="min-h-screen bg-[#0f1419] text-white">
      <Outlet />
      <BottomNav />
      <Toaster position="top-center" expand={false} richColors />
    </div>
  );
}
