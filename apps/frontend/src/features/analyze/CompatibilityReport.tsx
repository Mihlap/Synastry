import type { AnalyzeResponse } from "@synastry/contracts";
import { NatalChartSection } from "./NatalChartSection";
import { getArgumentGroups } from "./report-points";
import { verdictLabel } from "./report-labels";

const verdictTone: Record<
  AnalyzeResponse["compatibility"]["verdict"],
  string
> = {
  recommended: "bg-green/12 text-ink border-green/45",
  conditional: "bg-salmon/12 text-ink border-salmon/35",
  not_recommended: "bg-crimson/10 text-ink border-crimson/30",
};

type PointListProps = {
  title: string;
  items: string[];
  marker: "+" | "−";
  tone: "positive" | "negative" | "neutral-for" | "neutral-against";
};

function PointList({ title, items, marker, tone }: PointListProps) {
  const markerClasses = {
    positive: "bg-green/18 text-ink",
    negative: "bg-crimson/12 text-crimson",
    "neutral-for": "bg-blue/25 text-ink",
    "neutral-against": "bg-purple/12 text-ink",
  } as const;

  return (
    <section className="rounded-2xl border border-line bg-white/78 p-4 backdrop-blur-[4.5px] sm:p-5">
      <h3 className="m-0 font-accent text-base font-medium text-ink sm:text-lg">{title}</h3>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li className="flex gap-3 text-left" key={item}>
            <span
              aria-hidden="true"
              className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-accent text-sm font-bold ${markerClasses[tone]}`}
            >
              {marker}
            </span>
            <p className="m-0 flex-1 font-main text-[0.95rem] leading-relaxed text-ink">{item}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function CompatibilityReport({
  result,
  variant = "inline",
}: {
  result: AnalyzeResponse;
  variant?: "inline" | "modal";
}) {
  const { compatibility, natalChart, meta } = result;
  const argumentGroups = getArgumentGroups(compatibility);
  const isModal = variant === "modal";

  return (
    <article
      className={isModal ? "space-y-5" : "grid grid-cols-2 gap-3.5 max-sm:grid-cols-1"}
      aria-live="polite"
    >
      <header
        className={`rounded-2xl border p-4 sm:p-5 ${verdictTone[compatibility.verdict]} ${isModal ? "" : "col-span-full"}`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="m-0 font-ui text-[0.72rem] font-bold tracking-[0.08em] uppercase opacity-80">
              Итог
            </p>
            <h2 className="m-0 mt-1 font-accent text-2xl leading-tight tracking-tight">
              {verdictLabel[compatibility.verdict]}
            </h2>
          </div>
          {compatibility.score !== undefined ? (
            <span className="rounded-full bg-white/80 px-3 py-1.5 font-accent text-lg font-semibold text-ink shadow-sm">
              {compatibility.score}/100
            </span>
          ) : null}
        </div>
        <p className="mb-0 mt-4 font-main text-[1.02rem] leading-relaxed">{compatibility.summary}</p>
      </header>

      <div className={isModal ? "grid gap-4 lg:grid-cols-2" : "contents"}>
        <PointList
          items={compatibility.pros}
          marker="+"
          title="Сильные стороны"
          tone="positive"
        />
        <PointList items={compatibility.cons} marker="−" title="Риски и зоны внимания" tone="negative" />
      </div>

      {argumentGroups.for.length > 0 ? (
        <PointList
          items={argumentGroups.for}
          marker="+"
          title="Аргументы за кандидата"
          tone="neutral-for"
        />
      ) : null}

      {argumentGroups.against.length > 0 ? (
        <PointList
          items={argumentGroups.against}
          marker="−"
          title="Аргументы против / что проверить"
          tone="neutral-against"
        />
      ) : null}

      <details
        className={`rounded-2xl border border-line bg-white/70 p-4 sm:p-5 ${isModal ? "" : "col-span-full"}`}
      >
        <summary className="cursor-pointer font-accent text-base font-medium text-ink">
          Натальная карта (справочно)
        </summary>
        <p className="mt-3 whitespace-pre-line font-main text-sm leading-relaxed text-muted">
          {natalChart.summary}
        </p>
        <NatalChartSection
          birthTimeAccuracy={meta.birthTimeAccuracy}
          natalChart={natalChart}
        />
      </details>

      <p
        className={`m-0 font-ui text-xs leading-relaxed text-muted-light ${isModal ? "pt-1" : "col-span-full"}`}
      >
        {meta.disclaimer} Модель: {meta.provider} / {meta.model}.
      </p>
    </article>
  );
}
