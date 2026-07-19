-- CreateTable
CREATE TABLE "BusQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "question" TEXT NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "distractor1" TEXT NOT NULL,
    "distractor2" TEXT NOT NULL,
    "distractor3" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
