import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  RotateCcw,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_wms/replenishment")({
  head: () => ({
    meta: [{ title: "Replenishment Policy — Inventory" }],
  }),
  component: Replenishment,
});

// ─── Data ─────────────────────────────────────────────────────────────────────

const WAREHOUSES = [
  { code: "DEL01", name: "Delhi — Bilaspur" },
  { code: "MUM01", name: "Mumbai — Bhiwandi" },
  { code: "BLR01", name: "Bengaluru — Hoskote" },
  { code: "HYD01", name: "Hyderabad — Medchal" },
];

interface PolicyRow {
  sku: string;
  name: string;
  min: number;
  max: number;
  updatedAt: string;
}

const CURRENT_POLICY: PolicyRow[] = [
  { sku: "600179", name: "boAt Airdopes 141 TWS Earbuds", min: 20, max: 100, updatedAt: "09/06/2026" },
  { sku: "600822", name: "boAt Rockerz 450 Bluetooth Headphones", min: 10, max: 50, updatedAt: "09/06/2026" },
  { sku: "600868", name: "boAt Bassheads 100 Wired Earphones", min: 15, max: 75, updatedAt: "08/06/2026" },
  { sku: "600900", name: "boAt Stone 350 Bluetooth Speaker", min: 8, max: 40, updatedAt: "08/06/2026" },
  { sku: "601000", name: "boAt Wave Call Smartwatch", min: 12, max: 60, updatedAt: "07/06/2026" },
  { sku: "601002", name: "boAt Type-C 500 Charging Cable", min: 30, max: 150, updatedAt: "07/06/2026" },
  { sku: "601005", name: "boAt Aavante Bar 1160 Soundbar", min: 5, max: 25, updatedAt: "05/06/2026" },
];

interface UploadSummary {
  total: number;
  successful: number;
  failed: number;
  duplicate: number;
  updated: number;
  new: number;
}

const MOCK_SUMMARY: UploadSummary = {
  total: 500,
  successful: 495,
  failed: 5,
  duplicate: 8,
  updated: 312,
  new: 183,
};

// ─── Screen ───────────────────────────────────────────────────────────────────

