import { zodResolver } from "@hookform/resolvers/zod";
import type { AnalyzeRequest, AnalyzeResponse } from "@synastry/contracts";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAnalyzeMutation, useGetProvidersQuery } from "../../shared/api/base-api";
import { Button } from "../../shared/ui/Button";
import { InputField, TextareaField } from "../../shared/ui/Field";
import { CompatibilityReport } from "./CompatibilityReport";
import { analyzeFormSchema, defaultAnalyzeValues } from "./analyze-form";

const steps = ["Кандидат", "Вакансия", "Проверка"] as const;

export function AnalyzeWizard() {
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const providers = useGetProvidersQuery();
  const [analyze, analyzeState] = useAnalyzeMutation();
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<AnalyzeRequest>({
    resolver: zodResolver(analyzeFormSchema),
    defaultValues: defaultAnalyzeValues,
    mode: "onBlur",
  });

  const selectedProvider =
    providers.data?.providers[0] ?? {
      id: "gigachat",
      name: "GigaChat",
      models: ["GigaChat"],
    };

  const submit = handleSubmit(async (values) => {
    const response = await analyze(values).unwrap();
    setResult(response);
  });

  const canGoBack = step > 0;
  const canGoNext = step < steps.length - 1;

  return (
    <section className="workspace" id="analysis">
      <div className="panel form-panel">
        <div className="stepper" aria-label="Шаги анализа">
          {steps.map((label, index) => (
            <button
              className={index === step ? "step active" : "step"}
              key={label}
              onClick={() => setStep(index)}
              type="button"
            >
              <span>{index + 1}</span>
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={submit}>
          {step === 0 ? (
            <div className="form-grid">
              <InputField
                label="ФИО кандидата"
                placeholder="Анна Смирнова"
                error={errors.candidate?.fullName?.message}
                {...register("candidate.fullName")}
              />
              <InputField
                label="Дата рождения"
                type="date"
                error={errors.candidate?.birthDate?.message}
                {...register("candidate.birthDate")}
              />
              <InputField
                label="Время рождения"
                type="time"
                hint="Если неизвестно, оставьте пустым. В отчёте будет предупреждение."
                {...register("candidate.birthTime")}
              />
              <InputField
                label="Город рождения"
                error={errors.candidate?.birthPlace?.city?.message}
                {...register("candidate.birthPlace.city")}
              />
              <InputField
                label="Широта"
                type="number"
                step="0.0001"
                {...register("candidate.birthPlace.latitude", {
                  valueAsNumber: true,
                })}
              />
              <InputField
                label="Долгота"
                type="number"
                step="0.0001"
                {...register("candidate.birthPlace.longitude", {
                  valueAsNumber: true,
                })}
              />
            </div>
          ) : null}

          {step === 1 ? (
            <div className="form-grid single">
              <InputField
                label="Должность"
                placeholder="Frontend Engineer"
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
                placeholder="Обязанности, hard/soft skills, ожидания от роли..."
                error={errors.vacancy?.jobDescription?.message}
                {...register("vacancy.jobDescription")}
              />
            </div>
          ) : null}

          {step === 2 ? (
            <div className="review-card">
              <span className="eyebrow">Проверьте перед отправкой</span>
              <h2>{watch("candidate.fullName") || "Кандидат без имени"}</h2>
              <p>
                {watch("vacancy.title") || "Должность не указана"} ·{" "}
                {watch("candidate.birthPlace.city")}
              </p>
              <label className="field">
                <span>ИИ-провайдер</span>
                <select
                  {...register("options.providerId")}
                  onChange={(event) => {
                    setValue("options.providerId", event.target.value);
                  }}
                >
                  <option value={selectedProvider.id}>{selectedProvider.name}</option>
                </select>
              </label>
              <label className="consent">
                <input type="checkbox" {...register("consentAccepted")} />
                <span>
                  Я подтверждаю согласие на обработку введённых данных для
                  формирования отчёта.
                </span>
              </label>
              {errors.consentAccepted ? (
                <strong role="alert" className="form-error">
                  Необходимо согласие на обработку данных.
                </strong>
              ) : null}
            </div>
          ) : null}

          <div className="form-actions">
            <Button
              disabled={!canGoBack || analyzeState.isLoading}
              onClick={() => setStep((value) => Math.max(value - 1, 0))}
              type="button"
              variant="secondary"
            >
              Назад
            </Button>
            {canGoNext ? (
              <Button
                onClick={() => setStep((value) => Math.min(value + 1, steps.length - 1))}
                type="button"
                variant="primary"
              >
                Далее
              </Button>
            ) : (
              <Button disabled={analyzeState.isLoading} type="submit">
                {analyzeState.isLoading ? "Анализируем..." : "Получить анализ"}
              </Button>
            )}
          </div>
        </form>

        {analyzeState.isError ? (
          <p className="form-error" role="alert">
            Не удалось получить анализ. Проверьте API и попробуйте снова.
          </p>
        ) : null}
      </div>

      <aside className="panel insight-panel">
        {result ? (
          <CompatibilityReport result={result} />
        ) : (
          <div className="empty-state">
            <span className="eyebrow">Что получится</span>
            <h2>Человечный отчёт без ощущения машинного шаблона</h2>
            <p>
              Synastry аккуратно соединяет описание роли, контекст компании и
              натальную карту. Итог помогает подготовиться к интервью, а не
              заменить его.
            </p>
            <div className="mini-grid">
              <span>Аргументы</span>
              <span>Риски</span>
              <span>Рекомендации HR</span>
              <span>Disclaimer</span>
            </div>
          </div>
        )}
      </aside>
    </section>
  );
}
