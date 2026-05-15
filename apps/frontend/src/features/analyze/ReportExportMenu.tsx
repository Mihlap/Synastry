import type { AnalyzeResponse } from "@synastry/contracts";
import { useState } from "react";
import { Button } from "../../shared/ui/Button";
import { exportFormatOptions, exportReport, type ExportFormat } from "./export-report";

type ReportExportMenuProps = {
  result: AnalyzeResponse;
  candidateName: string;
  roleTitle: string;
  className?: string;
};

const selectClasses =
  "min-h-[44px] w-full cursor-pointer rounded-2xl border border-line bg-white/90 py-3 pl-4 pr-12 font-ui text-sm text-ink outline-none [-webkit-appearance:none] appearance-none bg-[length:14px_10px] bg-[right_1rem_center] bg-no-repeat [background-image:url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2214%22%20height%3D%229%22%20viewBox%3D%220%200%2014%209%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M1%201.75L7%207.75L13%201.75%22%20stroke%3D%22%23566272%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] focus:border-salmon focus:shadow-[0_0_0_4px_rgb(255_127_106/0.16)]";

export function ReportExportMenu({
  result,
  candidateName,
  roleTitle,
  className = "",
}: ReportExportMenuProps) {
  const [format, setFormat] = useState<ExportFormat>("pdf");
  const [hint, setHint] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      await exportReport(format, { result, candidateName, roleTitle });
      setHint(
        format === "pdf"
          ? "Должно открыться окно печати. В списке принтеров выберите «Сохранить как PDF» или «Microsoft Print to PDF», затем «Сохранить»."
          : "Файл сохранён на компьютер.",
      );
    } catch (error) {
      setHint(error instanceof Error ? error.message : "Не удалось сохранить файл.");
    }
  };

  return (
    <div className={`flex flex-col gap-4 ${className}`.trim()}>
      <div className="flex flex-col gap-3">
        <label className="font-ui text-[0.8125rem] font-semibold text-ink" htmlFor="report-export-format">
          Формат файла
        </label>
        <select
          className={selectClasses}
          id="report-export-format"
          onChange={(event) => {
            setFormat(event.target.value as ExportFormat);
            setHint(null);
          }}
          value={format}
        >
          {exportFormatOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
        <Button
          className="w-full justify-center sm:w-fit sm:self-start sm:min-w-[160px]"
          onClick={handleExport}
          type="button"
          variant="primary"
        >
          Сохранить
        </Button>
      </div>
      {format === "pdf" ? (
        <p className="m-0 text-[0.8125rem] leading-relaxed text-muted">
          Окно печати браузера — это не новая вкладка. Выберите в списке принтеров
          пункт «Сохранить как PDF», затем место сохранения.
        </p>
      ) : null}
      {hint ? (
        <p className="m-0 rounded-xl border border-line bg-white/80 p-3 text-[0.8125rem] leading-relaxed text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
