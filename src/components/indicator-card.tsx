import type { Indicator, StressLevel } from "@/lib/indicators";
import { CategoryTag } from "./data-status";
import { cn } from "@/lib/utils";

export function levelClass(level: StressLevel) {
  return level === "Low"
    ? "text-success"
    : level === "Moderate"
      ? "text-warning-foreground"
      : "text-destructive";
}

function barClass(level: StressLevel) {
  return level === "Low" ? "bg-success" : level === "Moderate" ? "bg-warning" : "bg-destructive";
}

export function IndicatorMeter({
  label,
  value,
  level,
}: {
  label: string;
  value: number;
  level: StressLevel;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="label-tag">{label}</span>
        <span className={cn("num text-sm font-medium", levelClass(level))}>
          {value.toFixed(1)} / 100 · {level}
        </span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all duration-500", barClass(level))}
          style={{ width: `${Math.min(100, Math.max(1, value))}%` }}
        />
      </div>
    </div>
  );
}

export function IndicatorCard({ indicator }: { indicator: Indicator }) {
  return (
    <article className="panel p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-foreground">{indicator.label}</h3>
        <CategoryTag kind="calculated" />
      </div>

      <p className={cn("num mt-4 text-3xl font-semibold", levelClass(indicator.level))}>
        {indicator.value.toFixed(1)}
        <span className="ml-1 text-base font-normal text-muted-foreground">/ 100</span>
      </p>
      <p className={cn("text-sm font-medium", levelClass(indicator.level))}>{indicator.level}</p>

      <dl className="mt-5 space-y-3 border-t border-border pt-4 text-sm">
        <div>
          <dt className="label-tag">Input</dt>
          <dd className="mt-1 text-muted-foreground">{indicator.input}</dd>
        </div>
        <div>
          <dt className="label-tag">Calculation</dt>
          <dd className="num mt-1 text-xs leading-relaxed text-foreground">
            {indicator.calculation}
          </dd>
        </div>
        <div>
          <dt className="label-tag">Result</dt>
          <dd className="num mt-1 text-foreground">{indicator.result}</dd>
        </div>
      </dl>

      <p className="mt-4 text-xs text-muted-foreground">
        Prototype transparency indicator calculated by Field Shift. Not a validated crop-yield
        prediction.
      </p>
    </article>
  );
}
