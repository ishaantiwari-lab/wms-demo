import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Link2,
  MapPin,
  Package,
  RefreshCw,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_wms/slotting-config")({
  head: () => ({
    meta: [{ title: "Slotting Configuration — Inventory" }],
  }),
  component: SlottingConfig,
});

// ─── Types & defaults ─────────────────────────────────────────────────────────

type LookbackDays = "30" | "60" | "90" | "180" | "365";

interface GlobalParams {
  abcLookback: LookbackDays;
  affinityLookback: LookbackDays;
  goldenZoneLevels: number[];
  targetDensityPct: string;
  lowDensityThresholdPct: string;
}

const DEFAULTS: GlobalParams = {
  abcLookback: "90",
  affinityLookback: "90",
  goldenZoneLevels: [2, 3],
  targetDensityPct: "60",
  lowDensityThresholdPct: "50",
};

const LOOKBACK_OPTIONS: { value: LookbackDays; label: string }[] = [
  { value: "30", label: "30 days" },
  { value: "60", label: "60 days" },
  { value: "90", label: "90 days" },
  { value: "180", label: "180 days" },
  { value: "365", label: "365 days" },
];

const LEVELS = [1, 2, 3, 4, 5];

// ─── Strategy Builder types ───────────────────────────────────────────────────

type RuleId = "abc" | "affinity" | "weight" | "replenishment";

interface StrategyRule {
  id: RuleId;
  label: string;
  shortLabel: string;
  description: string;
  Icon: React.ElementType;
  enabled: boolean;
}

const DEFAULT_STRATEGY_RULES: StrategyRule[] = [
  {
    id: "abc",
    label: "ABC Velocity Class",
    shortLabel: "ABC Class",
    description:
      "A-items slot near dock / pick lanes, B-items in mid-zone, C-items in deep storage.",
    Icon: BarChart3,
    enabled: true,
  },
  {
    id: "affinity",
    label: "Affinity / Co-pick Clustering",
    shortLabel: "Affinity",
    description:
      "Items frequently ordered together are placed in adjacent locations to minimise travel time.",
    Icon: Link2,
    enabled: true,
  },
  {
    id: "weight",
    label: "Item Weight & Size",
    shortLabel: "Weight",
    description:
      "Heavy or bulky items assigned to lower levels; light or small items placed higher.",
    Icon: Package,
    enabled: true,
  },
  {
    id: "replenishment",
    label: "Replenishment Cycle",
    shortLabel: "Replenishment",
    description:
      "Fast-replenish SKUs slotted near staging; slow-movers placed in deep aisles.",
    Icon: RefreshCw,
    enabled: false,
  },
];