function Replenishment() {
  const [warehouse, setWarehouse] = useState("DEL01");
  const [fileName, setFileName] = useState<string | null>(null);
  const [overwrite, setOverwrite] = useState(true);
  const [summary, setSummary] = useState<UploadSummary | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFileName(null);
    setSummary(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleUpload = () => {
    if (!fileName) {
      toast.error("Please upload an Excel / CSV file first");
      return;
    }
    setSummary(MOCK_SUMMARY);
    toast.success(`Policy uploaded for ${warehouse}`);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold">Replenishment Policy</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Min-Max Replenishment Policy Upload — configure the stock thresholds the
          replenishment engine uses to refill pick-face locations from reserve /
          bulk storage.
        </p>
      </div>

      {/* ── Upload Min-Max Policy ──────────────────────────────────────────── */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="text-sm font-semibold">Upload Min-Max Policy</div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.success("Template downloaded")}
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Download Template
          </Button>
        </div>
        <div className="space-y-5 p-5">
          {/* Warehouse */}
          <Field label="Warehouse">
            <Select value={warehouse} onValueChange={setWarehouse}>
              <SelectTrigger className="max-w-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WAREHOUSES.map((w) => (
                  <SelectItem key={w.code} value={w.code}>
                    {w.code} — {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* Upload File */}
          <Field label="Upload File">
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setFileName(f.name);
                  setSummary(null);
                }
              }}
            />
            {fileName ? (
              <div className="flex max-w-sm items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <FileSpreadsheet className="h-5 w-5 shrink-0 text-green-600" />
                  <span className="truncate text-sm font-medium">{fileName}</span>
                </div>
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={reset}
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex w-full max-w-sm flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border px-4 py-7 text-center transition-colors hover:border-primary/50 hover:bg-muted/30"
              >
                <Upload className="h-6 w-6 text-muted-foreground" />
                <span className="text-sm font-medium">
                  Click to upload Excel / CSV
                </span>
                <span className="text-xs text-muted-foreground">
                  .xlsx, .xls or .csv — SKU Min-Max mapping
                </span>
              </button>
            )}
          </Field>

          {/* Options */}
          <Field label="Overwrite Existing Policies">
            <Toggle
              value={overwrite}
              onYes={() => setOverwrite(true)}
              onNo={() => setOverwrite(false)}
            />
          </Field>

          <Button onClick={handleUpload}>
            <Upload className="mr-2 h-4 w-4" />
            Upload
          </Button>
        </div>
      </Card>

      {/* ── Current Min-Max Policy ─────────────────────────────────────────── */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="text-sm font-semibold">
            Current Min-Max Policy{" "}
            <span className="ml-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {warehouse}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            {CURRENT_POLICY.length} SKUs configured
          </div>
        </div>

        {/* Table header */}
        <div className="grid grid-cols-[7rem_1fr_6rem_6rem_7rem] gap-3 border-b border-border bg-muted/30 px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <span>SKU Code</span>
          <span>Item</span>
          <span className="text-right">Minimum Qty</span>
          <span className="text-right">Maximum Qty</span>
          <span className="text-right">Last Updated</span>
        </div>

        {/* Rows */}
        {CURRENT_POLICY.map((p) => (
          <div
            key={p.sku}
            className="grid grid-cols-[7rem_1fr_6rem_6rem_7rem] items-center gap-3 border-b border-border px-5 py-2.5 text-sm last:border-0"
          >
            <span className="font-mono font-medium">{p.sku}</span>
            <span className="truncate text-muted-foreground">{p.name}</span>
            <span className="text-right font-mono tabular-nums">{p.min}</span>
            <span className="text-right font-mono tabular-nums">{p.max}</span>
            <span className="text-right text-xs text-muted-foreground">
              {p.updatedAt}
            </span>
          </div>
        ))}
      </Card>

      {/* ── Step 3: Summary / Confirmation ─────────────────────────────────── */}
      {summary && (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <div className="text-sm font-semibold">Upload Completed</div>
            <Button variant="ghost" size="sm" onClick={reset}>
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              New upload
            </Button>
          </div>

          <div className="space-y-5 p-5">
            {/* Banner */}
            <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <div className="text-sm font-semibold">
                  Replenishment policy saved
                </div>
                <div className="mt-0.5 text-xs">
                  Warehouse: <span className="font-mono font-semibold">{warehouse}</span>
                  {" · "}
                  {overwrite ? "Existing policies overwritten" : "Existing policies kept"}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <Stat label="Total Records" value={summary.total} />
              <Stat label="Successful" value={summary.successful} tone="green" />
              <Stat label="Failed" value={summary.failed} tone="red" />
              <Stat label="Duplicate" value={summary.duplicate} tone="amber" />
              <Stat label="Updated" value={summary.updated} />
              <Stat label="New" value={summary.new} />
            </div>

            {/* Error report */}
            {summary.failed > 0 && (
              <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <div className="text-sm text-amber-800">
                    <span className="font-semibold">{summary.failed} records failed</span>{" "}
                    validation — download the report to review and fix them.
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast.success("Error report downloaded")}
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Error report
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Small building blocks ────────────────────────────────────────────────────

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  );
}

function Toggle({
  value,
  onYes,
  onNo,
}: {
  value: boolean;
  onYes: () => void;
  onNo: () => void;
}) {
  return (
    <div className="flex w-32 rounded-lg border border-border bg-muted/40 p-1">
      <button
        type="button"
        onClick={onYes}
        className={cn(
          "flex-1 rounded-md py-1.5 text-sm font-medium transition-colors",
          value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
        )}
      >
        Yes
      </button>
      <button
        type="button"
        onClick={onNo}
        className={cn(
          "flex-1 rounded-md py-1.5 text-sm font-medium transition-colors",
          !value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
        )}
      >
        No
      </button>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "green" | "red" | "amber";
}) {
  const color =
    tone === "green"
      ? "text-green-600"
      : tone === "red"
        ? "text-red-600"
        : tone === "amber"
          ? "text-amber-600"
          : "text-foreground";
  return (
    <div className="rounded-lg border border-border p-3">
      <div className={cn("text-2xl font-bold tabular-nums", color)}>{value}</div>
      <div className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
