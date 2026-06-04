import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Filter, Search, X } from "lucide-react";
import { PageHeader } from "@/components/wms/page-header";
import { StatusBadge } from "@/components/wms/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  fmtSlaRemaining,
  fmtTimestamp,
  orders,
  slaDeadline,
} from "@/lib/wms/mock-data";

export const Route = createFileRoute("/_wms/orders/")({
  head: () => ({
    meta: [
      { title: "Orders — WMS Outbound" },
      {
        name: "description",
        content:
          "All outbound orders queued for pick, pack, manifest, and dispatch.",
      },
    ],
  }),
  component: OrdersPage,
});

interface Filters {
  search: string;
  orderType: string;
  channel: string;
  seller: string;
  courier: string;
  sla: string;
  paymentMode: string;
  status: string;
  qtyMin: string;
  qtyMax: string;
  createdFrom: string;
  createdTo: string;
}

const emptyFilters: Filters = {
  search: "",
  orderType: "all",
  channel: "all",
  seller: "all",
  courier: "all",
  sla: "all",
  paymentMode: "all",
  status: "all",
  qtyMin: "",
  qtyMax: "",
  createdFrom: "",
  createdTo: "",
};

const ALL = "all";

function OrdersPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Distinct sellers from the dataset, for the seller dropdown
  const sellerOptions = useMemo(
    () => Array.from(new Set(orders.map((o) => o.seller))).sort(),
    [],
  );

  const setField = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setFilters((f) => ({ ...f, [key]: value }));

  // Count of currently active non-search filters (the search field already
  // has its own visible chip, so excluded here)
  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.orderType !== ALL) n++;
    if (filters.channel !== ALL) n++;
    if (filters.seller !== ALL) n++;
    if (filters.courier !== ALL) n++;
    if (filters.sla !== ALL) n++;
    if (filters.paymentMode !== ALL) n++;
    if (filters.status !== ALL) n++;
    if (filters.qtyMin !== "" || filters.qtyMax !== "") n++;
    if (filters.createdFrom !== "" || filters.createdTo !== "") n++;
    return n;
  }, [filters]);

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    const qtyMin = filters.qtyMin === "" ? null : Number(filters.qtyMin);
    const qtyMax = filters.qtyMax === "" ? null : Number(filters.qtyMax);
    const from = filters.createdFrom ? new Date(filters.createdFrom) : null;
    const to = filters.createdTo
      ? new Date(`${filters.createdTo}T23:59:59`)
      : null;

    return orders.filter((o) => {
      if (q) {
        const hay =
          `${o.orderNo} ${o.extOrderNo} ${o.items.map((i) => `${i.sku} ${i.name}`).join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.orderType !== ALL && o.orderType !== filters.orderType)
        return false;
      if (filters.channel !== ALL && o.channel !== filters.channel) return false;
      if (filters.seller !== ALL && o.seller !== filters.seller) return false;
      if (filters.courier !== ALL && o.courier !== filters.courier) return false;
      if (filters.sla !== ALL && o.sla !== filters.sla) return false;
      if (filters.paymentMode !== ALL && o.paymentMode !== filters.paymentMode)
        return false;
      if (filters.status !== ALL && o.status !== filters.status) return false;
      if (qtyMin !== null && o.totalQuantity < qtyMin) return false;
      if (qtyMax !== null && o.totalQuantity > qtyMax) return false;
      const created = new Date(o.createdAt);
      if (from && created < from) return false;
      if (to && created > to) return false;
      return true;
    });
  }, [filters]);

  const resetFilters = () => setFilters(emptyFilters);
  const clearSearch = () => setField("search", "");

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle={`${filtered.length} of ${orders.length} orders shown`}
        actions={
          <>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search order no, SKU…"
                value={filters.search}
                onChange={(e) => setField("search", e.target.value)}
                className="h-9 w-64 pl-8 pr-8"
              />
              {filters.search && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    activeFilterCount > 0 &&
                      "border-primary/40 bg-primary/5 text-primary",
                  )}
                >
                  <Filter className="h-4 w-4" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="ml-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[360px] p-0"
                align="end"
                sideOffset={8}
              >
                <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                  <div className="text-sm font-semibold">Filter orders</div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={resetFilters}
                    disabled={activeFilterCount === 0}
                  >
                    Reset
                  </Button>
                </div>
                <div className="max-h-[60vh] space-y-3 overflow-y-auto p-4">
                  <FilterField label="Order Type">
                    <Select
                      value={filters.orderType}
                      onValueChange={(v) => setField("orderType", v)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL}>All</SelectItem>
                        <SelectItem value="B2C">B2C</SelectItem>
                        <SelectItem value="B2B">B2B</SelectItem>
                      </SelectContent>
                    </Select>
                  </FilterField>

                  <FilterField label="Channel">
                    <Select
                      value={filters.channel}
                      onValueChange={(v) => setField("channel", v)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL}>All</SelectItem>
                        <SelectItem value="Amazon">Amazon</SelectItem>
                        <SelectItem value="Flipkart">Flipkart</SelectItem>
                        <SelectItem value="Shopify">Shopify</SelectItem>
                        <SelectItem value="Myntra">Myntra</SelectItem>
                      </SelectContent>
                    </Select>
                  </FilterField>

                  <FilterField label="Seller">
                    <Select
                      value={filters.seller}
                      onValueChange={(v) => setField("seller", v)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL}>All</SelectItem>
                        {sellerOptions.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FilterField>

                  <FilterField label="Courier">
                    <Select
                      value={filters.courier}
                      onValueChange={(v) => setField("courier", v)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL}>All</SelectItem>
                        <SelectItem value="Delhivery">Delhivery</SelectItem>
                        <SelectItem value="BlueDart">BlueDart</SelectItem>
                        <SelectItem value="XpressBees">XpressBees</SelectItem>
                        <SelectItem value="Ecom Express">Ecom Express</SelectItem>
                      </SelectContent>
                    </Select>
                  </FilterField>

                  <FilterField label="SLA">
                    <Select
                      value={filters.sla}
                      onValueChange={(v) => setField("sla", v)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL}>All</SelectItem>
                        <SelectItem value="Same Day">Same Day</SelectItem>
                        <SelectItem value="Next Day">Next Day</SelectItem>
                        <SelectItem value="Standard">Standard</SelectItem>
                      </SelectContent>
                    </Select>
                  </FilterField>

                  <FilterField label="Payment Mode">
                    <Select
                      value={filters.paymentMode}
                      onValueChange={(v) => setField("paymentMode", v)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL}>All</SelectItem>
                        <SelectItem value="Prepaid">Prepaid</SelectItem>
                        <SelectItem value="COD">COD</SelectItem>
                      </SelectContent>
                    </Select>
                  </FilterField>

                  <FilterField label="Status">
                    <Select
                      value={filters.status}
                      onValueChange={(v) => setField("status", v)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL}>All</SelectItem>
                        <SelectItem value="created">Created</SelectItem>
                        <SelectItem value="picked">Picked</SelectItem>
                        <SelectItem value="packed">Packed</SelectItem>
                        <SelectItem value="manifested">Manifested</SelectItem>
                        <SelectItem value="dispatched">Dispatched</SelectItem>
                      </SelectContent>
                    </Select>
                  </FilterField>

                  <FilterField label="Total Quantity">
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        placeholder="Min"
                        value={filters.qtyMin}
                        onChange={(e) => setField("qtyMin", e.target.value)}
                        className="h-9 flex-1"
                      />
                      <span className="text-xs text-muted-foreground">–</span>
                      <Input
                        type="number"
                        min={0}
                        placeholder="Max"
                        value={filters.qtyMax}
                        onChange={(e) => setField("qtyMax", e.target.value)}
                        className="h-9 flex-1"
                      />
                    </div>
                  </FilterField>

                  <FilterField label="Created At">
                    <div className="flex items-center gap-2">
                      <Input
                        type="date"
                        value={filters.createdFrom}
                        onChange={(e) =>
                          setField("createdFrom", e.target.value)
                        }
                        className="h-9 flex-1"
                      />
                      <span className="text-xs text-muted-foreground">→</span>
                      <Input
                        type="date"
                        value={filters.createdTo}
                        onChange={(e) => setField("createdTo", e.target.value)}
                        className="h-9 flex-1"
                      />
                    </div>
                  </FilterField>
                </div>
                <div className="border-t border-border px-4 py-2.5">
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => setPopoverOpen(false)}
                  >
                    Apply
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </>
        }
      />
      <div className="p-6">
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Order No</TableHead>
                <TableHead>Ext Order No</TableHead>
                <TableHead>Order Type</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Courier</TableHead>
                <TableHead>SLA</TableHead>
                <TableHead>Payment Mode</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total Quantity</TableHead>
                <TableHead>Created At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={11}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    No orders match the current filters.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((o) => {
                const deadline = slaDeadline(o.createdAt, o.sla);
                const rem = fmtSlaRemaining(deadline);
                return (
                  <TableRow
                    key={o.orderNo}
                    onClick={() =>
                      navigate({
                        to: "/orders/$orderNo",
                        params: { orderNo: o.orderNo },
                      })
                    }
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                  >
                    <TableCell className="font-medium">
                      <Link
                        to="/orders/$orderNo"
                        params={{ orderNo: o.orderNo }}
                        className="text-primary hover:underline"
                      >
                        {o.orderNo}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {o.extOrderNo}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "rounded-md border px-1.5 py-0.5 text-[10px] font-bold",
                          o.orderType === "B2B"
                            ? "border-purple-300 bg-purple-50 text-purple-700"
                            : "border-cyan-300 bg-cyan-50 text-cyan-700",
                        )}
                      >
                        {o.orderType}
                      </span>
                    </TableCell>
                    <TableCell>{o.channel}</TableCell>
                    <TableCell>{o.seller}</TableCell>
                    <TableCell>{o.courier}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="font-mono text-xs">
                        {fmtTimestamp(deadline)}
                      </div>
                      <div
                        className={cn(
                          "text-[10px] font-medium",
                          rem.overdue
                            ? "text-destructive"
                            : rem.close
                              ? "text-orange-600"
                              : "text-muted-foreground",
                        )}
                      >
                        {rem.text}
                      </div>
                    </TableCell>
                    <TableCell>{o.paymentMode}</TableCell>
                    <TableCell>
                      <StatusBadge status={o.status} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {o.totalQuantity}
                    </TableCell>
                    <TableCell className="font-mono text-xs whitespace-nowrap">
                      {fmtTimestamp(new Date(o.createdAt))}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