function buildStrategySummary(rules: StrategyRule[]): string {
  const active = rules.filter((r) => r.enabled);
  const inactive = rules.filter((r) => !r.enabled);

  if (active.length === 0) {
    return "No strategy rules are active — the engine will assign locations arbitrarily.";
  }

  const inactivePart =
    inactive.length > 0
      ? ` ${inactive.map((r) => r.label).join(" and ")} ${
          inactive.length > 1 ? "are" : "is"
        } inactive.`
      : "";

  const labels = active.map((r) => r.label.toLowerCase());

  if (labels.length === 1) {
    return `The engine will assign slot locations based on ${labels[0]}.${inactivePart}`;
  }
  if (labels.length === 2) {
    return `The engine will first slot SKUs by ${labels[0]}, then by ${labels[1]}.${inactivePart}`;
  }

  const last = labels[labels.length - 1];
  const rest = labels.slice(0, -1).join(", then ");
  return `The engine will first slot SKUs by ${rest} — finally by ${last}.${inactivePart}`;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

function SlottingConfig() {
  const [params, setParams] = useState<GlobalParams>(DEFAULTS);
  const [saved, setSaved] = useState(false);

  const [strategyRules, setStrategyRules] = useState<StrategyRule[]>(
    DEFAULT_STRATEGY_RULES
  );
  const [strategySaved, setStrategySaved] = useState(false);

  const toggle = (level: number) => {
    setParams((p) => ({
      ...p,
      goldenZoneLevels: p.goldenZoneLevels.includes(level)
        ? p.goldenZoneLevels.filter((l) => l !== level)
        : [...p.goldenZoneLevels, level].sort(),
    }));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    toast.success("Slotting parameters saved");
  };

  const handleReset = () => {
    setParams(DEFAULTS);
    setSaved(false);
    toast("Parameters reset to defaults");
  };

  const moveRule = (index: number, direction: "up" | "down") => {
    setStrategyRules((prev) => {
      const next = [...prev];
      const swapIndex = direction === "up" ? index - 1 : index + 1;
      [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
      return next;
    });
    setStrategySaved(false);
  };

  const toggleRule = (id: RuleId) => {
    setStrategyRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
    setStrategySaved(false);
  };

  const handleStrategySave = () => {
    setStrategySaved(true);
    toast.success("Slotting strategy saved");
  };

  const handleStrategyReset = () => {
    setStrategyRules(DEFAULT_STRATEGY_RULES);
    setStrategySaved(false);
    toast("Strategy reset to defaults");
  };

  return (
    <div className="space-y-6 p-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold">Slotting Configuration</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Configure the rules and thresholds the slotting engine uses to assign
          optimal storage locations.
        </p>
      </div>

      <Tabs defaultValue="global">
        <TabsList className="mb-2">
          <TabsTrigger value="global">Global Parameters</TabsTrigger>
          <TabsTrigger value="expiry" disabled>
            Expiry &amp; NTE Rules
          </TabsTrigger>
          <TabsTrigger value="strategy">Strategy Builder</TabsTrigger>
          <TabsTrigger value="density" disabled>
            Density Management
          </TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Global Parameters ──────────────────────────────────────── */}
        <TabsContent value="global" className="space-y-4 mt-2">

          {/* Demand Classification */}
          <Card className="overflow-hidden">
            <SectionHeader
              title="Demand Classification"
              description="Controls how the system segments SKUs by velocity for slotting priority."
            />
            <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
              <Field
                label="ABC Lookback Period"
                hint="Sales orders within this window determine A / B / C classification."
              >
                <Select
                  value={params.abcLookback}
                  onValueChange={(v) => {
                    setParams((p) => ({ ...p, abcLookback: v as LookbackDays }));
                    setSaved(false);
                  }}
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LOOKBACK_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field
                label="Affinity Lookback Period"
                hint="Order co-occurrence within this window determines item affinity groups."
              >
                <Select
                  value={params.affinityLookback}
                  onValueChange={(v) => {
                    setParams((p) => ({
                      ...p,
                      affinityLookback: v as LookbackDays,
                    }));
                    setSaved(false);
                  }}
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LOOKBACK_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </Card>

          {/* Location Zones */}
          <Card className="overflow-hidden">
            <SectionHeader
              title="Location Zones"
              description="Define which bin levels are treated as golden zone (highest-velocity pick area)."
            />
            <div className="p-5">
              <Field
                label="Golden Zone Levels"
                hint="Selected levels are automatically classified as golden zone. Typically mid-height levels for ergonomic picking."
              >
                <div className="mt-1 flex gap-2">
                  {LEVELS.map((lvl) => {
                    const active = params.goldenZoneLevels.includes(lvl);
                    return (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => toggle(lvl)}
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-semibold transition-colors",
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-muted/40 text-muted-foreground hover:border-primary/50 hover:bg-muted",
                        )}
                        aria-pressed={active}
                        title={`Level ${lvl}`}
                      >
                        {lvl}
                      </button>
                    );
                  })}
                </div>
                {params.goldenZoneLevels.length === 0 && (
                  <p className="mt-2 text-xs text-amber-600">
                    Select at least one level as golden zone.
                  </p>
                )}
              </Field>
            </div>
          </Card>

          {/* Density Thresholds */}
          <Card className="overflow-hidden">
            <SectionHeader
              title="Density Thresholds"
              description="Thresholds used by the consolidation engine to identify and fill under-utilised bins."
            />
            <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
              <Field
                label="Target Bin Density"
                hint="The ideal utilisation % the engine aims to reach after consolidation."
              >
                <div className="relative">
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={params.targetDensityPct}
                    onChange={(e) => {
                      setParams((p) => ({
                        ...p,
                        targetDensityPct: e.target.value,
                      }));
                      setSaved(false);
                    }}
                    className="h-9 pr-8"
                    placeholder="60"
                  />
                  <span className="absolute right-3 top-2 text-sm text-muted-foreground">
                    %
                  </span>
                </div>
              </Field>

              <Field
                label="Low Density Threshold"
                hint="Bins below this utilisation % are flagged for consolidation."
              >
                <div className="relative">
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={params.lowDensityThresholdPct}
                    onChange={(e) => {
                      setParams((p) => ({
                        ...p,
                        lowDensityThresholdPct: e.target.value,
                      }));
                      setSaved(false);
                    }}
                    className="h-9 pr-8"
                    placeholder="50"
                  />
                  <span className="absolute right-3 top-2 text-sm text-muted-foreground">
                    %
                  </span>
                </div>
              </Field>
            </div>

            {/* Live preview of the rule */}
            {params.lowDensityThresholdPct && params.targetDensityPct && (
              <div className="border-t border-border bg-muted/20 px-5 py-3 text-xs text-muted-foreground">
                Bins below{" "}
                <span className="font-semibold text-foreground">
                  {params.lowDensityThresholdPct}%
                </span>{" "}
                utilisation will be consolidated into bins targeting{" "}
                <span className="font-semibold text-foreground">
                  {params.targetDensityPct}%
                </span>{" "}
                density.
              </div>
            )}
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={handleReset}>
              Reset to defaults
            </Button>
            <div className="flex items-center gap-3">
              {saved && (
                <span className="flex items-center gap-1.5 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Saved
                </span>
              )}
              <Button onClick={handleSave} disabled={params.goldenZoneLevels.length === 0}>
                <Settings2 className="mr-2 h-4 w-4" />
                Save Parameters
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* ── Tab 2: Expiry & NTE Rules (placeholder) ───────────────────────── */}
        <TabsContent value="expiry">
          <Card className="flex flex-col items-center justify-center gap-2 p-16 text-center text-muted-foreground">
            <Settings2 className="h-8 w-8 opacity-40" />
            <p className="text-sm font-medium">Coming soon</p>
            <p className="text-xs">This tab is not yet configured.</p>
          </Card>
        </TabsContent>

        {/* ── Tab 3: Strategy Builder ────────────────────────────────────────── */}
        <TabsContent value="strategy" className="space-y-4 mt-2">
          {/* Priority Rules */}
          <Card className="overflow-hidden">
            <SectionHeader
              title="Strategy Rules"
              description="Drag rules up or down to set priority. The engine applies them in order — top rule wins ties at each lower level."
            />
            <div className="divide-y divide-border">
              {strategyRules.map((rule, index) => {
                const enabledBefore = strategyRules
                  .slice(0, index)
                  .filter((r) => r.enabled).length;
                const stepNumber = rule.enabled ? enabledBefore + 1 : null;
                return (
                  <RuleRow
                    key={rule.id}
                    rule={rule}
                    stepNumber={stepNumber}
                    canMoveUp={index > 0}
                    canMoveDown={index < strategyRules.length - 1}
                    onMoveUp={() => moveRule(index, "up")}
                    onMoveDown={() => moveRule(index, "down")}
                    onToggle={() => toggleRule(rule.id)}
                  />
                );
              })}
            </div>
          </Card>

          {/* Decision Flow */}
          <Card className="overflow-hidden">
            <SectionHeader
              title="Decision Flow"
              description="Live preview of how the engine processes each SKU through the active rules."
            />
            <div className="p-5">
              <DecisionFlow rules={strategyRules} />
            </div>
          </Card>

          {/* Strategy Summary */}
          <div className="rounded-lg border border-border bg-muted/20 px-5 py-3 text-xs text-muted-foreground">
            {buildStrategySummary(strategyRules)}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={handleStrategyReset}>
              Reset to defaults
            </Button>
            <div className="flex items-center gap-3">
              {strategySaved && (
                <span className="flex items-center gap-1.5 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Saved
                </span>
              )}
              <Button
                onClick={handleStrategySave}
                disabled={strategyRules.filter((r) => r.enabled).length === 0}
              >
                <Settings2 className="mr-2 h-4 w-4" />
                Save Strategy
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* ── Tab 4: Density Management (placeholder) ───────────────────────── */}
        <TabsContent value="density">
          <Card className="flex flex-col items-center justify-center gap-2 p-16 text-center text-muted-foreground">
            <Settings2 className="h-8 w-8 opacity-40" />
            <p className="text-sm font-medium">Coming soon</p>
            <p className="text-xs">This tab is not yet configured.</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Strategy Builder sub-components ─────────────────────────────────────────

