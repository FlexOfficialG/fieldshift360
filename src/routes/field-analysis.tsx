import { createFileRoute } from "@tanstack/react-router";
import { CategoryTag, DataStateNotice, StatusBadge } from "@/components/data-status";
import { IndicatorCard, levelClass } from "@/components/indicator-card";
import { Page, PageHeader } from "@/components/page-header";
import { adaptationPriorities } from "@/lib/indicators";
import { useFieldData } from "@/lib/use-field-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/field-analysis")({
  head: () => ({
    meta: [
      { title: "Field Analysis — Field Shift" },
      {
        name: "description",
        content:
          "Transparent heat, water and environmental stress indicators calculated from NASA POWER observations, with full input, calculation and result disclosure.",
      },
      { property: "og:title", content: "Field Analysis — transparent stress indicators" },
      {
        property: "og:description",
        content: "Input → Calculation → Result for every Field Shift prototype indicator.",
      },
    ],
  }),
  component: FieldAnalysis,
});

function FieldAnalysis() {
  const { farm, crop, nasa, baseline, indicators, isLoading, isError, error } = useFieldData();
  const status = isLoading ? "loading" : isError ? "error" : (nasa?.status ?? "loading");
  const priorities = baseline ? adaptationPriorities(baseline, crop) : [];

  return (
    <>
      <PageHeader
        eyebrow="Field Analysis"
        title="Prototype environmental indicators"
        description="Three transparent indicators derived from the NASA POWER baseline for this farm and crop. These are prototype transparency indicators, not scientifically validated crop-yield predictions."
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
            <div className="panel p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">NASA baseline used</h2>
                  <p className="label-tag mt-1">
                    {farm.name} · {farm.lat.toFixed(4)}, {farm.lon.toFixed(4)} · {farm.start} →{" "}
                    {farm.end} · crop {crop.name}
                  </p>
                </div>
                <CategoryTag kind="nasa" />
              </div>
              <dl className="mt-4 grid gap-4 sm:grid-cols-3">
                {nasa?.variables.map((v) => (
                  <div key={v.code}>
                    <dt className="label-tag">
                      {v.code} ({v.unit})
                    </dt>
                    <dd className="num mt-1 text-sm text-foreground">
                      mean {v.mean ?? "—"} · min {v.min ?? "—"} · max {v.max ?? "—"}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              {indicators.map((i) => (
                <IndicatorCard key={i.key} indicator={i} />
              ))}
            </div>

            <section className="mt-10">
              <h2 className="text-lg font-semibold text-foreground">Adaptation insights</h2>
              <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                Monitoring priorities derived from the calculated indicators above. These are
                suggestions for observation, not guaranteed agricultural outcomes.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {priorities.map((p) => (
                  <article key={p.title} className="panel p-5">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-foreground">{p.title}</h3>
                      <span className={cn("num text-xs font-medium", levelClass(p.urgency))}>
                        {p.urgency} priority
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">{p.reason}</p>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}
      </Page>
    </>
  );
}
