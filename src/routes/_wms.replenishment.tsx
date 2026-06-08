import { createFileRoute } from "@tanstack/react-router";
import { PackagePlus } from "lucide-react";

export const Route = createFileRoute("/_wms/replenishment")({
  head: () => ({
    meta: [{ title: "Replenishment — Inventory" }],
  }),
  component: Replenishment,
});

function Replenishment() {
  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col items-center justify-center gap-3 bg-muted/40 p-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <PackagePlus className="h-6 w-6" />
      </div>
      <div className="text-lg font-semibold">Replenishment</div>
      <p className="max-w-sm text-sm text-muted-foreground">
        This screen is a placeholder. Replenishment tasks will be available here.
      </p>
    </div>
  );
}
