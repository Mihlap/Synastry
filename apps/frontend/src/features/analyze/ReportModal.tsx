import type { AnalyzeResponse } from "@synastry/contracts";
import { useEffect } from "react";
import { Button } from "../../shared/ui/Button";
import { CompatibilityReport } from "./CompatibilityReport";
import { ReportExportMenu } from "./ReportExportMenu";

type ReportModalProps = {
  open: boolean;
  loading: boolean;
  error: string | null;
  hasSubmissionFailed?: boolean;
  result: AnalyzeResponse | null;
  candidateName: string;
  roleTitle: string;
  onClose: () => void;
};

export function ReportModal({
  open,
  loading,
  error,
  hasSubmissionFailed = false,
  result,
  candidateName,
  roleTitle,
  onClose,
}: ReportModalProps) {
  const failureMessage =
    typeof error === "string" && error.trim().length > 0
      ? error.trim()
      : "Не удалось получить отчёт. Попробуйте ещё раз.";

  const showError = Boolean(hasSubmissionFailed) && !loading;
  const showReport = Boolean(result) && !loading && !hasSubmissionFailed;
  const showIdle =
    !loading && !showError && !showReport;

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-6"
      role="presentation"
    >
      <button
        aria-label="Закрыть отчёт"
        className="absolute inset-0 bg-ink/45 backdrop-blur-sm"
        onClick={onClose}
        type="button"
      />

      <div
        aria-labelledby="report-modal-title"
        aria-modal="true"
        className="relative flex max-h-[min(92vh,900px)] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] border border-line bg-paper shadow-panel"
        role="dialog"
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-7 sm:py-5">
          <div className="min-w-0">
            <p className="m-0 font-ui text-[0.78rem] font-bold tracking-[0.1em] text-salmon-dark uppercase">
              Отчёт по кандидату
            </p>
            <h2
              className="m-0 mt-1 truncate font-accent text-xl leading-tight text-ink sm:text-2xl"
              id="report-modal-title"
            >
              {candidateName}
            </h2>
            <p className="m-0 mt-1 truncate font-main text-sm text-muted">{roleTitle}</p>
            {loading ? (
              <p className="m-0 mt-3 font-main text-sm leading-snug text-muted" role="status">
                Расчёт натальной карты и запрос текста отчёта — подождите, ниже появится результат.
              </p>
            ) : null}
          </div>
          <Button onClick={onClose} type="button" variant="secondary">
            Закрыть
          </Button>
        </header>

        <div className="min-h-[320px] flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
          {loading ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 text-center">
              <div
                aria-hidden="true"
                className="h-11 w-11 animate-spin rounded-full border-[3px] border-line border-t-salmon"
              />
              <div className="space-y-1">
                <p className="m-0 font-accent text-lg text-ink">Собираем отчёт</p>
                <p className="m-0 font-main text-sm text-muted">
                  Обычно 1–3 минуты (редко дольше).
                </p>
              </div>
            </div>
          ) : null}

          {showError ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 text-center">
              <p className="m-0 font-accent text-lg text-crimson">Не удалось получить отчёт</p>
              <p className="m-0 max-w-md font-main text-sm leading-relaxed text-muted">{failureMessage}</p>
              <p className="m-0 font-ui text-xs text-muted-light">
                Запуск: npm run dev:backend из корня. В dev можно не задавать VITE_API_URL — см. сообщение справа
                после ошибки.
              </p>
            </div>
          ) : null}

          {showReport && result ? <CompatibilityReport result={result} variant="modal" /> : null}

          {showIdle ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
              <p className="m-0 font-main text-sm text-muted">
                Отчёт ещё не загружен. Закройте окно и нажмите «Начать» в форме.
              </p>
            </div>
          ) : null}
        </div>

        {showReport && result ? (
          <footer className="shrink-0 border-t border-line px-5 py-4 sm:px-7">
            <ReportExportMenu
              candidateName={candidateName}
              result={result}
              roleTitle={roleTitle}
            />
          </footer>
        ) : null}
      </div>
    </div>
  );
}
