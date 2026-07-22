-- CreateTable
CREATE TABLE "LeagueConfig" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'league',
    "gazzettaName" TEXT NOT NULL DEFAULT 'MyFantaGazzetta',
    "freeAgentEnabled" BOOLEAN NOT NULL DEFAULT true,
    "freeAgentMaxPerWeek" INTEGER NOT NULL DEFAULT 2
);

-- CreateTable
CREATE TABLE "FreeAgentProposal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "teamName" TEXT NOT NULL,
    "giveName" TEXT NOT NULL,
    "giveRole" TEXT NOT NULL,
    "giveQuota" INTEGER NOT NULL,
    "giveFm" REAL NOT NULL,
    "faName" TEXT NOT NULL,
    "faRole" TEXT NOT NULL,
    "faClub" TEXT NOT NULL,
    "faQuota" INTEGER NOT NULL,
    "faFm" REAL NOT NULL,
    "rationale" TEXT NOT NULL,
    "agentComment" TEXT NOT NULL,
    "forUser" BOOLEAN NOT NULL DEFAULT false
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Article" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "editionId" TEXT,
    "kicker" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "isLead" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Article_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "Edition" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Article" ("body", "category", "editionId", "id", "isLead", "kicker", "order", "title") SELECT "body", "category", "editionId", "id", "isLead", "kicker", "order", "title" FROM "Article";
DROP TABLE "Article";
ALTER TABLE "new_Article" RENAME TO "Article";
CREATE INDEX "Article_editionId_idx" ON "Article"("editionId");
CREATE INDEX "Article_createdAt_idx" ON "Article"("createdAt");
CREATE TABLE "new_Player" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "club" TEXT NOT NULL,
    "quota" INTEGER NOT NULL,
    "fm" REAL NOT NULL,
    "imageUrl" TEXT,
    "number" INTEGER,
    "teamId" TEXT,
    CONSTRAINT "Player_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Player" ("club", "fm", "id", "imageUrl", "name", "number", "quota", "role", "teamId") SELECT "club", "fm", "id", "imageUrl", "name", "number", "quota", "role", "teamId" FROM "Player";
DROP TABLE "Player";
ALTER TABLE "new_Player" RENAME TO "Player";
CREATE INDEX "Player_teamId_idx" ON "Player"("teamId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "FreeAgentProposal_status_idx" ON "FreeAgentProposal"("status");
