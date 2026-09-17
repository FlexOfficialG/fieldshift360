import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CategoryTag, DataStateNotice, StatusBadge } from "@/components/data-status";
import { Page, PageHeader } from "@/components/page-header";
import { interpretResults, type AiInterpretation } from "@/lib/ai.functions";
import { useScenario } from "@/lib/farm-store";
import { computeIndicators, round1 } from "@/lib/indicators";
import { useFieldData } from "@/lib/use-field-data";

export const Route = createFileRoute("/ai-insights")({
  head: () => ({
    meta: [
      { title: "AI Insights — Field Shift" },
      {
        name: "description",
        content:
          "AI-generated interpretation of the actual NASA POWER results, calculated indicators and scenario output, in four short sections.",
      },
      { property: "og:title", content: "AI Insights — interpretation of real results" },
      {
        property: "og:description",
        content:
          "The model receives only structured Field Shift results: NASA observations, indicators and scenario values.",
      },
    ],
  }),
  component: AiInsights;
});

function AiInsights() {
  const { farm, crop, nasa, baseline, indicators, isLoading, isError, error } = useFieldData();
  const scenario = useScenario();
  const status = isLoading ? "loading" : isError ? "error" : (nasa?.status ?? "loading");

  const mutation = useMutation<AiInterpretation>({
    mutationFn: async () => {
      if (!nasa || !baseline || !indicators) throw new Error("No NASA data loaded.");
      const scenarioActive = scenario.tDelta !== 0 || scenario.rainPct !== 0;
      const scenarioIndicators = scenarioActive
        ? computeIndicators(
            {
              tMean: baseline.tMean + scenario.tDelta,
              precipMeanDaily: baseline.precipMeanDaily * (1 + scenario.rainPct / 100),
              solarMean: baseline.solarMean,
            },
            crop,
          )
        : null;

      return interpretResults({
        data: {
          farm: {
            name: farm.name,
            lat: farm.lat,
            lon: farm.lon,
            crop: crop.name,
            start: farm.start,
            end: farm.end,
          },
          dataStatus: nasa.status,
          dataNote: nasa.message,
          variables: nasa.variables.map((v) => ({
            code: v.code,
            longName: v.longName,
            unit: v.unit,
            mean: v.mean,
            min: v.min,
            max: v.max,
            validDays: v.validDays,
            missingDays: v.missingDays,
          })),
          indicators: indicators.map((i) => ({
            label: i.label,
            value: i.value,
            level: i.level,
          })),
          scenario: scenarioIndicators
            ? {
                temperatureDelta: scenario.tDelta,
                rainfallPercent: scenario.rainPct,
                indicators: scenarioIndicators.map((i) => ({
                  label: i.label,
                  value: i.value,
                  level: i.level,
                })),
              }
            : null,
        },
      });
    },
  });

  const result = mutation.data;

  return (
    <>
      <PageHeader
        eyebrow="AI Insights"
        title="AI interpretation of your results"
        description="The model is given only the structured output of this application: NASA POWER statistics, data quality, the calculated indicators and any active scenario. It cannot invent measurements, datasets or locations."
        aside={<StatusBadge status={status} />}
      />

      <Page>
        {status !== "available" && (
          <DataStateNotice
            status={status}
            message={isError ? (error?.message ?? "Request failed.") : nasa?.message}
          />
        )}

        {baseline && indicators && (
          <>
            <section className="panel p-5">
              <h2 className="text-sm font-semibold text-foreground">Payload sent to the model</h2>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <dt className="label-tag">Location &amp; crop</dt>
                  <dd className="num mt-1 text-sm">
                    {farm.lat.toFixed(3)}, {farm.lon.toFixed(3)} · {crop.name}
                  </dd>
                </div>
                <div>
                  <dt className="label-tag">NASA data status</dt>
                  <dd className="num mt-1 text-sm uppercase">{nasa?.status}</dd>
                </div>
                <div>
                  <dt className="label-tag">Indicators</dt>
                  <dd className="num mt-1 text-sm">
                    {indicators.map((i) => `${i.label.split(" ")[0]} ${i.value}`).join(" · ")}
                  </dd>
                </div>
                <div>
                  <dt className="label-tag">Scenario</dt>
                  <dd className="num mt-1 text-sm">
                    {scenario.tDelta === 0 && scenario.rainPct === 0
                      ? "none active"
                      : `${scenario.tDelta > 0 ? "+" : ""}${round1(scenario.tDelta)} °C · ${scenario.rainPct > 0 ? "+" : ""}${scenario.rainPct}% rainfall`}
                  </dd>
                </div>
              </dl>
              <button
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
                className="mt-5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                {mutation.isPending ? "Generating interpretation…" : "Generate AI interpretation"}
              </button>
            </section>

            {mutation.isError && (
              <div className="panel mt-6 p-5">
                <p className="font-mono text-[11px] tracking-widest uppercase text-destructive">
                  AI interpretation unavailable
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {(mutation.error as Error).message}
                </p>
              </div>
            )}

            {result?.status === "unavailable" && (
              <div className="panel mt-6 p-5">
                <p className="font-mono text-[11px] tracking-widest uppercase text-destructive">
                  AI interpretation unavailable
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{result.message}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  No substitute text is generated. NASA observations and calculated indicators on the
                  other pages are unaffected.
                </p>
              </div>
            )}

            {result?.status === "ok" && (
              <section className="mt-6">
                <div className="flex flex-wrap items-center gap-3">
                  <CategoryTag kind="ai" />
                  <p className="label-tag">model {result.model}</p>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {result.sections.map((s) => (
                    <article key={s.title} className="panel p-5">
                      <h3 className="font-mono text-[11px] tracking-widest uppercase text-muted-foreground">
                        {s.title}
                      </h3>
                      <p className="mt-3 text-sm leading-relaxed text-foreground">
                        {s.body || "No content returned for this section."}
                      </p>
                    </article>
                  ))}
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  AI-GENERATED INTERPRETATION of Field Shift results. Not a NASA product, not a
                  validated agronomic recommendation. Further local assessment is recommended.
                </p>
              </section>
            )}
          </>
        )}
      </Page>
    </>
  );
}
