import { createFileRoute } from "@tanstack/react-router";
import { CategoryTag, DataStateNotice, StatusBadge } from "@/components/data-status";
import { Page, PageHeader } from "@/components/page-header";
import { useFieldData } from "@/lib/use-field-data";

export const Route = createFileRoute("/data-sources")({
  head: () => ({
    meta: [
      { title: "Data Sources — Field Shift" },
      {
        name: "description",
        content:
          "Full provenance for every value used: NASA POWER source, dataset, variable, unit, location, date range and data status.",
      },
      { property: "og:title", content: "Data Sources & Provenance — Field Shift" },
      {
        property: "og:description",
        content:
          "Exactly which NASA POWER dataset, variables and units were requested, and how many daily values were returned.",
      },
    ],
  }),
  component: DataSources,
});

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border py-2.5 last:border-0 sm:flex-row sm:items-baseline sm:gap-4">
      <span className="label-tag w-56 shrink-0">{label}</span>
      <span className="num text-sm break-words text-foreground">{value}</span>
    </div>
  );
}

function DataSources() {
  const { farm, nasa, isLoading, isError, error } = useFieldData();
  const status = isLoading ? "loading" : isError ? "error" : (nasa?.status ?? "loading");
  const p = nasa?.provenance;

  return (
    <>
      <PageHeader
        eyebrow="Data provenance"
        title="Data Sources"
        description="Every environmental value in Field Shift comes from a single request to the NASA POWER API. The exact request, the dataset metadata it returned, and the completeness of the response are listed here."
        aside={<StatusBadge status={status} />}
      />
      <Page>
        <div className="grid gap-6">
          <DataStateNotice
            status={status}
            message={isError ? (error?.message ?? null) : (nasa?.message ?? null)}
          />

          <section className="panel p-6">
            <CategoryTag kind="nasa" />
            <h2 className="mt-3 text-lg font-semibold text-foreground">Request & source</h2>
            <div className="mt-4">
              <Row label="Source" value={p?.source ?? "NASA POWER — REAL OBSERVED/REANALYZED DATA"} />
              <Row label="API" value={p?.api ?? "NASA POWER API v2"} />
              <Row label="Community" value={p?.community ?? "AG (Agroclimatology)"} />
              <Row label="Temporal resolution" value={p?.temporal ?? "Daily point"} />
              <Row label="Location (requested)" value={`${farm.lat}° , ${farm.lon}° (${farm.name})`} />
              <Row
                label="Location (returned by NASA)"
                value={
                  p && p.returnedLat !== null && p.returnedLon !== null
                    ? `${p.returnedLat}° , ${p.returnedLon}°`
                    : "—"
                }
              />
              <Row
                label="Elevation (returned)"
                value={p?.elevation !== null && p?.elevation !== undefined ? `${p.elevation} m` : "—"}
              />
              <Row label="Date range" value={`${farm.start} → ${farm.end}`} />
              <Row label="Daily records returned" value={String(nasa?.totalDays ?? 0)} />
              <Row label="Fill value treated as missing" value={String(p?.fillValue ?? -999)} />
              <Row label="Data status" value={status.toUpperCase()} />
              <Row label="Requested at (UTC)" value={p?.requestedAt ?? "—"} />
              <Row label="Endpoint" value={p?.endpoint ?? "—"} />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Field Shift is an independent student project. It is not endorsed by or affiliated with
              NASA.
            </p>
          </section>

          <section className="panel p-6">
            <CategoryTag kind="nasa" />
            <h2 className="mt-3 text-lg font-semibold text-foreground">Variables</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Variable names and units are taken from the metadata the API returned with this
              response, not from any local list.
            </p>
            {nasa && nasa.variables.length > 0 ? (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="label-tag py-2">Variable</th>
                      <th className="label-tag py-2">Long name</th>
                      <th className="label-tag py-2">Unit</th>
                      <th className="label-tag py-2">Valid days</th>
                      <th className="label-tag py-2">Missing days</th>
                      <th className="label-tag py-2">Mean</th>
                      <th className="label-tag py-2">Min</th>
                      <th className="label-tag py-2">Max</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nasa.variables.map((v) => (
                      <tr key={v.code} className="border-b border-border last:border-0">
                        <td className="num py-2.5 text-foreground">{v.code}</td>
                        <td className="py-2.5 text-muted-foreground">{v.longName}</td>
                        <td className="num py-2.5 text-foreground">{v.unit}</td>
                        <td className="num py-2.5 text-foreground">{v.validDays}</td>
                        <td className="num py-2.5 text-foreground">{v.missingDays}</td>
                        <td className="num py-2.5 text-foreground">{v.mean ?? "—"}</td>
                        <td className="num py-2.5 text-foreground">{v.min ?? "—"}</td>
                        <td className="num py-2.5 text-foreground">{v.max ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                No variable metadata available for this request.
              </p>
            )}
          </section>

          <section className="panel p-6">
            <h2 className="text-lg font-semibold text-foreground">Response header (verbatim)</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The header block exactly as returned by NASA POWER for this request.
            </p>
            <pre className="mt-4 max-h-72 overflow-auto rounded-md border border-border bg-muted p-4 font-mono text-xs text-muted-foreground">
              {p?.header ? JSON.stringify(p.header, null, 2) : "—"}
            </pre>
          </section>

          <section className="panel p-6">
            <h2 className="text-lg font-semibold text-foreground">Other categories shown in the app</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <CategoryTag kind="calculated" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Heat, water and environmental stress indicators computed by Field Shift from the
                  NASA means above. Prototype indicators, not validated yield predictions.
                </p>
              </div>
              <div>
                <CategoryTag kind="scenario" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Hypothetical temperature and rainfall changes chosen by the user in Scenario Lab.
                  Not NASA observations.
                </p>
              </div>
              <div>
                <CategoryTag kind="ai" />
                <p className="mt-2 text-sm text-muted-foreground">
                  A language-model summary of the structured results above. It receives no data other
                  than those results.
                </p>
              </div>
            </div>
          </section>
        </div>
      </Page>
    </>
  );
}
