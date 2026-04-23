-- Rename swampXp to maxXp on Player
ALTER TABLE "Player" RENAME COLUMN "swampXp" TO "maxXp";

-- Add xpEarned to Run
ALTER TABLE "Run" ADD COLUMN "xpEarned" INTEGER NOT NULL DEFAULT 0;
