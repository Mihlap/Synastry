const sections = [
  {
    title: "Итог",
    lines: [
      "Итоговая рекомендация по кандидату",
      "Краткое резюме по кандидату",
      "Оценка совместимости с ролью",
    ],
  },
  {
    title: "Сильные стороны",
    lines: [
      "Стиль работы и мотивация",
      "Совпадение с культурой компании",
      "Навыки, которые усилят команду",
    ],
  },
  {
    title: "Риски",
    lines: [
      "Тонкие моменты для обсуждения",
      "Что уточнить на интервью",
      "Вопросы для следующего этапа",
    ],
  },
] as const;

export function ReportPreview() {
  return (
    <div className="grid gap-3" aria-hidden="true">
      {sections.map((section, index) => (
        <article
          className="rounded-[20px] border border-line bg-gradient-to-br from-white/82 to-blue/18 p-4 px-[18px] backdrop-blur-[4.5px]"
          key={section.title}
        >
          <header className="mb-3 flex items-center gap-3">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-salmon font-accent text-[0.82rem] font-bold text-white">
              {index + 1}
            </span>
            <strong className="font-accent text-base font-medium text-ink">
              {section.title}
            </strong>
          </header>
          <ul className="m-0 list-none p-0">
            {section.lines.map((line) => (
              <li
                className="relative pl-3.5 text-[0.92rem] text-muted before:absolute before:left-0 before:text-purple before:content-['•'] [&+&]:mt-1.5"
                key={line}
              >
                {line}
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}
