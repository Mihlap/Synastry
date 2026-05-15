import type { AnalyzeResponse } from "@synastry/shared";

const verdictLabel: Record<
  AnalyzeResponse["compatibility"]["verdict"],
  string
> = {
  recommended: "Рекомендован",
  conditional: "Подходит с условиями",
  not_recommended: "Не рекомендован",
};

export function CompatibilityReport({
  result,
}: {
  result: AnalyzeResponse;
}) {
  const { compatibility, natalChart, meta } = result;

  return (
    <section className="result-grid" aria-live="polite">
      <article className="result-card result-hero">
        <span className="eyebrow">Итог анализа</span>
        <div className="verdict-row">
          <h2>{verdictLabel[compatibility.verdict]}</h2>
          {compatibility.score ? (
            <span className="score">{compatibility.score}/100</span>
          ) : null}
        </div>
        <p>{compatibility.summary}</p>
      </article>

      <article className="result-card">
        <h3>Сильные стороны</h3>
        <ul>
          {compatibility.pros.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </article>

      <article className="result-card">
        <h3>Риски</h3>
        <ul>
          {compatibility.cons.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </article>

      <article className="result-card wide">
        <h3>Аргументы</h3>
        <ul>
          {compatibility.arguments.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </article>

      <article className="result-card wide">
        <h3>Натальная карта</h3>
        <p>{natalChart.summary}</p>
        <div className="planet-list">
          {natalChart.positions.map((position) => (
            <span key={position.body}>
              {position.body}: {position.sign} {position.degree}°
            </span>
          ))}
        </div>
      </article>

      <p className="disclaimer">
        {meta.disclaimer} Модель: {meta.provider} / {meta.model}.
      </p>
    </section>
  );
}
