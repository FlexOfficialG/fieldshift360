import type { NasaDataStatus } from "@/lib/nasa.functions";
import { cn } from "@/lib/utils";

const STATUS_TEXT: Record<NasaDataStatus | "loading" | "error", string> = {
  loading: "LOADING",
  available: "AVAILABLE",
  partial: "PARTIAL",
  insufficient: "INSUFFICIENT DATA",
  unavailable: "NASA DATA UNAVAILABLE",
  error: "ERROR",
};

export function StatusBadge({
  status,
}: {
  status: NasaDataStatus | "loading" | "error";
}) {
  const tone =
    status === "available"
      ? "border-success/40 bg-success/10 text-success"
      : status === "partial"
        ? "border-warning/50 bg-warning/15 text-warning-foreground"
        : status === "loading"
          ? "border-border bg-muted text-muted-foreground"
          : "border-destructive/40 bg-destructive/10 text-destructive";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-md border px-2.5 py-1 font-mono text-[11px] tracking-widest uppercase",
        tone,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {STATUS_TEXT[status]}
    </span>
  );
}

export function CategoryTag({
  kind,
}: {
  kind: "nasa" | "calculated" | "scenario" | "ai";
}) {
  const map = {
    nasa: { text: "NASA OBSERVATION", cls: "border-accent/40 bg-accent/10 text-accent" },
    calculated: {
      text: "CALCULATED INDICATOR",
      cls: "border-primary/30 bg-primary/10 text-primary",
    },
    scenario: {
      text: "EXPERIMENTAL SCENARIO",
      cls: "border-warning/50 bg-warning/15 text-warning-foreground",
    },
    ai: { text: "AI-GENERATED INTERPRETATION", cls: "border-chart-5/40 bg-chart-5/10 text-chart-5" },
  }[kind];

  return (
    <span
      className={cn(
        "inline-block rounded border px-2 py-0.5 font-mono text-[10px] tracking-widest uppercase",
        map.cls,
      )}
    >
      {map.text}
    </span>
  );
}

export function DataStateNotice({
  status,
  message,
}: {
  status: NasaDataStatus | "loading" | "error";
  message?: string | null;
}) {
  if (status === "available") return null;

  if (status === "loading") {
    return (
      <div className="panel p-6">
        <StatusBadge status="loading" />
        <p className="mt-3 text-sm text-muted-foreground">
          Requesting daily values from the NASA POWER API for the selected coordinates and date
          range…
        </p>
      </div>
    );
  }

  const heading =
    status === "partial"
      ? "Partial NASA coverage"
      : status === "insufficient"
        ? "INSUFFICIENT DATA"
        : "NASA DATA UNAVAILABLE";

  return (
    <div className="panel p-6">
      <StatusBadge status={status} />
      <h3 className="mt-3 text-base font-semibold text-foreground">{heading}</h3>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
        {message ?? "The NASA POWER request did not return usable values."}
      </p>
      {status !== "partial" && (
        <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
          No values are substituted. Charts and indicators stay empty until real NASA data is
          returned. Try a different date range (NASA POWER daily data lags several days) or verify
          the coordinates.
        </p>
      )}
    </div>
  );
}
