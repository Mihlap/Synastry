import type { AnalyzeResponse } from "@synastry/contracts";
import {
  buildNatalChartHighlights,
  formatAspect,
  formatPlanetPosition,
} from "./natal-chart-display";
import { getArgumentGroups } from "./report-points";
import { verdictLabel } from "./report-labels";

export type ExportFormat = "pdf" | "html" | "md" | "txt" | "json";

export const exportFormatOptions: Array<{ id: ExportFormat; label: string }> = [
  { id: "pdf", label: "PDF (через печать)" },
  { id: "html", label: "HTML" },
  { id: "md", label: "Markdown" },
  { id: "txt", label: "Текст (TXT)" },
  { id: "json", label: "JSON" },
];

type ReportContext = {
  result: AnalyzeResponse;
  candidateName: string;
  roleTitle: string;
};

function sanitizeFilename(value: string) {
  return (
    value
      .trim()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "kandidat"
  );
}

function buildFilename(candidateName: string, extension: string) {
  const date = new Date().toISOString().slice(0, 10);
  return `synastry-${sanitizeFilename(candidateName)}-${date}.${extension}`;
}

function downloadTextFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob(["﻿", content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function listSection(title: string, items: string[], marker: string) {
  if (items.length === 0) {
    return "";
  }

  const lines = items.map((item) => `${marker} ${item}`).join("\n");
  return `## ${title}\n\n${lines}\n`;
}

function buildReportMarkdown({ result, candidateName, roleTitle }: ReportContext) {
  const { compatibility, natalChart, meta } = result;
  const argumentGroups = getArgumentGroups(compatibility);
  const analyzedAt = new Date(meta.analyzedAt).toLocaleString("ru-RU");
  const scoreLine =
    compatibility.score !== undefined ? `\n**Оценка:** ${compatibility.score}/100` : "";

  return [
    "# Отчёт Synastry",
    "",
    `**Кандидат:** ${candidateName}`,
    `**Должность:** ${roleTitle}`,
    `**Дата анализа:** ${analyzedAt}`,
    "",
    `## Итог: ${verdictLabel[compatibility.verdict]}${scoreLine}`,
    "",
    compatibility.summary,
    "",
    listSection("Сильные стороны", compatibility.pros, "+"),
    listSection("Риски и зоны внимания", compatibility.cons, "−"),
    listSection("Аргументы за кандидата", argumentGroups.for, "+"),
    listSection(
      "Аргументы против / что проверить",
      argumentGroups.against,
      "−",
    ),
    "## Натальная карта (справочно)",
    "",
    natalChart.summary,
    "",
    ...buildNatalChartHighlights(natalChart, meta.birthTimeAccuracy).map(
      (line) => `> ${line}`,
    ),
    "",
    "### Планеты",
    "",
    ...natalChart.positions.map((position) => `- ${formatPlanetPosition(position)}`),
    "",
    ...(natalChart.aspects.length > 0
      ? [
          "### Аспекты",
          "",
          ...natalChart.aspects.map((aspect) => `- ${formatAspect(aspect)}`),
          "",
        ]
      : []),
    "---",
    "",
    `${meta.disclaimer} Модель: ${meta.provider} / ${meta.model}.`,
  ]
    .filter((line) => line !== undefined)
    .join("\n");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function htmlList(title: string, items: string[], marker: string, markerClass: string) {
  if (items.length === 0) {
    return "";
  }

  const list = items
    .map(
      (item) =>
        `<li><span class="marker ${markerClass}">${marker}</span><span>${escapeHtml(item)}</span></li>`,
    )
    .join("");

  return `<section><h2>${escapeHtml(title)}</h2><ul>${list}</ul></section>`;
}

function buildReportHtml({ result, candidateName, roleTitle }: ReportContext) {
  const { compatibility, natalChart, meta } = result;
  const argumentGroups = getArgumentGroups(compatibility);
  const analyzedAt = new Date(meta.analyzedAt).toLocaleString("ru-RU");
  const scoreBadge =
    compatibility.score !== undefined
      ? `<span class="score">${compatibility.score}/100</span>`
      : "";

  const highlights = buildNatalChartHighlights(natalChart, meta.birthTimeAccuracy)
    .map((line) => `<li>${escapeHtml(line)}</li>`)
    .join("");
  const positions = natalChart.positions
    .map((position) => `<li>${escapeHtml(formatPlanetPosition(position))}</li>`)
    .join("");
  const aspectsList = natalChart.aspects
    .map((aspect) => `<li>${escapeHtml(formatAspect(aspect))}</li>`)
    .join("");
  const aspectsBlock = aspectsList
    ? `<h3>Аспекты</h3><ul>${aspectsList}</ul>`
    : "";

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <title>Отчёт Synastry — ${escapeHtml(candidateName)}</title>
  <style>
    body { font-family: "Segoe UI", Arial, sans-serif; color: #1d2e43; line-height: 1.55; margin: 32px; }
    h1 { font-size: 28px; margin: 0 0 8px; }
    .meta { color: #566272; margin-bottom: 24px; }
    .verdict { background: #f6f6f6; border: 1px solid #e5e8ec; border-radius: 16px; padding: 20px; margin-bottom: 24px; }
    .verdict h2 { margin: 0 0 12px; font-size: 22px; }
    .score { display: inline-block; margin-left: 12px; padding: 6px 12px; border-radius: 999px; background: #ff7f6a; color: #fff; font-weight: 700; }
    section { margin-bottom: 24px; }
    h2 { font-size: 18px; margin: 0 0 12px; }
    ul { list-style: none; padding: 0; margin: 0; }
    li { margin-bottom: 8px; }
    .marker { width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0; margin-right: 8px; }
    .marker.plus { background: #e8f4e0; color: #4a7a32; }
    .marker.minus { background: #fce8ee; color: #b0244a; }
    .footer { margin-top: 32px; font-size: 12px; color: #9b9c9e; }
    @media print { body { margin: 16px; } }
  </style>
</head>
<body>
  <h1>Отчёт Synastry</h1>
  <p class="meta"><strong>Кандидат:</strong> ${escapeHtml(candidateName)}<br />
  <strong>Должность:</strong> ${escapeHtml(roleTitle)}<br />
  <strong>Дата:</strong> ${escapeHtml(analyzedAt)}</p>
  <div class="verdict">
    <h2>Итог: ${escapeHtml(verdictLabel[compatibility.verdict])}${scoreBadge}</h2>
    <p>${escapeHtml(compatibility.summary)}</p>
  </div>
  ${htmlList("Сильные стороны", compatibility.pros, "+", "plus")}
  ${htmlList("Риски и зоны внимания", compatibility.cons, "−", "minus")}
  ${htmlList("Аргументы за кандидата", argumentGroups.for, "+", "plus")}
  ${htmlList("Аргументы против / что проверить", argumentGroups.against, "−", "minus")}
  <section>
    <h2>Натальная карта (справочно)</h2>
    <p>${escapeHtml(natalChart.summary)}</p>
    <ul>${highlights}</ul>
    <h3>Планеты</h3>
    <ul>${positions}</ul>
    ${aspectsBlock}
  </section>
  <p class="footer">${escapeHtml(meta.disclaimer)} Модель: ${escapeHtml(meta.provider)} / ${escapeHtml(meta.model)}.</p>
</body>
</html>`;
}

function printReportHtml(html: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement("iframe");

    iframe.setAttribute("aria-hidden", "true");
    iframe.tabIndex = -1;

    iframe.style.cssText = [
      "position:fixed",
      "left:-10000px",
      "top:0",
      "width:210mm",
      "min-height:297mm",
      "border:none",
      "opacity:0",
      "pointer-events:none",
    ].join(";");

    let cleaned = false;
    let fallbackTimeout: number | undefined;

    const cleanup = () => {
      if (cleaned) {
        return;
      }

      cleaned = true;

      if (fallbackTimeout !== undefined) {
        window.clearTimeout(fallbackTimeout);
      }

      iframe.remove();
    };

    iframe.addEventListener(
      "load",
      () => {
        const frameWindow = iframe.contentWindow;

        if (!frameWindow) {
          cleanup();
          reject(
            new Error(
              "Не удалось подготовить печать. Скачайте отчёт в «HTML», откройте файл и Ctrl+P → «Сохранить как PDF».",
            ),
          );
          return;
        }

        frameWindow.addEventListener("afterprint", cleanup, { once: true });

        window.setTimeout(() => {
          try {
            frameWindow.focus();
            frameWindow.print();
            resolve();
            fallbackTimeout = window.setTimeout(cleanup, 120_000);
          } catch {
            cleanup();
            reject(
              new Error(
                "Печать недоступна. Скачайте «HTML», откройте файл и сохраните как PDF через меню браузера.",
              ),
            );
          }
        }, 150);
      },
      { once: true },
    );

    document.body.appendChild(iframe);
    iframe.srcdoc = html;
  });
}

export async function exportReport(format: ExportFormat, context: ReportContext): Promise<void> {
  const { candidateName } = context;
  const markdown = buildReportMarkdown(context);
  const html = buildReportHtml(context);

  switch (format) {
    case "json":
      downloadTextFile(
        JSON.stringify(context.result, null, 2),
        buildFilename(candidateName, "json"),
        "application/json",
      );
      return;
    case "md":
      downloadTextFile(markdown, buildFilename(candidateName, "md"), "text/markdown");
      return;
    case "txt":
      downloadTextFile(markdown, buildFilename(candidateName, "txt"), "text/plain");
      return;
    case "html":
      downloadTextFile(html, buildFilename(candidateName, "html"), "text/html");
      return;
    case "pdf":
      await printReportHtml(html);
      return;
    default:
      format satisfies never;
  }
}
