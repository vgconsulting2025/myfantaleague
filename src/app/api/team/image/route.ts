import { NextResponse } from "next/server";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { getLeagueRepository } from "@/lib/league/repository";
import type { TeamImageKind } from "@/lib/league/repository";
import { validatePlayerImage, extForMime } from "@/lib/league/uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "teams");
const KINDS: TeamImageKind[] = ["crest", "jerseyFront", "jerseyBack"];

async function removeIfLocal(url: string | null | undefined) {
  if (!url || !url.startsWith("/uploads/")) return;
  try {
    await unlink(path.join(process.cwd(), "public", url.replace(/^\/+/, "")));
  } catch {
    // ignora
  }
}

function currentUrl(
  team: { crestUrl?: string | null; jerseyFrontUrl?: string | null; jerseyBackUrl?: string | null },
  kind: TeamImageKind,
): string | null | undefined {
  return kind === "crest" ? team.crestUrl : kind === "jerseyFront" ? team.jerseyFrontUrl : team.jerseyBackUrl;
}

// POST /api/team/image — carica stemma / maglia (fronte|retro) per la propria squadra.
export async function POST(request: Request) {
  const repo = getLeagueRepository();
  try {
    const form = await request.formData();
    const kind = String(form.get("kind") || "");
    if (!KINDS.includes(kind as TeamImageKind)) {
      return NextResponse.json({ error: "Tipo immagine non valido." }, { status: 400 });
    }
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Nessun file caricato." }, { status: 400 });
    }
    const valid = validatePlayerImage(file.type, file.size);
    if (!valid.ok) return NextResponse.json({ error: valid.error }, { status: 400 });
    const ext = extForMime(file.type);
    if (!ext) return NextResponse.json({ error: "Formato non valido." }, { status: 400 });

    const user = await repo.getUserTeam();
    if (kind === "jerseyBack" && !user.jerseyFrontUrl) {
      return NextResponse.json(
        { error: "Carica prima la maglia (fronte), poi potrai aggiungere il retro." },
        { status: 400 },
      );
    }

    await mkdir(UPLOAD_DIR, { recursive: true });
    await removeIfLocal(currentUrl(user, kind as TeamImageKind));
    const filename = `${user.slug}-${kind}-${Date.now()}.${ext}`;
    await writeFile(path.join(UPLOAD_DIR, filename), Buffer.from(await file.arrayBuffer()));
    const url = `/uploads/teams/${filename}`;
    await repo.setUserTeamImage(kind as TeamImageKind, url);

    return NextResponse.json({ ok: true, url });
  } catch (err) {
    console.error("[/api/team/image POST]", err);
    return NextResponse.json({ error: "Upload non riuscito. Riprova." }, { status: 500 });
  }
}

// DELETE /api/team/image?kind=... — rimuove l'asset (rimuovendo il fronte si rimuove anche il retro).
export async function DELETE(request: Request) {
  const repo = getLeagueRepository();
  try {
    const kind = new URL(request.url).searchParams.get("kind") || "";
    if (!KINDS.includes(kind as TeamImageKind)) {
      return NextResponse.json({ error: "Tipo immagine non valido." }, { status: 400 });
    }
    const user = await repo.getUserTeam();
    await removeIfLocal(currentUrl(user, kind as TeamImageKind));
    await repo.setUserTeamImage(kind as TeamImageKind, null);
    if (kind === "jerseyFront" && user.jerseyBackUrl) {
      await removeIfLocal(user.jerseyBackUrl);
      await repo.setUserTeamImage("jerseyBack", null);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/team/image DELETE]", err);
    return NextResponse.json({ error: "Rimozione non riuscita." }, { status: 500 });
  }
}
