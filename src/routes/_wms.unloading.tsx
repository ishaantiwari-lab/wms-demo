import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useMemo } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  HelpCircle,
  PackageOpen,
  Printer,
  ScanBarcode,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  awbIsIdentified,
  genRanId,
  inboundBarcodePattern,
  sellerFor,
} from "@/lib/wms/inbound-data";

export const Route = createFileRoute("/_wms/unloading")({
  head: () => ({
    meta: [{ title: "Unloading — Inbound" }],
  }),
  component: Unloading,
});

type Step = "scan-gatepass" | "scan-awbs" | "complete";

interface ScannedReturn {
  awb: string;
  bucket: "identified" | "unidentified";
  seller: string;
}

interface ReturnAck {
  ran: string;
  bucket: "identified" | "unidentified";
  returns: ScannedReturn[];
}

function Unloading() {
  const [step, setStep] = useState<Step>("scan-gatepass");
  const [gatePass, setGatePass] = useState<string | null>(null);
  const [gatePassSeller, setGatePassSeller] = useState<string | null>(null);
  const [returns, setReturns] = useState<ScannedReturn[]>([]);
  const [acknowledgements, setAcknowledgements] = useState<ReturnAck[]>([]);
  const [closedAt, setClosedAt] = useState<Date | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanKey, setScanKey] = useState(0);
  const [printOpen, setPrintOpen] = useState(false);

  const identified = returns.filter((r) => r.bucket === "identified");
  const unidentified = returns.filter((r) => r.bucket === "unidentified");

  const onGatePassScan = (val: string) => {
    const id = val.trim().toUpperCase();
    if (!id) return;
    setGatePass(id);
    setGatePassSeller(sellerFor(id));
    setStep("scan-awbs");
    setScanKey((k) => k + 1);
  };

  const onAwbScan = (val: string) => {
    const awb = val.trim().toUpperCase();
    if (!awb) return;
    if (returns.find((r) => r.awb === awb)) {
      setScanError(`${awb} already scanned at the gate.`);
      setScanKey((k) => k + 1);
      return;
    }
    const bucket: "identified" | "unidentified" = awbIsIdentified(awb)
      ? "identified"
      : "unidentified";
    setReturns((rs) => [...rs, { awb, bucket, seller: sellerFor(awb) }]);
    setScanError(null);
    setScanKey((k) => k + 1);
  };

  const completeUnloading = () => {
    if (returns.length === 0) return;
    // One RAN per bucket — at most 2 total (Identified + Unidentified).
    const buckets: ("identified" | "unidentified")[] = [
      "identified",
      "unidentified",
    ];
    const acks: ReturnAck[] = buckets
      .map((bucket) => {
        const rs = returns.filter((r) => r.bucket === bucket);
        if (rs.length === 0) return null;
        return { ran: genRanId(), bucket, returns: rs };
      })
      .filter((a): a is ReturnAck => a !== null);
    setAcknowledgements(acks);
    setClosedAt(new Date());
    setStep("complete");
  };

  const reset = () => {
    setStep("scan-gatepass");
    setGatePass(null);
    setGatePassSeller(null);
    setReturns([]);
    setAcknowledgements([]);
    setClosedAt(null);
    setScanError(null);
    setScanKey((k) => k + 1);
  };

  return (
    <div className="min-h-[calc(100vh-3rem)] bg-muted/40 py-4">
      <div className="mx-auto w-full max-w-[420px] overflow-hidden rounded-xl border border-border bg-background shadow-sm">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-2 border-b border-border bg-background px-4 py-3">
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            <PackageOpen className="h-4 w-4 text-muted-foreground" />
            Unloading · Returns
          </div>
          {gatePass && (
            <div className="text-right text-xs text-muted-foreground">
              Gate Pass{" "}
              <span className="font-mono font-semibold text-foreground">
                {gatePass}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-3 p-4">
          {/* Step 1 — Gate Pass */}
          {step === "scan-gatepass" && (
            <Card className="space-y-3 p-4">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <ScanBarcode className="h-3.5 w-3.5" />
                Scan return Gate Pass
              </div>
              <p className="text-xs text-muted-foreground">
                From the inbound return vehicle.
              </p>
              <ScanRow
                key={`gp-${scanKey}`}
                placeholder="e.g. RGP-A1B2"
                onScan={onGatePassScan}
                autoFocus
              />
            </Card>
          )}

          {/* Step 2 — AWB scanning */}
          {step === "scan-awbs" && (
            <>
              <Card className="space-y-3 p-4">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <ScanBarcode className="h-3.5 w-3.5" />
                  Scan return AWB
                </div>
                {scanError && <ErrorBanner message={scanError} />}
                <ScanRow
                  key={`awb-${scanKey}`}
                  placeholder="Scan return AWB…"
                  onScan={onAwbScan}
                  autoFocus
                />
                <p className="text-[11px] text-muted-foreground">
                  The system auto-routes each AWB to the Identified pile if a
                  return request already exists, otherwise to the Unidentified
                  pile.
                </p>
              </Card>

              {/* Bucket summary */}
              <div className="grid grid-cols-2 gap-2">
                <BucketTile
                  title="Identified"
                  count={identified.length}
                  tone="ok"
                  icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                />
                <BucketTile
                  title="Unidentified"
                  count={unidentified.length}
                  tone="warn"
                  icon={<HelpCircle className="h-3.5 w-3.5" />}
                />
              </div>

              {/* Pile lists */}
              {identified.length > 0 && (
                <Card className="space-y-1.5 p-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-status-picked" />
                    Identified pile ({identified.length})
                  </div>
                  {identified.map((r) => (
                    <AwbRow key={r.awb} awb={r.awb} seller={r.seller} tone="ok" />
                  ))}
                </Card>
              )}

              {unidentified.length > 0 && (
                <Card className="space-y-1.5 p-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    <HelpCircle className="h-3.5 w-3.5 text-orange-600" />
                    Unidentified pile ({unidentified.length})
                  </div>
                  {unidentified.map((r) => (
                    <AwbRow
                      key={r.awb}
                      awb={r.awb}
                      seller={r.seller}
                      tone="warn"
                    />
                  ))}
                </Card>
              )}

              {/* Complete unloading */}
              <Button
                className="h-11 w-full"
                disabled={returns.length === 0}
                onClick={completeUnloading}
              >
                <ClipboardCheck className="mr-2 h-4 w-4" />
                Complete unloading ({returns.length})
              </Button>
            </>
          )}

          {/* Step 3 — Complete */}
          {step === "complete" && closedAt && (
            <>
              <Card className="space-y-2 p-4 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-status-picked/15 text-status-picked">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-base font-semibold">
                    Unloading complete
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {acknowledgements.length} return acknowledgement
                    {acknowledgements.length === 1 ? "" : "s"} generated
                  </div>
                  {gatePass && (
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      Gate Pass{" "}
                      <span className="font-mono font-semibold text-foreground">
                        {gatePass}
                      </span>{" "}
                      ·{" "}
                      {closedAt.toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </div>
                  )}
                </div>
              </Card>

              <Button
                className="h-11 w-full"
                onClick={() => setPrintOpen(true)}
              >
                <Printer className="mr-2 h-4 w-4" />
                Print stickers ({acknowledgements.length})
              </Button>

              <Button
                variant="outline"
                className="h-11 w-full"
                onClick={reset}
              >
                Start new unloading
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Print stickers dialog */}
      <Dialog open={printOpen} onOpenChange={setPrintOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              {acknowledgements.length > 1
                ? `${acknowledgements.length} return ack stickers`
                : "Return ack sticker"}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-3 overflow-y-auto">
            {acknowledgements.map((a) => (
              <RanSticker key={a.ran} ack={a} />
            ))}
          </div>
          <DialogFooter>
            <Button className="w-full" onClick={() => setPrintOpen(false)}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Printed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RanSticker({ ack }: { ack: ReturnAck }) {
  const bars = useMemo(() => inboundBarcodePattern(ack.ran), [ack.ran]);
  const isIdentified = ack.bucket === "identified";
  return (
    <div className="rounded-lg border-2 border-dashed border-border bg-background p-4">
      {/* Type chip */}
      <div className="mb-2 flex items-center justify-between">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
            isIdentified
              ? "bg-status-picked/15 text-status-picked"
              : "bg-orange-100 text-orange-700",
          )}
        >
          {isIdentified ? "Identified" : "Unidentified"}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Return Ack
        </span>
      </div>

      {/* Barcode + RAN — centred header */}
      <div className="flex flex-col items-center">
        <div className="flex items-end gap-px">
          {bars.map((w, i) => (
            <div
              key={i}
              style={{ width: `${w * 2}px` }}
              className={cn(
                "h-12",
                i % 2 === 0 ? "bg-foreground" : "bg-transparent",
              )}
            />
          ))}
        </div>
        <div className="mt-1 font-mono text-sm font-bold tracking-wider">
          {ack.ran}
        </div>
      </div>

      <div className="my-3 border-t border-dashed border-border" />

      {/* Hero — shipment count */}
      <div className="flex flex-col items-center">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Shipments
        </span>
        <span className="font-mono text-5xl font-black leading-none">
          {ack.returns.length}
        </span>
      </div>

      <div className="my-3 border-t border-dashed border-border" />

      {/* Footer */}
      <dl className="space-y-1 text-xs">
        <StickerRow
          label="Type"
          value={isIdentified ? "Identified" : "Unidentified"}
        />
        <StickerRow
          label="Sellers"
          value={String(new Set(ack.returns.map((r) => r.seller)).size)}
        />
      </dl>
    </div>
  );
}

function StickerRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <dt className="w-16 shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="flex-1 font-medium">{value}</dd>
    </div>
  );
}

function AwbRow({
  awb,
  seller,
  tone,
}: {
  awb: string;
  seller: string;
  tone: "ok" | "warn";
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 rounded-md border px-2 py-1.5 text-xs",
        tone === "ok"
          ? "border-status-picked/30 bg-status-picked/5"
          : "border-orange-300 bg-orange-50",
      )}
    >
      <span className="font-mono font-semibold">{awb}</span>
      <span
        className={cn(
          "shrink-0 truncate rounded-full px-1.5 py-0.5 text-[10px] font-medium",
          tone === "ok"
            ? "bg-status-picked/15 text-status-picked"
            : "bg-orange-100 text-orange-700",
        )}
        title={seller}
      >
        {seller}
      </span>
    </div>
  );
}

