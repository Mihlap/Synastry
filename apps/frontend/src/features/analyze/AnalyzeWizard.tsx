import { zodResolver } from "@hookform/resolvers/zod";
import type { AnalyzeRequest } from "@synastry/contracts";
import { useEffect, useRef, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { useAnalyzeMutation } from "../../shared/api/base-api";
import { getAnalyzeErrorMessage } from "../../shared/lib/analyze-error";
import { Button } from "../../shared/ui/Button";
import { InputField, TextareaField } from "../../shared/ui/Field";
import { ReportExportMenu } from "./ReportExportMenu";
import { ReportModal } from "./ReportModal";
import { ReportPreview } from "./ReportPreview";
import { analyzeFormSchema, defaultAnalyzeValues } from "./analyze-form";

const steps = ["Кандидат", "Вакансия", "Проверка"] as const;

const panelClasses =
  "rounded-[32px] border border-line bg-paper p-[clamp(18px,3vw,28px)] shadow-panel backdrop-blur-[7px] max-sm:rounded-3xl";

const eyebrowClasses =
  "inline-flex font-ui text-[0.78rem] font-bold tracking-[0.1em] text-salmon-dark uppercase";

const stepBaseClasses =
  "flex min-h-12 cursor-pointer items-center justify-start gap-2 rounded-[18px] border border-line p-2.5 font-ui text-[0.92rem] font-semibold transition hover:-translate-y-px";

const stepBadgeClasses =
  "grid h-7 w-7 shrink-0 place-items-center rounded-full font-accent text-[0.82rem]";

const formActionsClasses =
  "flex flex-wrap items-center gap-3 border-t border-line pt-5 max-sm:sticky max-sm:bottom-2.5 max-sm:z-2 max-sm:rounded-[28px] max-sm:bg-white/92 max-sm:p-2.5 max-sm:backdrop-blur-md";

const alertClasses =
  "font-ui text-[0.84rem] font-medium leading-snug text-crimson";

export function AnalyzeWizard() {
  const [step, setStep] = useState(0);
  const [reportOpen, setReportOpen] = useState(false);
  const [
    analyze,
    {
      data: analyzeResult,
      isLoading: analyzeIsSubmitting,
      isError: analyzeSubmitFailed,
      isSuccess: analyzeSucceeded,
      error: analyzeSubmissionError,
      reset: resetAnalyzeMutation,
    },
  ] = useAnalyzeMutation();
  const activeAnalyzeRequestRef = useRef<ReturnType<typeof analyze> | null>(null);

  const result = analyzeResult ?? null;

  useEffect(() => {
    return () => {
      activeAnalyzeRequestRef.current?.abort();
      activeAnalyzeRequestRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!analyzeIsSubmitting) {
      return;
    }

    if (!window.matchMedia("(max-width: 980px)").matches) {
      return;
    }

    document.getElementById("report-panel")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [analyzeIsSubmitting]);

  useEffect(() => {
    if (analyzeSucceeded && result) {
      setReportOpen(true);
    }
  }, [analyzeSucceeded, result]);
  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
    watch,
  } = useForm<AnalyzeRequest>({
    resolver: zodResolver(analyzeFormSchema) as Resolver<AnalyzeRequest>,
    defaultValues: defaultAnalyzeValues,
    mode: "onBlur",
  });

  const submit = handleSubmit(async (values) => {
    setReportOpen(true);

    const request = analyze(values);
    activeAnalyzeRequestRef.current = request;

    try {
      await request.unwrap();
    } finally {
      if (activeAnalyzeRequestRef.current === request) {
        activeAnalyzeRequestRef.current = null;
      }
    }
  });

  const submitError = analyzeSubmitFailed
    ? getAnalyzeErrorMessage(analyzeSubmissionError)
    : null;

  const reportModalLoading = analyzeIsSubmitting;

  const closeReport = () => {
    if (analyzeIsSubmitting) {
      activeAnalyzeRequestRef.current?.abort();
      resetAnalyzeMutation();
    }
    setReportOpen(false);
  };

  const goNext = async () => {
    if (step === 0) {
      const isValid = await trigger([
        "candidate.fullName",
        "candidate.birthDate",
        "candidate.birthPlace.city",
      ]);

      if (!isValid) {
        return;
      }
    }

    if (step === 1) {
      const isValid = await trigger([
        "vacancy.title",
        "vacancy.companyDescription",
        "vacancy.jobDescription",
      ]);

      if (!isValid) {
        return;
      }
    }

    setStep((value) => Math.min(value + 1, steps.length - 1));
  };

  const canGoBack = step > 0;
  const canGoNext = step < steps.length - 1;

  const candidateName = watch("candidate.fullName") || "Кандидат";
  const roleTitle = watch("vacancy.title") || "Должность не указана";

  return (
    <>
    <section
      className="mt-6 grid items-stretch gap-6 max-[980px]:grid-cols-1 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,1.05fr)]"
      id="analysis"
    >
      <div
        className={`${panelClasses} sticky top-5 flex min-h-[700px] flex-col max-[980px]:static max-[980px]:min-h-0`}
      >
        <div
          className="mb-6 grid grid-cols-3 gap-2 max-sm:grid-cols-1"
          aria-label="Шаги анализа"
        >
          {steps.map((label, index) => {
            const isActive = index === step;

            return (
              <button
                className={`${stepBaseClasses} ${
                  isActive ? "bg-ink text-white" : "bg-white/72 text-muted hover:bg-white"
                }`}
                key={label}
                onClick={() => setStep(index)}
                type="button"
              >
                <span
                  className={`${stepBadgeClasses} ${
                    isActive ? "bg-blue text-ink" : "bg-[#ebecee] text-ink"
                  }`}
                >
                  {index + 1}
                </span>
                {label}
              </button>
            );
          })}
        </div>

        <form className="flex flex-1 flex-col" onSubmit={submit}>
          <input
            type="hidden"
            {...register("candidate.birthPlace.latitude", { valueAsNumber: true })}
          />
          <input
            type="hidden"
            {...register("candidate.birthPlace.longitude", { valueAsNumber: true })}
          />
          <input type="hidden" {...register("candidate.birthPlace.timezone")} />
          <input type="hidden" {...register("options.providerId")} />
          <input type="hidden" {...register("options.model")} />

          <div className="min-h-[420px] flex-1 max-[980px]:min-h-80">
            {step === 0 ? (
              <div className="flex flex-col gap-[18px]">
                <InputField
                  label="ФИО кандидата"
                  placeholder="Антонова Екатерина Сергеевна"
                  maxLength={160}
                  error={errors.candidate?.fullName?.message}
                  {...register("candidate.fullName")}
                />
                <div className="grid grid-cols-2 items-start gap-4 max-sm:grid-cols-1">
                  <InputField
                    label="Дата рождения"
                    type="date"
                    error={errors.candidate?.birthDate?.message}
                    {...register("candidate.birthDate")}
                  />
                  <InputField
                    label="Время рождения"
                    type="time"
                    {...register("candidate.birthTime")}
                  />
                </div>
                <p className="-mt-1.5 font-ui text-[0.88rem] leading-snug text-muted">
                  Если время рождения неизвестно, оставьте поле пустым — в отчёте
                  будет соответствующая пометка.
                </p>
                <InputField
                  label="Город и регион рождения"
                  placeholder="Подольск, Московская область"
                  hint="Укажите город и регион или область — так проще однозначно определить место для расчёта."
                  error={errors.candidate?.birthPlace?.city?.message}
                  {...register("candidate.birthPlace.city")}
                />
              </div>
            ) : null}

            {step === 1 ? (
              <div className="grid grid-cols-1 gap-4">
                <InputField
                  label="Должность"
                  placeholder="Например: менеджер проектов"
                  error={errors.vacancy?.title?.message}
                  {...register("vacancy.title")}
                />
                <TextareaField
                  label="Описание компании"
                  rows={5}
                  placeholder="Культура, команда, формат работы, ценности..."
                  error={errors.vacancy?.companyDescription?.message}
                  {...register("vacancy.companyDescription")}
                />
                <TextareaField
                  label="Описание вакансии"
                  rows={7}
                  placeholder="Обязанности, навыки, ожидания от роли..."
                  error={errors.vacancy?.jobDescription?.message}
                  {...register("vacancy.jobDescription")}
                />
              </div>
            ) : null}

            {step === 2 ? (
              <div className="grid gap-[18px] rounded-3xl bg-white p-[22px]">
                <span className={eyebrowClasses}>Проверьте перед отправкой</span>
                <h2 className="m-0 font-accent text-2xl leading-tight tracking-tight text-ink">
                  {watch("candidate.fullName") || "Кандидат без имени"}
                </h2>
                <p className="m-0 font-main text-muted">
                  {watch("vacancy.title") || "Должность не указана"} ·{" "}
                  {watch("candidate.birthPlace.city")}
                </p>
                <label className="flex items-start gap-2.5 font-main text-muted">
                  <input className="mt-1.5" type="checkbox" {...register("consentAccepted")} />
                  <span>
                    Я согласен(на) на обработку введённых данных для
                    формирования отчёта.
                  </span>
                </label>
                {errors.consentAccepted ? (
                  <strong role="alert" className={alertClasses}>
                    Необходимо согласие на обработку данных.
                  </strong>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="mt-8 flex flex-col gap-4">
            {submitError ? (
              <p className={alertClasses} role="alert">
                {submitError}
              </p>
            ) : null}

            <div className={formActionsClasses}>
              <Button
                className="min-w-[136px] px-6 max-sm:flex-1"
                disabled={!canGoBack || analyzeIsSubmitting}
                onClick={() => setStep((value) => Math.max(value - 1, 0))}
                type="button"
                variant="secondary"
              >
                Назад
              </Button>
              {canGoNext ? (
                <Button
                  className="min-w-[156px] px-7 max-sm:flex-1"
                  onClick={goNext}
                  type="button"
                  variant="primary"
                >
                  Далее
                </Button>
              ) : (
                <Button
                  className="min-w-[190px] px-7 max-sm:flex-1"
                  disabled={analyzeIsSubmitting}
                  type="submit"
                >
                  {analyzeIsSubmitting ? "Считаем…" : "Начать"}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>

      <aside
        className={`${panelClasses} flex min-h-[700px] flex-col max-[980px]:min-h-0`}
        id="report-panel"
      >
        {result ? (
          <div className="flex h-full w-full flex-col gap-8 py-8 text-left sm:py-10">
            <header className="flex flex-col gap-3">
              <span className={eyebrowClasses}>Готово</span>
              <h2 className="m-0 font-accent text-2xl leading-snug tracking-tight text-ink">
                Отчёт сформирован
              </h2>
              <p className="m-0 max-w-none text-[1.02rem] leading-relaxed text-muted">
                Откройте полноэкранное окно с вердиктом, сильными сторонами, рисками и
                аргументами «за» и «против». Ниже можно сохранить копию на диск.
              </p>
            </header>

            <div className="flex flex-col gap-6 rounded-2xl border border-line bg-white/75 p-6 sm:p-7">
              <section className="flex flex-col gap-3">
                <h3 className="m-0 font-ui text-xs font-bold uppercase tracking-[0.08em] text-salmon-dark">
                  Просмотр
                </h3>
                <Button
                  className="w-full justify-center sm:w-fit sm:min-w-[200px]"
                  onClick={() => setReportOpen(true)}
                  type="button"
                >
                  Открыть отчёт
                </Button>
              </section>

              <div className="h-px w-full bg-line" role="presentation" />

              <section className="flex flex-col gap-4">
                <h3 className="m-0 font-ui text-xs font-bold uppercase tracking-[0.08em] text-salmon-dark">
                  Сохранить на компьютер
                </h3>
                <ReportExportMenu
                  candidateName={candidateName}
                  className="w-full"
                  result={result}
                  roleTitle={roleTitle}
                />
              </section>
            </div>
          </div>
        ) : analyzeIsSubmitting ? (
          <div
            aria-busy="true"
            aria-live="polite"
            className="flex min-h-[420px] flex-1 flex-col items-center justify-center gap-6 px-2 py-12 text-center"
          >
            <div
              aria-hidden="true"
              className="h-12 w-12 animate-spin rounded-full border-[3px] border-line border-t-salmon"
            />
            <div className="flex max-w-md flex-col gap-2">
              <span className={eyebrowClasses}>Идёт расчёт</span>
              <h2 className="m-0 font-accent text-xl leading-snug tracking-tight text-ink sm:text-2xl">
                Считаем натальную карту и текст отчёта
              </h2>
              <p className="m-0 font-main text-sm leading-relaxed text-muted">
                Открой модальное окно — там тоже виден статус. Обычно до минуты; при
                GigaChat возможна задержка.
              </p>
            </div>
          </div>
        ) : submitError ? (
          <div className="flex min-h-[420px] flex-1 flex-col justify-center gap-4 py-10">
            <span className={eyebrowClasses}>Ошибка</span>
            <h2 className="m-0 font-accent text-xl leading-snug text-ink sm:text-2xl">
              Отчёт не получился
            </h2>
            <p className={`m-0 max-w-xl font-main text-sm leading-relaxed ${alertClasses}`} role="alert">
              {submitError}
            </p>
            <p className="m-0 max-w-xl font-main text-sm leading-relaxed text-muted">
              Если <code className="rounded bg-black/8 px-1.5 py-0.5">VITE_API_URL</code> во frontend-проекте
              пустой, запросы идут на Vite и проксируются на backend по{" "}
              <code className="rounded bg-black/8 px-1.5 py-0.5">PORT</code> из{" "}
              <code className="rounded bg-black/8 px-1.5 py-0.5">apps/backend/.env</code>. В консоли
              dev-сервера будет строка{" "}
              <span className="break-words font-mono text-[0.85rem] text-ink/90">
                [synastry] vite proxy → …
              </span>
              .
            </p>
          </div>
        ) : (
          <div className="flex h-full flex-col gap-7">
            <div className="flex flex-col gap-3.5">
              <span className={eyebrowClasses}>Что получится</span>
              <h2 className="m-0 font-accent text-2xl leading-tight tracking-tight text-ink">
                Готовый разбор для решения по кандидату
              </h2>
              <p className="m-0 max-w-none font-main text-[1.02rem] leading-relaxed text-muted">
                Вердикт, плюсы и минусы, аргументы за и против — в удобном окне
                для обсуждения с командой.
              </p>
            </div>
            <ReportPreview />
          </div>
        )}
      </aside>
    </section>

    <ReportModal
      candidateName={candidateName}
      error={submitError}
      hasSubmissionFailed={analyzeSubmitFailed}
      loading={reportModalLoading}
      onClose={closeReport}
      open={reportOpen}
      result={result}
      roleTitle={roleTitle}
    />
    </>
  );
}
