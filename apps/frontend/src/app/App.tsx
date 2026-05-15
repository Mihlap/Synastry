import { useState } from "react";
import { AnalyzeWizard } from "../features/analyze/AnalyzeWizard";

const panelClasses =
  "rounded-[32px] border border-line bg-paper shadow-panel backdrop-blur-[7px] max-sm:rounded-3xl";

const eyebrowClasses =
  "inline-flex font-ui text-[0.78rem] font-bold tracking-[0.1em] text-salmon-dark uppercase";

const primaryLinkClasses =
  "inline-flex min-h-[54px] cursor-pointer items-center justify-center rounded-full border border-transparent bg-blue px-8 font-main text-base font-semibold text-white no-underline shadow-[0_14px_28px_rgb(117_187_253/0.26)] transition duration-150 ease-out hover:-translate-y-px hover:bg-blue-dark";

export function App() {
  const [analyzeSessionKey, setAnalyzeSessionKey] = useState(0);

  return (
    <main className="mx-auto w-[min(1240px,calc(100%-32px))] px-0 pt-8 pb-14 max-sm:w-[min(calc(100%-20px),1180px)] max-sm:pt-3">
      <section className="mt-6">
        <div className={`${panelClasses} relative overflow-hidden p-[clamp(32px,6vw,72px)]`}>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border border-blue/30 bg-blue/15"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-10 right-[18%] h-28 w-28 rounded-full border border-purple/20 bg-purple/10"
          />
          <span className={`${eyebrowClasses} mb-3.5`}>Для HR и рекрутеров</span>
          <h1 className="relative m-0 max-w-4xl font-accent text-[clamp(2.25rem,5vw,4rem)] leading-[1.12] font-light tracking-tight text-ink">
            Точный выбор среди сильных
          </h1>
          <p className="relative mt-6 max-w-3xl font-main text-lg leading-relaxed text-muted">
            Профиль кандидата, культура компании и задачи роли — в одном отчёте.
            Понятно, впишется ли человек в команду, где он силён и о чём поговорить
            на интервью.
          </p>
          <div className="relative mt-8 flex flex-col items-start gap-2.5">
            <a
              className={`${primaryLinkClasses} w-fit`}
              href="#analysis"
              onClick={() => setAnalyzeSessionKey((key) => key + 1)}
            >
              Начать анализ
            </a>
            <p className="m-0 max-w-md font-main text-[0.8125rem] leading-snug text-muted">
              При нажатии на кнопку — новая форма и новый отчёт.
            </p>
          </div>
        </div>
      </section>

      <AnalyzeWizard key={analyzeSessionKey} />
    </main>
  );
}