function RuleRow({
  rule,
  stepNumber,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onToggle,
}: {
  rule: StrategyRule;
  stepNumber: number | null;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggle: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 px-5 py-4 transition-colors",
        !rule.enabled && "bg-muted/20 opacity-60",
      )}
    >
      {/* Step badge */}
      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors mt-0.5">
        {stepNumber !== null ? (
          <span className="text-primary">{stepNumber}</span>
        ) : (
          <span className="text-muted-foreground/40">—</span>
        )}
      </div>

      {/* Icon */}
      <rule.Icon className="h-4 w-4 flex-shrink-0 text-muted-foreground mt-0.5" />

      {/* Label + description */}
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{rule.label}</div>
        <div className="mt-0.5 text-[11px] text-muted-foreground">
          {rule.description}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={!canMoveUp}
          className="flex h-7 w-7 items-center justify-center rounded border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30"
          title="Move up"
        >
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={!canMoveDown}
          className="flex h-7 w-7 items-center justify-center rounded border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30"
          title="Move down"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "ml-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
            rule.enabled
              ? "bg-primary/10 text-primary hover:bg-primary/20"
              : "bg-muted text-muted-foreground hover:bg-muted/80",
          )}
        >
          {rule.enabled ? "Active" : "Inactive"}
        </button>
      </div>
    </div>
  );
}

