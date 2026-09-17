import { createFileRoute, Link } from "@tanstack/react-router";
import { DataStateNotice, StatusBadge, CategoryTag } from "@/components/data-status";
import { FarmMap, FarmSetup } from "@/components/farm-panel";
import { IndicatorMeter } from "@/components/indicator-card";
import { Page, PageHeader } from "@/components/page-header";
import { SeriesChart, aggregate } from "@/components/series-chart";
import { round1 } from "@/lib/indicators";
import { useFieldData } from "@/lib/use-field-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Field Shift" },
      {
        name: "description",
        content:
          "Load real NASA POWER temperature, precipitation and solar radiation data for a selected farm and crop.",
      },
      { property: "og:title", content: "Field Shift Dashboard — NASA POWER farm data" },
      {
        property: "og:description",
        content: "Real NASA POWER observations for a selected farm location, crop and date range.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { farm, crop, nasa, baseline, indicators, isLoading, isError, error } = useFieldData();
  const status = isLoading ? "loading" : isError ? "error" : (nasa?.status ?? "loading");
  const variable = (code: string) => nasa?.variables.find((v) => v.code === code);

  const summary = [
    { label: "Farm", value: farm.name },
    { label: "Latitude", value: farm.lat.toFixed(4) },
    { label: "Longitude", value: farm.lon.toFixed(4) },
    { label: "Crop", value: crop.name },
    { label: "Analysis period", value: `${farm.start} → ${farm.end}` },
  ];

  return (
    <>
      <PageHeader
        eyebrow="NASA Space Apps Challenge 2026 · Team Orbix"
        title="Field Shift Dashboard"
        description="Farm → NASA data → analysis → what-if → adaptation insight. Every environmental value shown here is retrieved live from the NASA POWER API for your coordinates and date range."
        aside={
          <div className="flex flex-col items-start gap-2 lg:items-end">
            <StatusBadge status={status} />
            <p className="label-tag">NASA POWER — real observed/reanalyzed data</p>
          </div>
        }
      />

      <Page>
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <FarmSetup />
          <FarmMap lat={farm.lat} lon={farm.lon} name={farm.name} />
        </div>

        <dl className="mt-6 grid gap-4 rounded-lg border border-border bg-card p-5 sm:grid-cols-3 lg:grid-cols-5">
          {summary.map((s) => (
            <div key={s.label}>
              <dt className="label-tag">{s.label}</dt>
              <dd className="num mt-1 text-sm text-foreground">{s.value}</dd>
            </div>
          ))}
        </dl>

        {status !== "available" && (
          <div className="mt-6">
            <DataStateNotice
              status={status}
              message={isError ? (error?.message ?? "Request failed.") : nasa?.message}
            />
          </div>
        )}

        {nasa && baseline && (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                { code: "T2M", title: "Mean air temperature", value: round1(baseline.tMean) },
                {
                  code: "PRECTOTCORR",
                  title: "Mean daily precipitation",
                  value: round1(baseline.precipMeanDaily),
                },
                {
                  code: "ALLSKY_SFC_SW_DWN",
                  title: "Mean solar irradiance",
                  value: round1(baseline.solarMean),
                },
              ].map((c) => (
                <div key={c.code} className="panel p-5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{c.title}</p>
                    <CategoryTag kind="nasa" />
                  </div>
                  <p className="num mt-3 text-2xl font-semibold text-foreground">
                    {c.value}
                    <span className="ml-1 text-sm font-normal text-muted-foreground">
                      {variable(c.code)?.unit}
                    </span>
                  </p>
                  <p className="label-tag mt-2">
                    {c.code} · {variable(c.code)?.validDays} valid days ·{" "}
                    {variable(c.code)?.missingDays} missing
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-2">
              <SeriesChart
                title="Temperature trend"
                variable="T2M — Temperature at 2 Meters"
                unit={variable("T2M")?.unit ?? "C"}
                {...aggregate(nasa.series, "t2m")}
                points={aggregate(nasa.series, "t2m").points}
                resolution={aggregate(nasa.series, "t2m").resolution}
                color="var(--color-chart-1)"
              />
              <SeriesChart
                title="Precipitation trend"
                variable="PRECTOTCORR — Precipitation Corrected"
                unit={variable("PRECTOTCORR")?.unit ?? "mm/day"}
                points={aggregate(nasa.series, "precip").points}
                resolution={aggregate(nasa.series, "precip").resolution}
                color="var(--color-chart-2)"
                kind="bar"
              />
              <SeriesChart
                title="Solar radiation trend"
                variable="ALLSKY_SFC_SW_DWN — All Sky Surface Shortwave Downward Irradiance"
                unit={variable("ALLSKY_SFC_SW_DWN")?.unit ?? "MJ/m^2/day"}
                points={aggregate(nasa.series, "solar").points}
                resolution={aggregate(nasa.series, "solar").resolution}
                color="var(--color-chart-3)"
                kind="area"
              />

              {indicators && (
                <section className="panel p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-foreground">
                      Prototype stress indicators
                    </h3>
                    <CategoryTag kind="calculated" />
                  </div>
                  <div className="mt-5 space-y-5">
                    {indicators.map((i) => (
                      <IndicatorMeter
                        key={i.key}
                        label={i.label}
                        value={i.value}
                        level={i.level}
                      />
                    ))}
                  </div>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      to="/field-analysis"
                      className="rounded-md border border-input px-3 py-1.5 text-sm text-foreground hover:bg-secondary"
                    >
                      View methodology per indicator
                    </Link>
                    <Link
                      to="/scenario-lab"
                      className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      Open Scenario Lab
                    </Link>
                  </div>
                </section>
              )}
            </div>
          </>
        )}
      </Page>
    </>
  );
}
