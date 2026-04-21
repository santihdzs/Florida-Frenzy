-- schema-cleanup-indexes-fk-fixes
-- 1. Rename CardRarity.CLAN -> LEGENDARY
-- 2. Drop Run.swampXpEarned (dead field, 55 existing rows discarded)
-- 3. Make Run.deckId nullable, change FK to SetNull
-- 4. Change Battle.enemyId FK to Restrict
-- 5. Add missing indexes on Run, Battle, Deck, Friendship

-- AlterEnum: CardRarity CLAN -> LEGENDARY
BEGIN;
CREATE TYPE "CardRarity_new" AS ENUM ('BASE', 'EFFECT', 'RARE', 'LEGENDARY');
ALTER TABLE "CardGame" ALTER COLUMN "cardRarity" DROP DEFAULT;
ALTER TABLE "CardGame" ALTER COLUMN "cardRarity" TYPE "CardRarity_new" USING ("cardRarity"::text::"CardRarity_new");
ALTER TYPE "CardRarity" RENAME TO "CardRarity_old";
ALTER TYPE "CardRarity_new" RENAME TO "CardRarity";
DROP TYPE "CardRarity_old";
ALTER TABLE "CardGame" ALTER COLUMN "cardRarity" SET DEFAULT 'BASE';
COMMIT;

-- DropForeignKey
ALTER TABLE "Battle" DROP CONSTRAINT "Battle_enemyId_fkey";

-- DropForeignKey
ALTER TABLE "Run" DROP CONSTRAINT "Run_deckId_fkey";

-- AlterTable: drop swampXpEarned, make deckId nullable
ALTER TABLE "Run" DROP COLUMN "swampXpEarned",
ALTER COLUMN "deckId" DROP NOT NULL;

-- CreateIndex on Battle
CREATE INDEX "Battle_runId_idx" ON "Battle"("runId");
CREATE INDEX "Battle_zoneGameId_idx" ON "Battle"("zoneGameId");
CREATE INDEX "Battle_enemyId_idx" ON "Battle"("enemyId");

-- CreateIndex on Deck
CREATE INDEX "Deck_characterGameId_idx" ON "Deck"("characterGameId");

-- CreateIndex on Friendship
CREATE INDEX "Friendship_status_idx" ON "Friendship"("status");

-- CreateIndex on Run
CREATE INDEX "Run_playerId_idx" ON "Run"("playerId");
CREATE INDEX "Run_deckId_idx" ON "Run"("deckId");
CREATE INDEX "Run_runStatus_idx" ON "Run"("runStatus");
CREATE INDEX "Run_endTime_idx" ON "Run"("endTime");

-- AddForeignKey: Run.deckId -> SetNull
ALTER TABLE "Run" ADD CONSTRAINT "Run_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "Deck"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: Battle.enemyId -> Restrict
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_enemyId_fkey" FOREIGN KEY ("enemyId") REFERENCES "Enemy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
