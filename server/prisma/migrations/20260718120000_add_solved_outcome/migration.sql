-- Add outcome + points columns to SolvedTask so the leaderboard can distinguish
-- tasks solved correctly from tasks where the solution was revealed.
-- SQLite does not support ADD COLUMN with a non-constant default reliably across
-- all clients, so we set explicit defaults.

ALTER TABLE "SolvedTask" ADD COLUMN "outcome" TEXT NOT NULL DEFAULT 'solved';
ALTER TABLE "SolvedTask" ADD COLUMN "points" INTEGER NOT NULL DEFAULT 1;
