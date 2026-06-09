import type { Guidance } from "@/types/health";

export type PrintableSection = {
  heading: string;
  rows?: Array<[string, string | number | boolean | null | undefined]>;
  paragraphs?: Array<string | null | undefined>;
  bullets?: Array<string | null | undefined>;
};

export const safetyDisclaimer = "This AI system does not replace professional medical advice.";

function escapeHtml(value: string | number | boolean | null | undefined) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function printableValue(value: string | number | boolean | null | undefined) {
  if (value === null || value === undefined || value === "") return "Not provided";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

export function formatPdfDate(value?: string) {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

export function compactText(value: string, maxLength = 260) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 3)}...`;
}

export function guidanceBullets(guidance: Guidance | null | undefined) {
  if (!guidance) {
    return ["AI explanation has not been generated for this report yet."];
  }

  return [
    `Possible condition: ${guidance.possibleCondition}`,
    `Risk level: ${guidance.riskLevel}`,
    `Explanation: ${guidance.explanation}`,
    `Recommendation: ${guidance.recommendation}`,
    guidance.emergencyAction ? `Emergency action: ${guidance.emergencyAction}` : "",
    `Disclaimer: ${guidance.disclaimer || safetyDisclaimer}`
  ];
}

function renderPrintableSections(sections: PrintableSection[]) {
  return sections
    .map((section) => {
      const rows = (section.rows || [])
        .map(
          ([label, value]) => `
            <div class="row">
              <span>${escapeHtml(label)}</span>
              <strong>${escapeHtml(printableValue(value))}</strong>
            </div>
          `
        )
        .join("");
      const paragraphs = (section.paragraphs || [])
        .filter(Boolean)
        .map((paragraph) => `<p class="paragraph">${escapeHtml(paragraph)}</p>`)
        .join("");
      const bullets = (section.bullets || [])
        .filter(Boolean)
        .map((item) => `<li>${escapeHtml(item)}</li>`)
        .join("");

      return `
        <section class="section">
          <h2>${escapeHtml(section.heading)}</h2>
          ${rows ? `<div class="rows">${rows}</div>` : ""}
          ${paragraphs}
          ${bullets ? `<ul>${bullets}</ul>` : ""}
        </section>
      `;
    })
    .join("");
}

export function openPrintablePdf({
  title,
  subtitle,
  patientName,
  exportedAt,
  sections
}: {
  title: string;
  subtitle: string;
  patientName: string;
  exportedAt: string;
  sections: PrintableSection[];
}) {
  const printWindow = window.open("", "_blank", "width=920,height=720");
  if (!printWindow) return false;

  const html = `<!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${escapeHtml(title)}</title>
        <style>
          @page { margin: 18mm; }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            background: #f8fafc;
            color: #0f172a;
            font-family: Inter, "Noto Sans Bengali", "Nirmala UI", Arial, sans-serif;
            line-height: 1.55;
          }
          main {
            max-width: 860px;
            margin: 0 auto;
            padding: 32px;
          }
          .document {
            background: #ffffff;
            border: 1px solid #dbeafe;
            border-radius: 18px;
            box-shadow: 0 20px 60px rgba(37, 99, 235, 0.12);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #2563eb, #10b981);
            color: #ffffff;
            padding: 30px;
          }
          .eyebrow {
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            opacity: 0.86;
          }
          h1 {
            margin: 8px 0 6px;
            font-size: 30px;
            line-height: 1.15;
          }
          .subtitle {
            margin: 0;
            max-width: 680px;
            opacity: 0.92;
          }
          .meta {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 12px;
            padding: 18px 30px;
            border-bottom: 1px solid #dbeafe;
            background: #eff6ff;
          }
          .meta div,
          .row {
            border: 1px solid #dbeafe;
            border-radius: 12px;
            background: #ffffff;
            padding: 10px 12px;
          }
          .meta span,
          .row span {
            display: block;
            color: #64748b;
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
          }
          .meta strong,
          .row strong {
            display: block;
            margin-top: 3px;
            font-size: 13px;
            word-break: break-word;
          }
          .content {
            padding: 26px 30px 30px;
          }
          .section {
            break-inside: avoid;
            margin-top: 20px;
            padding-top: 18px;
            border-top: 1px solid #e2e8f0;
          }
          .section:first-child {
            margin-top: 0;
            padding-top: 0;
            border-top: 0;
          }
          h2 {
            margin: 0 0 12px;
            font-size: 17px;
          }
          .rows {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
          }
          .paragraph {
            margin: 10px 0 0;
            white-space: pre-wrap;
            color: #334155;
            font-size: 13px;
          }
          ul {
            margin: 10px 0 0;
            padding-left: 20px;
          }
          li {
            margin: 6px 0;
            color: #334155;
            font-size: 13px;
          }
          .disclaimer {
            margin-top: 22px;
            border: 1px solid #fecaca;
            border-radius: 14px;
            background: #fef2f2;
            color: #991b1b;
            padding: 14px 16px;
            font-size: 12px;
            font-weight: 800;
          }
          .print-note {
            margin: 16px 0 0;
            color: #64748b;
            font-size: 12px;
          }
          @media print {
            body { background: #ffffff; }
            main { max-width: none; padding: 0; }
            .document { border: 0; border-radius: 0; box-shadow: none; }
            .print-note { display: none; }
          }
          @media (max-width: 720px) {
            main { padding: 14px; }
            .meta,
            .rows { grid-template-columns: 1fr; }
            .header,
            .content,
            .meta { padding-left: 18px; padding-right: 18px; }
          }
        </style>
      </head>
      <body>
        <main>
          <article class="document">
            <header class="header">
              <div class="eyebrow">AI Healthcare Assistant</div>
              <h1>${escapeHtml(title)}</h1>
              <p class="subtitle">${escapeHtml(subtitle)}</p>
            </header>
            <div class="meta">
              <div><span>Patient</span><strong>${escapeHtml(patientName)}</strong></div>
              <div><span>Generated</span><strong>${escapeHtml(formatPdfDate(exportedAt))}</strong></div>
              <div><span>Format</span><strong>Print-ready PDF</strong></div>
            </div>
            <div class="content">
              ${renderPrintableSections(sections)}
              <div class="disclaimer">${escapeHtml(safetyDisclaimer)}</div>
              <p class="print-note">Use the print dialog to save or download this document as a PDF.</p>
            </div>
          </article>
        </main>
      </body>
    </html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 350);
  return true;
}
