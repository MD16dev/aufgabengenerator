-- CreateTable
CREATE TABLE "Duel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mode" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "taskTypeId" TEXT NOT NULL,
    "limit" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "winnerId" TEXT,
    "loserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME
);

-- CreateTable
CREATE TABLE "DuelParticipant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "duelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "eloBefore" INTEGER NOT NULL DEFAULT 1000,
    "eloAfter" INTEGER,
    CONSTRAINT "DuelParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DuelParticipant_duelId_fkey" FOREIGN KEY ("duelId") REFERENCES "Duel" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DuelRound" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "duelId" TEXT NOT NULL,
    "taskType" TEXT NOT NULL,
    "taskData" TEXT NOT NULL,
    "solvedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DuelRound_duelId_fkey" FOREIGN KEY ("duelId") REFERENCES "Duel" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT,
    "profilePic" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "elo" INTEGER NOT NULL DEFAULT 1000,
    "eloLinAlg" INTEGER NOT NULL DEFAULT 1000,
    "eloOs" INTEGER NOT NULL DEFAULT 1000,
    "eloFormalSys" INTEGER NOT NULL DEFAULT 1000,
    "eloAlgoStruct" INTEGER NOT NULL DEFAULT 1000,
    "duelWins" INTEGER NOT NULL DEFAULT 0,
    "duelLosses" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_User" ("createdAt", "displayName", "id", "passwordHash", "profilePic", "username") SELECT "createdAt", "displayName", "id", "passwordHash", "profilePic", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "DuelParticipant_duelId_userId_key" ON "DuelParticipant"("duelId", "userId");
