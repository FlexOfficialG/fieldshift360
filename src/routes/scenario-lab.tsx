import { createFileRoute, Link } from "@tanstack/react-router";
import { Slider } from "@/components/ui/slider";
import { CategoryTag, DataStateNotice, StatusBadge } from "@/components/data-status";
import { Page, PageHeader } from "@/components/page-header";
import { SeriesChart, aggregate } from "@/components/series-chart";
import { levelClass } from "@/components/indicator-card";
import { setScenario, useScenario } from "@/lib/farm-store";
import {
  computeIndicators,
  round1,
  type ClimateState,
  type Indicator,
} from "@/lib/indicators";
import { useFieldData } from "@/lib/use-field-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/scenario-lab")({
  head: () => ({
    meta: [
      { title: "Scenario Lab — Field Shift" },
      {
        name: "description",
        content:
          "Test hypothetical temperature and rainfall changes against the real NASA POWER baseline and compare calculated stress indicators side by side.",
      },
      { property: "og:title", content: "Scenario Lab — what-if climate testing" },
      {
        property: "og:description",
        content: "NASA baseline versus experimental scenario, with transparent change calculations.",
      },
    ],
  }),
  component: ScenarioLab,
});

function deltaText(value: number, unit: string) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${round1(value)} ${unit}`;
}

function ComparisonRow({
  metric,
  baseline,
  scenario,
  unit,
}: {
  metric: string;
  baseline: string;
  scenario: string;
  unit: string;
}) {
  const change = Number(scenario) - Number(baseline);
  return (
    <tr className="border-t border-border">
      <td className="py-3 pr-4 text-sm text-foreground">{metric}</td>
      <td className="num py-3 pr-4 text-sm text-foreground">
        {baseline} {unit}
      </td>
      <td className="num py-3 pr-4 text-sm text-warning-foreground">
        {scenario} {unit}
      </td>
      <td
        className={cn(
          "num py-3 text-sm font-medium",
          change > 0 ? "text-destructive" : change < 0 ? "text-accent" : "text-muted-foreground",
        )}
      >
        {deltaText(change, unit)}
      </td>
    </tr>
  );
}

function IndicatorRow({ base, scen }: { base: Indicator; scen: Indicator }) {
  const change = scen.value - base.value;
  return (
    <tr className="border-t border-border">
      <td className="py-3 pr-4 text-sm text-foreground">{base.label}</td>
      <td className={cn("num py-3 pr-4 text-sm", levelClass(base.level))}>
        {base.value.toFixed(1)} · {base.level}
      </td>
      <td className={cn("num py-3 pr-4 text-sm", levelClass(scen.level))}>
        {scen.value.toFixed(1)} · {scen.level}
      </td>
      <td
        className={cn(
          "num py-3 text-sm font-medium",
          change > 0 ? "text-destructive" : change < 0 ? "text-success" : "text-muted-foreground",
        )}
      >
        {deltaText(change, "pts")}
      </td>
    </tr>
  );
}

function ScenarioLab() {
  const { farm, crop, nasa, baseline, indicators, isLoading, isError, error } = useFieldData();
  const scenario = useScenario();
  const status = isLoading ? "loading" : isError ? "error" : (nasa?.status ?? "loading");

  const scenarioState: ClimateState | null = baseline
    ? {
        tMean: baseline.tMean + scenario.tDelta,
        precipMeanDaily: baseline.precipMeanDaily * (1 + scenario.rainPct / 100),
        solarMean: baseline.solarMean,
      }
    : null;
  const scenarioIndicators = scenarioState ? computeIndicators(scenarioState, crop) : null;

  const tempPoints = nasa
    ? aggregate(nasa.series, "t2m").points.map((p) => ({
        ...p,
        compare: p.value === null ? null : round1(p.value + scenario.tDelta),
      }))
    : [];
  const precipPoints = nasa
    ? aggregate(nasa.series, "precip").points.map((p) => ({
        ...p,
        compare: p.value === null ? null : round1(p.value * (1 + scenario.rainPct / 100)),
      }))
    : [];

  return (
    <>
      <PageHeader
        eyebrow="Signature feature"
        title="SCENARIO LAB"
        description="Start from the real NASA POWER baseline, then apply a hypothetical temperature or rainfall change. Field Shift recalculates the prototype indicators instantly. Scenario values are user-created hypotheticals — they are not NASA observations."
        aside={<StatusBadge status={status} />}
      />

      <Page>
        {status !== "available" && (
          <DataStateNotice
            status={status}
            message={isError ? (error?.message ?? "Request failed.") : nasa?.message}
          />
        )}

        {baseline && indicators && scenarioState && scenarioIndicators && (
          <>
            <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
              <section className="panel p-5">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-sm font-semibold text-foreground">Scenario controls</h2>
                  <CategoryTag kind="scenario" />
                </div>

                <div className="mt-6 space-y-8">
                  <div>
                    <div className="flex items-baseline justify-between">
                      <span className="label-tag">Temperature change</span>
                      <span className="num text-sm font-medium text-foreground">
                        {deltaText(scenario.tDelta, "°C")}
                      </span>
                    </div>
                    <Slider
                      className="mt-3"
                      min={-5}
                      max={5}
                      step={0.1}
                      value={[scenario.tDelta]}
                      onValueChange={([v]) => setScenario({ ...scenario, tDelta: v ?? 0 })}
                    />
                    <p className="label-tag mt-2">range −5 °C to +5 °C</p>
                  </div>

                  <div>
                    <div className="flex items-baseline justify-between">
                      <span className="label-tag">Rainfall change</span>
                      <span className="num text-sm font-medium text-foreground">
                        {deltaText(scenario.rainPct, "%")}
                      </span>
                    </div>
                    <Slider
                      className="mt-3"
                      min={-50}
                      max={50}
                      step={1}
                      value={[scenario.rainPct]}
                      onValueChange={([v]) => setScenario({ ...scenario, rainPct: v ?? 0 })}
                    />
                    <p className="label-tag mt-2">range −50% to +50%</p>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    onClick={() => setScenario({ tDelta: 0, rainPct: 0 })}
                    className="rounded-md border border-input px-3 py-1.5 text-sm hover:bg-secondary"
                  >
                    Reset to NASA baseline
                  </button>
                  <button
                    onClick={() => setScenario({ tDelta: 2, rainPct: -25 })}
                    className="rounded-md border border-input px-3 py-1.5 text-sm hover:bg-secondary"
                  >
                    Warmer &amp; drier preset
                  </button>
                  <Link
                    to="/ai-insights"
                    className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    Interpret with AI
                  </Link>
                </div>

                <p className="mt-6 border-t border-border pt-4 text-xs text-muted-foreground">
                  EXPERIMENTAL SCENARIO — NOT AN ACTUAL NASA OBSERVATION. Solar radiation is held at
                  the observed NASA mean because no assumption about future irradiance is made.
                </p>
              </section>

              <section className="panel overflow-x-auto p-5">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-sm font-semibold text-foreground">
                    NASA baseline | scenario | change
                  </h2>
                  <p className="label-tag">
                    {farm.name} · {crop.name}
                  </p>
                </div>
                <table className="mt-4 w-full min-w-[520px] text-left">
                  <thead>
                    <tr>
                      <th className="label-tag pb-2">Metric</th>
                      <th className="label-tag pb-2">NASA baseline</th>
                      <th className="label-tag pb-2">Scenario</th>
                      <th className="label-tag pb-2">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    <ComparisonRow
                      metric="Mean air temperature (T2M)"
                      baseline={round1(baseline.tMean).toString()}
                      scenario={round1(scenarioState.tMean).toString()}
                      unit="°C"
                    />
                    <ComparisonRow
                      metric="Mean daily precipitation (PRECTOTCORR)"
                      baseline={round1(baseline.precipMeanDaily).toString()}
                      scenario={round1(scenarioState.precipMeanDaily).toString()}
                      unit="mm/day"
                    />
                    <ComparisonRow
                      metric="Mean solar irradiance (ALLSKY_SFC_SW_DWN)"
                      baseline={round1(baseline.solarMean).toString()}
                      scenario={round1(scenarioState.solarMean).toString()}
                      unit="MJ/m²/day"
                    />
                    {indicators.map((base, i) => (
                      <IndicatorRow key={base.key} base={base} scen={scenarioIndicators[i]!} />
                    ))}
                  </tbody>
                </table>
                <p className="mt-4 text-xs text-muted-foreground">
                  Baseline column: NASA POWER observed/reanalyzed data. Scenario column: hypothetical
                  values calculated by Field Shift from your slider settings.
                </p>
              </section>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-2">
              <SeriesChart
                title="Temperature — baseline vs scenario"
                variable="T2M + scenario offset"
                unit="°C"
                points={tempPoints}
                resolution={aggregate(nasa!.series, "t2m").resolution}
                color="var(--color-chart-1)"
                compareLabel="experimental scenario"
              />
              <SeriesChart
                title="Precipitation — baseline vs scenario"
                variable="PRECTOTCORR × scenario factor"
                unit="mm/day"
                points={precipPoints}
                resolution={aggregate(nasa!.series, "precip").resolution}
                color="var(--color-chart-2)"
                kind="bar"
                compareLabel="experimental scenario"
              />
            </div>
          </>
        )}
      </Page>
    </>
  );
}
