import type { AnalyzeResponse, BirthTimeAccuracy } from "@synastry/contracts";
import {
  buildNatalChartHighlights,
  formatAspect,
  formatPlanetPosition,
} from "./natal-chart-display";

type NatalChartSectionProps = {
  natalChart: AnalyzeResponse["natalChart"];
  birthTimeAccuracy: BirthTimeAccuracy;
};

export function NatalChartSection({
  natalChart,
  birthTimeAccuracy,
}: NatalChartSectionProps) {
  const highlights = buildNatalChartHighlights(natalChart, birthTimeAccuracy);

  return (
    <div className="mt-4 space-y-4">
      <div className="space-y-2">
        {highlights.map((line) => (
          <p className="m-0 font-main text-sm leading-relaxed text-muted" key={line}>
            {line}
          </p>
        ))}
      </div>

      <div>
        <h4 className="m-0 font-ui text-xs font-bold tracking-[0.06em] text-ink uppercase">
          Планеты
        </h4>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          {natalChart.positions.map((position) => (
            <li
              className="rounded-xl border border-line bg-white px-3 py-2 font-main text-sm text-ink"
              key={position.body}
            >
              {formatPlanetPosition(position)}
            </li>
          ))}
        </ul>
      </div>

      {natalChart.aspects.length > 0 ? (
        <div>
          <h4 className="m-0 font-ui text-xs font-bold tracking-[0.06em] text-ink uppercase">
            Аспекты
          </h4>
          <ul className="mt-2 space-y-1.5">
            {natalChart.aspects.map((aspect) => (
              <li
                className="font-main text-sm leading-relaxed text-muted"
                key={`${aspect.a}-${aspect.type}-${aspect.b}`}
              >
                {formatAspect(aspect)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
