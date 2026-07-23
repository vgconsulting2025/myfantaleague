-- CreateTable
CREATE TABLE "MuseumEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "detail" TEXT,
    "giornata" INTEGER,
    "value" REAL
);

-- CreateIndex
CREATE INDEX "MuseumEntry_type_idx" ON "MuseumEntry"("type");

-- CreateIndex
CREATE INDEX "MuseumEntry_createdAt_idx" ON "MuseumEntry"("createdAt");
