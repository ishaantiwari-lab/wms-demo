import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeftRight } from "lucide-react";

export const Route = createFileRoute("/_wms/item-movement")({
  head: () => ({
    meta: [{ title: "Item Movement — Inventory" }],
  }),
  component: ItemMovement,
});

function ItemMovement() {
  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col items-center justify-center gap-3 bg-muted/40 p-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <ArrowLeftRight className="h-6 w-6" />
      </div>
      <div className="text-lg font-semibold">Item Movement</div>
      <p className="max-w-sm text-sm text-muted-foreground">
        This screen is a placeholder. Item movement tracking will be available
        here.
      </p>
    </div>
  );
}