function DecisionFlow({ rules }: { rules: StrategyRule[] }) {
  const active = rules.filter((r) => r.enabled);
  const inactive = rules.filter((r) => !r.enabled);

  if (active.length === 0) {
    return (
      <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
        Enable at least one rule to see the decision flow.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {/* Input node */}
        <FlowNode label="SKU" variant="input" />

        {active.map((rule, i) => (
          <div key={rule.id} className="flex items-center gap-1.5">
            <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/60" />
            <FlowNode label={rule.shortLabel} Icon={rule.Icon} step={i + 1} />
          </div>
        ))}

        <div className="flex items-center gap-1.5">
          <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/60" />
          <FlowNode label="Assign Slot" Icon={MapPin} variant="output" />
        </div>
      </div>

      {inactive.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-muted-foreground">
          <span className="font-medium">Not applied:</span>
          {inactive.map((r, i) => (
            <span key={r.id}>
              {r.shortLabel}
              {i < inactive.length - 1 ? "," : ""}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function FlowNode({
  label,
  Icon,
  step,
  variant,
}: {
  label: string;
  Icon?: React.ElementType;
  step?: number;
  variant?: "input" | "output";
}) {
  return (
    <div
      className={cn(
        "flex flex-shrink-0 flex-col items-center gap-0.5 rounded-lg border px-3 py-2 text-center min-w-[72px]",
        variant === "input" &&
          "border-border bg-muted/40 text-muted-foreground",
        variant === "output" &&
          "border-green-500/40 bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400",
        !variant &&
          "border-primary/25 bg-primary/5",
      )}
    >
      {step !== undefined && (
        <span className="text-[9px] font-semibold uppercase tracking-wide text-primary">
          Step {step}
        </span>
      )}
      {Icon && (
        <Icon
          className={cn(
            "h-3.5 w-3.5",
            variant === "output" ? "text-green-600 dark:text-green-400" : "text-muted-foreground",
          )}
        />
      )}
      <span className="text-[11px] font-medium leading-tight">{label}</span>
    </div>
  );
}

// ─── Building blocks ──────────────────────────────────────────────────────────

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="border-b border-border px-5 py-3">
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{description}</div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
