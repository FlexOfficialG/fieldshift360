import { createFileRoute } from "@tanstack/react-router";
import { CategoryTag } from "@/components/data-status";
import { Page, PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/methodology")({
  head: () => ({
    meta: [
      { title: "Methodology — Field Shift" },
      {
        name: "description",
        content:
          "How Field Shift collects NASA POWER data, processes it, calculates prototype stress indicators, applies scenarios and generates AI interpretation, with limitations.",
      },
      { property: "og:title", content: "Methodology — Field Shift" },
      {
        property: "og:description",
        content:
          "NASA DATA → PROCESSING → INDICATORS → SCENARIO → INSIGHT, with every formula and limitation stated.",
      },
    ],
  }),
  component: Methodology,
});

const STEPS = ["NASA DATA", "PROCESSING", "INDICATORS", "SCENARIO", "INSIGHT"];

function Section({
  title,
  children,
  tag,
}: {
  title: string;
  tag?: "nasa" | "calculated" | "scenario" | "ai";
  children: React.ReactNode;
}) {
  return (
    <section className="panel p-6">
      {tag ? <CategoryTag kind={tag} /> : null}
      <h2 className="mt-3 text-lg font-semibold text-foreground">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

function Formula({ children }: { children: React.ReactNode }) {
  return (
    <p className="num rounded-md border border-border bg-muted px-3 py-2 text-xs text-foreground">
      {children}
    </p>
  );
}

function Methodology() {
  return (
    <>
      <PageHeader
        eyebrow="How it works"
        title="Methodology"
        description="Field Shift turns one NASA POWER request into transparent indicators and a hypothetical scenario comparison. Every step below is the step the application actually performs."
      />
      <Page>
        <div className="grid gap-6">
          <section className="panel p-6">
            <p className="label-tag">Workflow</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {STEPS.map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <span className="num rounded-md border border-border bg-surface px-3 py-2 text-xs tracking-wider text-foreground">
                    {s}
                  </span>
                  {i < STEPS.length - 1 && (
                    <span aria-hidden className="font-mono text-muted-foreground">
                      →
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>

          <Section tag="nasa" title="1. NASA data collection">
            <p>
              The application sends one server-side request to the NASA POWER daily point API
              (Agroclimatology community) using the latitude, longitude and date range you select. It
              requests three variables:
            </p>
            <Formula>T2M — temperature at 2 m</Formula>
            <Formula>PRECTOTCORR — bias-corrected total precipitation</Formula>
            <Formula>ALLSKY_SFC_SW_DWN — all-sky surface shortwave downward irradiance</Formula>
            <p>
              Units and long names are read from the metadata NASA returns with the response. Nothing
              is hardcoded and no value is ever generated locally. If the request fails, the app shows
              NASA DATA UNAVAILABLE instead of substitute numbers.
            </p>
          </Section>

          <Section tag="nasa" title="2. Data processing">
            <p>
              NASA POWER marks missing days with the fill value −999. Those days are converted to
              null, excluded from every statistic, and counted. Completeness then decides the data
              state:
            </p>
            <Formula>available — no missing days</Formula>
            <Formula>partial — some days missing (excluded from statistics)</Formula>
            <Formula>insufficient — a variable is empty, or more than 40% of days are missing</Formula>
            <Formula>unavailable / error — the API returned no usable response</Formula>
            <p>
              The baseline used everywhere else is the mean of the valid daily values for each
              variable over the selected period. Charts show daily points for short ranges and monthly
              means for longer ranges.
            </p>
          </Section>

          <Section tag="calculated" title="3. Stress indicators (prototype)">
            <p>
              Indicators are simple, transparent functions of the NASA means and the selected crop's
              reference values. They are prototype screening indicators, not validated crop-yield
              models.
            </p>
            <Formula>heat stress = clamp((T_mean − T_opt) / (T_crit − T_opt), 0, 1) × 100</Formula>
            <Formula>water stress = clamp(1 − P_mean / P_required, 0, 1) × 100</Formula>
            <Formula>radiation deficit = clamp(1 − S_mean / S_required, 0, 1) × 100</Formula>
            <Formula>
              environmental stress = 0.45 × heat + 0.45 × water + 0.10 × radiation deficit
            </Formula>
            <p>
              Environmental stress is an explicitly weighted combination: temperature and water are
              weighted equally because both directly limit growth, and radiation carries a small
              weight because a deficit is usually secondary. Scores are labelled Low (&lt;25),
              Moderate (&lt;50), High (&lt;75) and Severe (≥75). Each indicator page states its
              Input, Calculation and Result.
            </p>
          </Section>

          <Section tag="scenario" title="4. Scenario calculations">
            <p>
              Scenario Lab starts from the real NASA baseline and applies your chosen changes: a
              temperature offset of −5 °C to +5 °C and a rainfall change of −50% to +50%. Solar
              radiation is held at the observed value.
            </p>
            <Formula>T_scenario = T_mean + ΔT</Formula>
            <Formula>P_scenario = P_mean × (1 + rainfall change / 100)</Formula>
            <p>
              The same indicator formulas are then re-run on the scenario values, so the comparison
              table isolates the effect of your change. Scenario values are hypothetical and are
              labelled EXPERIMENTAL SCENARIO — NOT AN ACTUAL NASA OBSERVATION.
            </p>
          </Section>

          <Section tag="ai" title="5. AI interpretation">
            <p>
              The AI step is not a chatbot. The application sends a structured payload — NASA
              observation means, variable completeness, calculated indicator scores, and the scenario
              values if one is active — to a language model on the server, and asks for four short
              sections: Current Situation, Main Driver, Scenario Impact and Monitoring Priority.
            </p>
            <p>
              The model receives no other data and is instructed not to invent measurements, datasets,
              locations or findings. Its output is always labelled AI-GENERATED INTERPRETATION. If the
              model is not configured or the request fails, the page shows an unavailable state rather
              than generated text.
            </p>
          </Section>

          <Section title="6. Limitations">
            <p>
              NASA POWER provides gridded values, not in-field measurements: the returned coordinates
              are the grid centre nearest your point, and local topography, soil and irrigation are
              not represented. Daily data lags several days behind today.
            </p>
            <p>
              Crop reference values are generic literature-style thresholds, not calibrated to your
              variety, sowing date or management. The indicators do not model soil moisture, pests,
              disease, nutrients or extreme-event timing, and they must not be read as yield
              forecasts.
            </p>
            <p>
              Scenario results are arithmetic what-if experiments, not climate projections. All
              adaptation content is phrased as monitoring suggestions and further local assessment is
              recommended before any decision.
            </p>
          </Section>
        </div>
      </Page>
    </>
  );
}
