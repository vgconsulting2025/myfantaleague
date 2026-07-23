-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "rivalDerbies" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_Team" ("color1", "color2", "createdAt", "crestUrl", "id", "idolBestCount", "idolCumFm", "idolLevel", "idolPlayerId", "idolQuote", "idolSetGiornata", "idolStreak", "isUser", "jerseyBackUrl", "jerseyFrontUrl", "name", "points", "president", "slug") SELECT "color1", "color2", "createdAt", "crestUrl", "id", "idolBestCount", "idolCumFm", "idolLevel", "idolPlayerId", "idolQuote", "idolSetGiornata", "idolStreak", "isUser", "jerseyBackUrl", "jerseyFrontUrl", "name", "points", "president", "slug" FROM "Team";
DROP TABLE "Team";
ALTER TABLE "new_Team" RENAME TO "Team";
CREATE UNIQUE INDEX "Team_slug_key" ON "Team"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
