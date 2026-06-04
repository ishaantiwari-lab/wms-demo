import { cn } from "@/lib/utils";
import type { OrderStatus, ItemStatus } from "@/lib/wms/mock-data";

type AnyStatus = OrderStatus | ItemStatus;

const STYLES: Record<AnyStatus, string> = {
  created: "bg-status-created/15 text-status-created ring-status-created/30",
  picked: "bg-status-picked/15 text-status-picked ring-status-picked/30",
  packed: "bg-status-packed/15 text-status-packed ring-status-packed/30",
  manifested:
    "bg-status-manifested/15 text-status-manifested ring-status-manifested/30",
  dispatched:
    "bg-status-dispatched/15 text-status-dispatched ring-status-dispatched/30",
  pending: "bg-muted text-muted-foreground ring-border",
};

export function StatusBadge({ status }: { status: AnyStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset",
        STYLES[status],
      )}
    >
      {status}
    </span>
  );
}
