import { Link } from "@tanstack/react-router";

const LINKS = [
  { to: "/", label: "Dashboard" },
  { to: "/field-analysis", label: "Field Analysis" },
  { to: "/scenario-lab", label: "Scenario Lab" },
  { to: "/ai-insights", label: "AI Insights" },
  { to: "/data-sources", label: "Data Sources" },
  { to: "/methodology", label: "Methodology" },
] as const;

export function SiteNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-baseline gap-3">
          <Link to="/" className="flex items-baseline gap-2">
            <span className="text-lg font-semibold tracking-tight text-foreground">
              FIELD SHIFT
            </span>
            <span className="hidden text-xs text-muted-foreground sm:inline">
              Adapting Farms with NASA Data
            </span>
          </Link>
        </div>
        <nav className="-mx-1 flex flex-wrap items-center gap-1 overflow-x-auto">
          {LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.to === "/" }}
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground data-[status=active]:bg-secondary data-[status=active]:font-medium data-[status=active]:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-3">
          <div>
            <p className="label-tag">Project</p>
            <p className="mt-1 text-sm text-foreground">
              Field Shift — NASA Space Apps Challenge 2026
            </p>
          </div>
          <div>
            <p className="label-tag">Team Orbix</p>
            <p className="mt-1 text-sm text-foreground">Farhan Khan · Jannatun Nahar</p>
          </div>
          <div>
            <p className="label-tag">Data</p>
            <p className="mt-1 text-sm text-foreground">
              NASA POWER API — real observed/reanalyzed data. Basemap © OpenStreetMap
              contributors.
            </p>
          </div>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          Field Shift is an independent prototype. It is not endorsed by or affiliated with NASA,
          and its indicators are not validated crop-yield predictions.
        </p>
      </div>
    </footer>
  );
}
