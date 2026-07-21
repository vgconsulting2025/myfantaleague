import { NextResponse } from "next/server";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { getLeagueRepository } from "@/lib/league/repository";
import { validatePlayerImage, extForMime } from "@/lib/league/uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "players");

async function removeIfLocal(imageUrl: string | null | undefined) {
  if (!imageUrl || !imageUrl.startsWith("/uploads/players/")) return;
  const abs = path.join(process.cwd(), "public", imageUrl.replace(/^\/+/, ""));
  try {
    await unlink(abs);
  } catch {
    // il file potrebbe non esistere: ignora
  }
}

// POST /api/players/:id/image — carica un'immagine per un giocatore della propria rosa.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const repo = getLeagueRepository();
  try {
    const { id } = await params;
    const found = await repo.getPlayerById(id);
    if (!found) return NextResponse.json({ error: "Giocatore non trovato." }, { status: 404 });
    if (!found.isUser) {
      return NextResponse.json(
        { error: "Puoi caricare immagini solo per i giocatori della tua rosa." },
        { status: 403 },
      );
    }

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Nessun file caricato." }, { status: 400 });
    }
    const valid = validatePlayerImage(file.type, file.size);
    if (!valid.ok) return NextResponse.json({ error: valid.error }, { status: 400 });
    const ext = extForMime(file.type);
    if (!ext) return NextResponse.json({ error: "Formato non valido." }, { status: 400 });

    await mkdir(UPLOAD_DIR, { recursive: true });
    await removeIfLocal(found.player.imageUrl);

    const filename = `${id}-${Date.now()}.${ext}`;
    await writeFile(path.join(UPLOAD_DIR, filename), Buffer.from(await file.arrayBuffer()));
    const imageUrl = `/uploads/players/${filename}`;
    await repo.setPlayerImage(id, imageUrl);

    return NextResponse.json({ ok: true, imageUrl });
  } catch (err) {
    console.error("[/api/players/:id/image POST]", err);
    return NextResponse.json({ error: "Upload non riuscito. Riprova." }, { status: 500 });
  }
}

// DELETE /api/players/:id/image — rimuove l'immagine e torna all'avatar generato.
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const repo = getLeagueRepository();
  try {
    const { id } = await params;
    const found = await repo.getPlayerById(id);
    if (!found) return NextResponse.json({ error: "Giocatore non trovato." }, { status: 404 });
    if (!found.isUser) {
      return NextResponse.json({ error: "Operazione non consentita." }, { status: 403 });
    }
    await removeIfLocal(found.player.imageUrl);
    await repo.setPlayerImage(id, null);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/players/:id/image DELETE]", err);
    return NextResponse.json({ error: "Rimozione non riuscita." }, { status: 500 });
  }
}
