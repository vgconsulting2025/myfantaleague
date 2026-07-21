-- CreateTable
CREATE TABLE "Performance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "giornataId" TEXT NOT NULL,
    "teamName" TEXT NOT NULL,
    "president" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "vote" REAL NOT NULL,
    "bonus" REAL NOT NULL DEFAULT 0,
    "fielded" BOOLEAN NOT NULL,
    CONSTRAINT "Performance_giornataId_fkey" FOREIGN KEY ("giornataId") REFERENCES "Giornata" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CoachRating" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "giornataId" TEXT NOT NULL,
    "teamName" TEXT NOT NULL,
    "president" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CoachRating_giornataId_fkey" FOREIGN KEY ("giornataId") REFERENCES "Giornata" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PeerVote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "giornataId" TEXT NOT NULL,
    "fromTeam" TEXT NOT NULL,
    "toTeam" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "comment" TEXT NOT NULL DEFAULT '',
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PeerVote_giornataId_fkey" FOREIGN KEY ("giornataId") REFERENCES "Giornata" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Performance_giornataId_idx" ON "Performance"("giornataId");

-- CreateIndex
CREATE INDEX "CoachRating_giornataId_idx" ON "CoachRating"("giornataId");

-- CreateIndex
CREATE INDEX "CoachRating_teamName_idx" ON "CoachRating"("teamName");

-- CreateIndex
CREATE INDEX "PeerVote_toTeam_idx" ON "PeerVote"("toTeam");

-- CreateIndex
CREATE INDEX "PeerVote_giornataId_idx" ON "PeerVote"("giornataId");
