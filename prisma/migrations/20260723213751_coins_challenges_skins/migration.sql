-- AlterTable
ALTER TABLE "Player" ADD COLUMN "skinKey" TEXT;

-- CreateTable
CREATE TABLE "Challenge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "reward" INTEGER NOT NULL,
    "giornata" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Challenge_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OwnedSkin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "skinKey" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OwnedSkin_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_LeagueConfig" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'league',
    "gazzettaName" TEXT NOT NULL DEFAULT 'MyFantaGazzetta',
    "freeAgentEnabled" BOOLEAN NOT NULL DEFAULT true,
    "freeAgentMaxPerWeek" INTEGER NOT NULL DEFAULT 2,
    "acquistoCoinsAbilitato" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_LeagueConfig" ("freeAgentEnabled", "freeAgentMaxPerWeek", "gazzettaName", "id") SELECT "freeAgentEnabled", "freeAgentMaxPerWeek", "gazzettaName", "id" FROM "LeagueConfig";
DROP TABLE "LeagueConfig";
ALTER TABLE "new_LeagueConfig" RENAME TO "LeagueConfig";
CREATE TABLE "new_Team" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "president" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "isUser" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "crestUrl" TEXT,
    "jerseyFrontUrl" TEXT,
    "jerseyBackUrl" TEXT,
    "color1" TEXT,
    "color2" TEXT,
    "idolPlayerId" TEXT,
    "idolSetGiornata" INTEGER,
    "idolCumFm" REAL NOT NULL DEFAULT 0,
    "idolBestCount" INTEGER NOT NULL DEFAULT 0,
    "idolStreak" INTEGER NOT NULL DEFAULT 0,
    "idolLevel" INTEGER NOT NULL DEFAULT 1,
    "idolQuote" TEXT,
    "rivalTeamId" TEXT,
    "rivalSetGiornata" INTEGER,
    "rivalWins" INTEGER NOT NULL DEFAULT 0,
    "rivalDraws" INTEGER NOT NULL DEFAULT 0,
    "rivalLosses" INTEGER NOT NULL DEFAULT 0,
    "rivalPointsFor" REAL NOT NULL DEFAULT 0,
    "rivalPointsAgainst" REAL NOT NULL DEFAULT 0,
    "rivalDerbies" INTEGER NOT NULL DEFAULT 0,
    "coins" INTEGER NOT NULL DEFAULT 100
);
INSERT INTO "new_Team" ("color1", "color2", "createdAt", "crestUrl", "id", "idolBestCount", "idolCumFm", "idolLevel", "idolPlayerId", "idolQuote", "idolSetGiornata", "idolStreak", "isUser", "jerseyBackUrl", "jerseyFrontUrl", "name", "points", "president", "rivalDerbies", "rivalDraws", "rivalLosses", "rivalPointsAgainst", "rivalPointsFor", "rivalSetGiornata", "rivalTeamId", "rivalWins", "slug") SELECT "color1", "color2", "createdAt", "crestUrl", "id", "idolBestCount", "idolCumFm", "idolLevel", "idolPlayerId", "idolQuote", "idolSetGiornata", "idolStreak", "isUser", "jerseyBackUrl", "jerseyFrontUrl", "name", "points", "president", "rivalDerbies", "rivalDraws", "rivalLosses", "rivalPointsAgainst", "rivalPointsFor", "rivalSetGiornata", "rivalTeamId", "rivalWins", "slug" FROM "Team";
DROP TABLE "Team";
ALTER TABLE "new_Team" RENAME TO "Team";
CREATE UNIQUE INDEX "Team_slug_key" ON "Team"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Challenge_teamId_idx" ON "Challenge"("teamId");

-- CreateIndex
CREATE INDEX "OwnedSkin_teamId_idx" ON "OwnedSkin"("teamId");
