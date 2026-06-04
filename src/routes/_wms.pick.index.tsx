import { Link, createFileRoute } from "@tanstack/react-router";
import { ChevronRight, Hand, Layers, MapPin, Package } from "lucide-react";
import { PageHeader } from "@/components/wms/page-header";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { picklists } from "@/lib/wms/picklist-data";

export const Route = createFileRoute("/_wms/pick/")({
  head: () => ({
    meta: [
      { title: "Pick — WMS Outbound" },
      { name: "description", content: "Your assigned picklists." },
    ],
  }),
  component: PickPage,
});

const priorityClass = {
  High: "bg-status-created/15 text-status-created ring-status-created/30",
  Medium: "bg-status-picked/15 text-status-picked ring-status-picked/30",
  Low: "bg-muted text-muted-foreground ring-border",
} as const;

function PickPage() {
  return (
    <div>
      <PageHeader
        title="Pick"
        subtitle={`${picklists.length} picklists assigned to you`}
      />
      <div className="space-y-3 p-4">
        {picklists.map((p) => (
          <Link
            key={p.id}
            to="/pick/$picklistId"
            params={{ picklistId: p.id }}
            className="block"
          >
            <Card className="p-4 transition-colors hover:bg-muted/40 active:bg-muted">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Hand className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{p.id}</span>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ring-1 ring-inset",
                        priorityClass[p.priority],
                      )}
                    >
                      {p.priority}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {p.wave} · {p.zone}
                  </p>
                  <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5" />
                      {p.totalSkus} SKUs
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Package className="h-3.5 w-3.5" />
                      {p.totalItems} units
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {p.zone}
                    </span>
                  </div>
                </div>
                <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
