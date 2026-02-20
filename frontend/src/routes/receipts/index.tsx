import { createFileRoute } from "@tanstack/react-router";
import { ReceiptsPage } from "@/components/receipts/ReceiptsPage";

export const Route = createFileRoute("/receipts/")({
  component: ReceiptsPage,
});
