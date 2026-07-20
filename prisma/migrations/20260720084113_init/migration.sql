-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "president" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "isUser" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "club" TEXT NOT NULL,
    "quota" INTEGER NOT NULL,
    "fm" REAL NOT NULL,
    "teamId" TEXT NOT NULL,
    CONSTRAINT "Player_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Giornata" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" INTEGER NOT NULL,
    "playedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Result" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "giornataId" TEXT NOT NULL,
    "homeName" TEXT NOT NULL,
    "awayName" TEXT NOT NULL,
    "homeScore" REAL NOT NULL,
    "awayScore" REAL NOT NULL,
    "note" TEXT NOT NULL,
    CONSTRAINT "Result_giornataId_fkey" FOREIGN KEY ("giornataId") REFERENCES "Giornata" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Edition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "giornata" INTEGER
);

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "editionId" TEXT NOT NULL,
    "kicker" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "isLead" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Article_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "Edition" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "fromTeam" TEXT NOT NULL,
    "toTeam" TEXT NOT NULL,
    "giveName" TEXT NOT NULL,
    "receiveName" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "agentComment" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "FlashNews" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "text" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'mercato'
);

-- CreateIndex
CREATE UNIQUE INDEX "Team_slug_key" ON "Team"("slug");

-- CreateIndex
CREATE INDEX "Player_teamId_idx" ON "Player"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "Giornata_number_key" ON "Giornata"("number");

-- CreateIndex
CREATE INDEX "Result_giornataId_idx" ON "Result"("giornataId");

-- CreateIndex
CREATE INDEX "Article_editionId_idx" ON "Article"("editionId");
