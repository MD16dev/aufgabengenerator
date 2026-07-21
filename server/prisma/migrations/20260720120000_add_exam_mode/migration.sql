-- CreateTable
CREATE TABLE "ExamAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "maxPoints" INTEGER NOT NULL DEFAULT 0,
    "earnedPoints" INTEGER NOT NULL DEFAULT 0,
    "scorePct" REAL NOT NULL DEFAULT 0,
    "grade" REAL NOT NULL DEFAULT 5.0,
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExamAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExamTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "attemptId" TEXT NOT NULL,
    "taskTypeId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "workloadMin" INTEGER NOT NULL,
    "autoGraded" BOOLEAN NOT NULL,
    "maxPoints" INTEGER NOT NULL,
    "userPoints" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ExamTask_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "ExamAttempt" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ExamAttempt_moduleId_scorePct_idx" ON "ExamAttempt"("moduleId", "scorePct");

-- CreateIndex
CREATE INDEX "ExamTask_attemptId_idx" ON "ExamTask"("attemptId");
