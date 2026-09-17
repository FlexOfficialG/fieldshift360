import { useEffect, useState } from "react";
import { CROPS } from "@/lib/crops";
import { setFarm, useFarm, type FarmConfig } from "@/lib/farm-store";

export function FarmMap({ lat, lon, name }: { lat: number; lon: number; name: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const d = 0.06;
  const bbox = `${(lon - d).toFixed(4)},${(lat - d * 0.7).toFixed(4)},${(lon + d).toFixed(4)},${(lat + d * 0.7).toFixed(4)}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;

  return (
    <section className="panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Farm location</h3>
          <p className="label-tag mt-1">
            {name} · lat {lat.toFixed(4)} · lon {lon.toFixed(4)}
          </p>
        </div>
        <a
          className="text-xs text-accent underline-offset-2 hover:underline"
          href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=12/${lat}/${lon}`}
          target="_blank"
          rel="noreferrer"
        >
          Open larger map
        </a>
      </div>
      <div className="h-64 w-full bg-muted">
        {mounted && (
          <iframe
            key={src}
            title="OpenStreetMap view of the selected farm coordinates"
            src={src}
            className="size-full border-0"
            loading="lazy"
          />
        )}
      </div>
      <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
        Basemap © OpenStreetMap contributors. Marker shows the selected point only — no farm
        boundaries are inferred.
      </p>
    </section>
  );
}

export function FarmSetup() {
  const farm = useFarm();
  const [draft, setDraft] = useState<FarmConfig>(farm);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setDraft(farm), [farm]);

  const field = "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm num focus:outline-none focus:ring-2 focus:ring-ring";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const lat = Number(draft.lat);
    const lon = Number(draft.lon);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) return setError("Latitude must be between −90 and 90.");
    if (!Number.isFinite(lon) || lon < -180 || lon > 180) return setError("Longitude must be between −180 and 180.");
    if (draft.start > draft.end) return setError("Start date must be before the end date.");
    setError(null);
    setFarm({ ...draft, lat, lon, name: draft.name.trim() || "Unnamed plot" });
  }

  return (
    <form onSubmit={submit} className="panel p-4 sm:p-5">
      <h2 className="text-sm font-semibold text-foreground">Farm and analysis period</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Coordinates and dates are sent directly to the NASA POWER API.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block">
          <span className="label-tag">Farm name</span>
          <input
            className={field}
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="label-tag">Crop</span>
          <select
            className={field}
            value={draft.crop}
            onChange={(e) => setDraft({ ...draft, crop: e.target.value })}
          >
            {CROPS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label-tag">Latitude</span>
          <input
            className={field}
            type="number"
            step="0.0001"
            value={draft.lat}
            onChange={(e) => setDraft({ ...draft, lat: Number(e.target.value) })}
          />
        </label>
        <label className="block">
          <span className="label-tag">Longitude</span>
          <input
            className={field}
            type="number"
            step="0.0001"
            value={draft.lon}
            onChange={(e) => setDraft({ ...draft, lon: Number(e.target.value) })}
          />
        </label>
        <label className="block">
          <span className="label-tag">Start date</span>
          <input
            className={field}
            type="date"
            value={draft.start}
            onChange={(e) => setDraft({ ...draft, start: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="label-tag">End date</span>
          <input
            className={field}
            type="date"
            value={draft.end}
            onChange={(e) => setDraft({ ...draft, end: e.target.value })}
          />
        </label>
      </div>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Load NASA POWER data
        </button>
        <span className="text-xs text-muted-foreground">
          NASA POWER daily data typically lags the current date by several days.
        </span>
      </div>
    </form>
  );
}
