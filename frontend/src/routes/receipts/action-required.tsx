import { createFileRoute } from "@tanstack/react-router";
import { ActionRequiredPage } from "@/components/receipts/ActionRequiredPage";

export const Route = createFileRoute("/receipts/action-required")({
  component: ActionRequiredPage,
});
