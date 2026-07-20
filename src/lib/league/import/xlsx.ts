// Lettura di file XLSX/XLS → matrice di stringhe (solo lato server).
// Usa exceljs; il risultato viene poi passato ai parser puri di parse.ts.
import ExcelJS from "exceljs";

function cellToString(v: unknown): string {
  if (v == null) return "";
  if (v instanceof Date) return v.toLocaleDateString("it-IT");
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    if (typeof o.text === "string") return o.text;
    if (Array.isArray(o.richText)) {
      return (o.richText as { text?: string }[]).map((r) => r.text ?? "").join("");
    }
    if ("result" in o && o.result != null) return String(o.result);
    if ("hyperlink" in o && typeof o.text === "string") return o.text;
    return "";
  }
  return String(v);
}

export async function xlsxToRows(data: ArrayBuffer): Promise<string[][]> {
  const wb = new ExcelJS.Workbook();
  // Cast al tipo esatto atteso da exceljs: i generici Buffer di @types/node
  // recente non combaciano con la firma di exceljs, quindi allineiamo qui.
  const loadArg = Buffer.from(data) as unknown as Parameters<typeof wb.xlsx.load>[0];
  await wb.xlsx.load(loadArg);
  const ws = wb.worksheets[0];
  if (!ws) return [];

  const rows: string[][] = [];
  ws.eachRow({ includeEmpty: false }, (row) => {
    // row.values è 1-indexed (l'indice 0 è sempre vuoto): preserva le posizioni
    // di colonna riempiendo i buchi con "".
    const values = row.values as unknown[];
    const cells: string[] = [];
    for (let i = 1; i < values.length; i++) {
      cells.push(cellToString(values[i]));
    }
    rows.push(cells);
  });
  return rows;
}