function BucketTile({
  title,
  count,
  tone,
  icon,
}: {
  title: string;
  count: number;
  tone: "ok" | "warn";
  icon: React.ReactNode;
}) {
  return (
    <Card
      className={cn(
        "flex items-center justify-between gap-2 p-3",
        tone === "ok"
          ? "border-status-picked/30 bg-status-picked/5"
          : "border-orange-300 bg-orange-50",
      )}
    >
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide">
        <span
          className={tone === "ok" ? "text-status-picked" : "text-orange-600"}
        >
          {icon}
        </span>
        {title}
      </div>
      <span className="font-mono text-lg font-bold tabular-nums leading-none">
        {count}
      </span>
    </Card>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm font-medium text-destructive">
      <AlertCircle className="h-4 w-4 shrink-0" />
      {message}
    </div>
  );
}

function ScanRow({
  placeholder,
  onScan,
  autoFocus,
}: {
  placeholder: string;
  onScan: (value: string) => void;
  autoFocus?: boolean;
}) {
  const [val, setVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!val.trim()) return;
        onScan(val);
        setVal("");
        inputRef.current?.focus();
      }}
    >
      <Input
        ref={inputRef}
        autoFocus={autoFocus}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder={placeholder}
        className="h-11 font-mono text-sm"
      />
    </form>
  );
}
