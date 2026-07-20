// Seed della lega dimostrativa: 6 squadre, ~15 giocatori l'una (nomi Serie A,
// quotazioni e fantamedie plausibili), una giornata iniziale come contesto.
// I dati vivono in src/lib/league/demo-league.ts, condivisi con la funzione
// "Ripristina lega demo" del repository.
//
// Esegui con:  npm run seed   (oppure  prisma db seed)

import { PrismaClient } from "@prisma/client";
import { DEMO_TEAMS, DEMO_GIORNATA, DEMO_FLASH } from "../src/lib/league/demo-league";

const prisma = new PrismaClient();

async function main() {
  // Reset (ordine rispettoso delle foreign key).
  await prisma.flashNews.deleteMany();
  await prisma.article.deleteMany();
  await prisma.edition.deleteMany();
  await prisma.trade.deleteMany();
  await prisma.result.deleteMany();
  await prisma.giornata.deleteMany();
  await prisma.player.deleteMany();
  await prisma.team.deleteMany();

  for (const t of DEMO_TEAMS) {
    await prisma.team.create({
      data: {
        slug: t.slug,
        name: t.name,
        president: t.president,
        points: t.points,
        isUser: t.isUser ?? false,
        players: { create: t.players },
      },
    });
  }

  await prisma.giornata.create({
    data: {
      number: DEMO_GIORNATA.number,
      results: {
        create: DEMO_GIORNATA.results.map((r) => ({
          homeName: r.home,
          awayName: r.away,
          homeScore: r.homeScore,
          awayScore: r.awayScore,
          note: r.note,
        })),
      },
    },
  });

  await prisma.flashNews.create({ data: { text: DEMO_FLASH, kind: "generic" } });

  const teamCount = await prisma.team.count();
  const playerCount = await prisma.player.count();
  console.log(`Seed completato: ${teamCount} squadre, ${playerCount} giocatori, 1 giornata.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
