import { NextResponse } from "next/server";
import { parseDelimited, interpretRoster, interpretCalendar } from "@/lib/league/import/parse";
import { xlsxToRows } from "@/lib/league/import/xlsx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/import/preview
// Accetta un file (multipart: `file` + `kind`) oppure testo incollato
// (JSON: { kind, text }). Restituisce l'anteprima strutturata + warning/errori.
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let kind = "";
    let rows: string[][] = [];

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      kind = String(form.get("kind") || "");
      const file = form.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "Nessun file caricato." }, { status: 400 });
      }
      const filename = file.name.toLowerCase();
      if (filename.endsWith(".xlsx") || filename.endsWith(".xls")) {
        rows = await xlsxToRows(await file.arrayBuffer());
      } else {
        rows = parseDelimited(await file.text());
      }
    } else {
      const body = await request.json();
      kind = String(body?.kind || "");
      const text = String(body?.text || "");
      if (!text.trim()) {
        return NextResponse.json({ error: "Nessun dato da analizzare." }, { status: 400 });
      }
      rows = parseDelimited(text);
    }

    if (kind !== "roster" && kind !== "calendar") {
      return NextResponse.json({ error: "Tipo di import non valido." }, { status: 400 });
    }
    if (!rows.length) {
      return NextResponse.json(
        { error: "Nessuna riga trovata: il file sembra vuoto o in un formato non leggibile." },
        { status: 400 },
      );
    }

    const preview = kind === "roster" ? interpretRoster(rows) : interpretCalendar(rows);
    return NextResponse.json({ preview });
  } catch (err) {
    console.error("[/api/import/preview]", err);
    return NextResponse.json(
      { error: "Impossibile leggere i dati. Controlla il formato (CSV, XLSX o testo tabellare)." },
      { status: 400 },
    );
  }
}
