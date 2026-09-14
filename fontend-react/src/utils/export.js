import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { saveAs } from "file-saver";

function normalize(sections) {
  return (sections || [])
    .filter(Boolean)
    .map((s) => ({
      title: s.title || "",
      columns: s.columns || [],
      rows: s.rows || [],
    }));
}

function cellValue(row, col) {
  let v = row[col.key];
  if (typeof v === "object" && v !== null) v = v.name ?? v.label ?? JSON.stringify(v);
  const raw = v === null || v === undefined || v === "" ? "—" : String(v);
  return raw.replace(/<[^>]*>/g, "").trim();
}

function sanitizeName(name) {
  return name.replace(/[^\w\-. ]/g, "_");
}

function nowStamp() {
  return new Date().toISOString().slice(0, 10);
}

function buildCsv(sections) {
  const lines = [];
  parts(sections).forEach((s) => {
    if (s.title) lines.push(s.title);
    if (s.columns.length) {
      lines.push(s.columns.map((c) => `"${String(c.label).replace(/"/g, '""')}"`).join(","));
      s.rows.forEach((r) => {
        lines.push(s.columns.map((c) => `"${cellValue(r, c).replace(/"/g, '""')}"`).join(","));
      });
    }
    lines.push("");
  });
  return lines.join("\n");
}

function parts(sections) {
  return normalize(sections);
}

// ─── CSV ────────────────────────────────────────────────────────────────
export function exportCSV(filename, sections) {
  const blob = new Blob(["\uFEFF" + buildCsv(sections)], { type: "text/csv;charset=utf-8;" });
  saveAs(blob, `${sanitizeName(filename)}_${nowStamp()}.csv`);
}

// ─── Excel (.xlsx) ──────────────────────────────────────────────────────
export function exportExcel(filename, sections) {
  const wb = XLSX.utils.book_new();
  const list = parts(sections);
  if (list.length === 0) {
    const ws = XLSX.utils.aoa_to_sheet([[]]);
    XLSX.utils.book_append_sheet(wb, ws, "Report");
  } else {
    list.forEach((s, i) => {
      const header = s.columns.map((c) => c.label);
      const rows = s.rows.map((r) => s.columns.map((c) => cellValue(r, c)));
      let aoa = [];
      if (s.title) aoa.push([s.title]);
      aoa.push(header);
      rows.forEach((r) => aoa.push(r));
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      if (s.columns.length) ws["!cols"] = s.columns.map(() => ({ wch: 22 }));
      XLSX.utils.book_append_sheet(wb, ws, s.title ? s.title.slice(0, 31) : `Sheet ${i + 1}`);
    });
  }
  XLSX.writeFile(wb, `${sanitizeName(filename)}_${nowStamp()}.xlsx`);
}

// ─── PDF ────────────────────────────────────────────────────────────────
export function exportPDF(filename, heading, subheading, sections) {
  const landscape = parts(sections).some((s) => (s.columns || []).length > 6);
  const doc = new jsPDF({ orientation: landscape ? "landscape" : "portrait" });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(16);
  doc.setTextColor(31, 41, 55);
  doc.text(heading || "Report", 14, 20);
  if (subheading) {
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(doc.splitTextToSize(subheading, pageWidth - 28), 14, 27);
  }
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Generated ${new Date().toLocaleString()}`, pageWidth - 14, 12, { align: "right" });

  let y = subheading ? 38 : 31;
  parts(sections).forEach((s) => {
    doc.setFontSize(12);
    doc.setTextColor(79, 70, 229);
    doc.text(s.title || "Section", 14, y);
    autoTable(doc, {
      head: [s.columns.map((c) => c.label)],
      body: s.rows.map((r) => s.columns.map((c) => cellValue(r, c))),
      startY: y + 3,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [30, 41, 59], fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable?.finalY + 8 || (y + 20);
  });

  doc.save(`${sanitizeName(filename)}_${nowStamp()}.pdf`);
}

// ─── Word (.doc) ────────────────────────────────────────────────────────
export function exportWord(filename, heading, subheading, sections) {
  const esc = (v) => String(v ?? "—").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const body = parts(sections)
    .map((s) => {
      if (!s.columns.length) return `<p style="font-size:12px;font-family:Calibri,Arial,sans-serif;">${esc(s.title)}</p>`;
      const thead = s.columns.map((c) => `<th style="border:1px solid #cbd5e1;padding:5px 8px;background:#1e293b;color:#fff;font-size:10px;text-align:left;">${esc(c.label)}</th>`).join("");
      const tbody = s.rows
        .map((r) => `<tr>${s.columns.map((c) => `<td style="border:1px solid #cbd5e1;padding:5px 8px;font-size:10px;">${esc(cellValue(r, c))}</td>`).join("")}</tr>`)
        .join("");
      const tTitle = s.title ? `<h3 style="font-family:Calibri,Arial,sans-serif;color:#4f46e5;font-size:13px;">${esc(s.title)}</h3>` : "";
      return `${tTitle}<table style="border-collapse:collapse;width:100%;font-family:Calibri,Arial,sans-serif;">${thead ? `<thead><tr>${thead}</tr></thead>` : ""}<tbody>${tbody}</tbody></table><br/>`;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8" />
  <title>${esc(filename)}</title>
</head>
<body>
  <div style="font-family:Calibri,Arial,sans-serif;color:#0f172a;">
    <h1 style="font-size:24px;margin:0 0 4px;">${esc(heading || "Report")}</h1>
    ${subheading ? `<p style="font-size:12px;color:#64748b;margin:0 0 12px;">${esc(subheading)}</p>` : ""}
    <p style="font-size:10px;color:#94a3b8;">Generated ${esc(new Date().toLocaleString())}</p>
    ${body}
  </div>
</body>
</html>`;

  const blob = new Blob(["\uFEFF" + html], { type: "application/msword" });
  saveAs(blob, `${sanitizeName(filename)}_${nowStamp()}.doc`);
}

// ─── Plain text summary for quick copy ──────────────────────────────────
export function buildTextSummary(heading, sections) {
  const out = [`# ${heading}`, `Generated ${new Date().toLocaleString()}`, ""];
  parts(sections).forEach((s) => {
    out.push(`## ${s.title || "Section"}`);
    if (s.columns.length) {
      out.push(s.columns.map((c) => c.label).join(" | "));
      out.push(s.columns.map(() => "---").join(" | "));
      s.rows.forEach((r) => out.push(s.columns.map((c) => cellValue(r, c)).join(" | ")));
    }
    out.push("");
  });
  return out.join("\n");
}