-- CreateEnum
CREATE TYPE "CardCategory" AS ENUM ('ATTACK', 'DEFENSE', 'STATUS', 'SPECIAL');

-- CreateEnum
CREATE TYPE "CardElement" AS ENUM ('FIRE', 'WATER', 'SWAMP', 'SAND', 'ICE');

-- CreateEnum
CREATE TYPE "CardRarity" AS ENUM ('BASE', 'EFFECT', 'RARE', 'CLAN');

-- CreateEnum
CREATE TYPE "EnemyType" AS ENUM ('PLATFORMER_ENEMY', 'CARD_ENEMY', 'FINAL_BOSS');

-- CreateEnum
CREATE TYPE "Faction" AS ENUM ('RAT', 'RACCOON', 'BEAR', 'PYTHON');

-- CreateEnum
CREATE TYPE "AiLevel" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "ZoneDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD', 'FINAL');

-- CreateEnum
CREATE TYPE "RunStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "BattleResult" AS ENUM ('WIN', 'LOSE');

-- CreateEnum
CREATE TYPE "RunZoneStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "RewardType" AS ENUM ('CARD', 'CHARACTER', 'XP', 'COINS');

-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('LOCAL', 'FIREBASE', 'BOTH');

-- CreateTable
CREATE TABLE "Player" (
    "id" SERIAL NOT NULL,
    "firebaseUid" TEXT,
    "passwordHash" TEXT,
    "authProvider" "AuthProvider" NOT NULL DEFAULT 'LOCAL',
    "username" TEXT NOT NULL,
    "nickname" TEXT,
    "email" TEXT NOT NULL,
    "swampXp" INTEGER NOT NULL DEFAULT 0,
    "firstLogin" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLogin" TIMESTAMP(3),

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharacterGame" (
    "id" SERIAL NOT NULL,
    "chName" TEXT NOT NULL,
    "chDesc" TEXT,
    "baseHp" INTEGER NOT NULL DEFAULT 100,
    "baseAttack" INTEGER NOT NULL DEFAULT 0,
    "baseDefense" INTEGER NOT NULL DEFAULT 0,
    "chUltimate" TEXT NOT NULL,
    "chUltimateDesc" TEXT,
    "isDefaultUnlocked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CharacterGame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardGame" (
    "id" SERIAL NOT NULL,
    "cardName" TEXT NOT NULL,
    "cardCategory" "CardCategory" NOT NULL,
    "cardElement" "CardElement" NOT NULL,
    "cardNumber" INTEGER,
    "cardEffect" TEXT,
    "effectDesc" TEXT,
    "baseDamage" INTEGER NOT NULL DEFAULT 0,
    "shieldValue" INTEGER NOT NULL DEFAULT 0,
    "effectValue" INTEGER NOT NULL DEFAULT 0,
    "effectDuration" INTEGER NOT NULL DEFAULT 0,
    "effectValueSecondary" INTEGER NOT NULL DEFAULT 0,
    "energyEGain" INTEGER NOT NULL DEFAULT 0,
    "energyIGain" INTEGER NOT NULL DEFAULT 0,
    "energyECost" INTEGER NOT NULL DEFAULT 0,
    "energyICost" INTEGER NOT NULL DEFAULT 0,
    "cardRarity" "CardRarity" NOT NULL DEFAULT 'BASE',

    CONSTRAINT "CardGame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enemy" (
    "id" SERIAL NOT NULL,
    "enemyName" TEXT NOT NULL,
    "enemyDesc" TEXT,
    "enemyType" "EnemyType" NOT NULL,
    "faction" "Faction" NOT NULL,
    "enemyBaseHp" INTEGER NOT NULL DEFAULT 100,
    "enemyUltimate" TEXT,
    "enemyUltimateDesc" TEXT,
    "aiLevel" "AiLevel" NOT NULL DEFAULT 'EASY',

    CONSTRAINT "Enemy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ZoneGame" (
    "id" SERIAL NOT NULL,
    "zoneName" TEXT NOT NULL,
    "zoneMap" TEXT,
    "zoneDesc" TEXT,
    "zoneDifficulty" "ZoneDifficulty" NOT NULL DEFAULT 'EASY',

    CONSTRAINT "ZoneGame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerCharacter" (
    "id" SERIAL NOT NULL,
    "playerId" INTEGER NOT NULL,
    "characterGameId" INTEGER NOT NULL,
    "isUnlocked" BOOLEAN NOT NULL DEFAULT false,
    "usedTimes" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PlayerCharacter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerCard" (
    "id" SERIAL NOT NULL,
    "playerId" INTEGER NOT NULL,
    "cardGameId" INTEGER NOT NULL,
    "numCardsOwned" INTEGER NOT NULL DEFAULT 1,
    "isUnlocked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PlayerCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deck" (
    "id" SERIAL NOT NULL,
    "deckName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "creationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "playerId" INTEGER NOT NULL,
    "characterGameId" INTEGER NOT NULL,

    CONSTRAINT "Deck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeckCard" (
    "id" SERIAL NOT NULL,
    "deckId" INTEGER NOT NULL,
    "cardGameId" INTEGER NOT NULL,
    "cardsIncluded" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "DeckCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Run" (
    "id" SERIAL NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "runStatus" "RunStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "zonesDone" INTEGER NOT NULL DEFAULT 0,
    "swampXpEarned" INTEGER NOT NULL DEFAULT 0,
    "playerId" INTEGER NOT NULL,
    "deckId" INTEGER NOT NULL,

    CONSTRAINT "Run_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RunZone" (
    "id" SERIAL NOT NULL,
    "order" INTEGER NOT NULL,
    "status" "RunZoneStatus" NOT NULL,
    "claimReward" BOOLEAN NOT NULL DEFAULT false,
    "zoneGameId" INTEGER NOT NULL,
    "runId" INTEGER NOT NULL,

    CONSTRAINT "RunZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Battle" (
    "id" SERIAL NOT NULL,
    "battleResult" "BattleResult" NOT NULL,
    "turnCount" INTEGER NOT NULL DEFAULT 0,
    "playerHpRemaining" INTEGER NOT NULL DEFAULT 0,
    "enemyHpRemaining" INTEGER NOT NULL DEFAULT 0,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "runId" INTEGER NOT NULL,
    "zoneGameId" INTEGER NOT NULL,
    "enemyId" INTEGER NOT NULL,

    CONSTRAINT "Battle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reward" (
    "id" SERIAL NOT NULL,
    "rewardName" TEXT NOT NULL,
    "rewardType" "RewardType" NOT NULL,
    "rewardDesc" TEXT,
    "rewardValue" INTEGER NOT NULL DEFAULT 0,
    "cardGameId" INTEGER,
    "characterGameId" INTEGER,

    CONSTRAINT "Reward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BattleReward" (
    "id" SERIAL NOT NULL,
    "playerChoice" BOOLEAN NOT NULL DEFAULT false,
    "battleId" INTEGER NOT NULL,
    "rewardId" INTEGER NOT NULL,

    CONSTRAINT "BattleReward_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Player_firebaseUid_key" ON "Player"("firebaseUid");

-- CreateIndex
CREATE UNIQUE INDEX "Player_username_key" ON "Player"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Player_email_key" ON "Player"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CharacterGame_chName_key" ON "CharacterGame"("chName");

-- CreateIndex
CREATE UNIQUE INDEX "CardGame_cardName_key" ON "CardGame"("cardName");

-- CreateIndex
CREATE UNIQUE INDEX "Enemy_enemyName_key" ON "Enemy"("enemyName");

-- CreateIndex
CREATE UNIQUE INDEX "ZoneGame_zoneName_key" ON "ZoneGame"("zoneName");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerCharacter_playerId_characterGameId_key" ON "PlayerCharacter"("playerId", "characterGameId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerCard_playerId_cardGameId_key" ON "PlayerCard"("playerId", "cardGameId");

-- CreateIndex
CREATE UNIQUE INDEX "Deck_playerId_deckName_key" ON "Deck"("playerId", "deckName");

-- CreateIndex
CREATE UNIQUE INDEX "DeckCard_deckId_cardGameId_key" ON "DeckCard"("deckId", "cardGameId");

-- CreateIndex
CREATE INDEX "RunZone_runId_idx" ON "RunZone"("runId");

-- CreateIndex
CREATE INDEX "RunZone_zoneGameId_idx" ON "RunZone"("zoneGameId");

-- CreateIndex
CREATE UNIQUE INDEX "RunZone_runId_order_key" ON "RunZone"("runId", "order");

-- CreateIndex
CREATE INDEX "Reward_cardGameId_idx" ON "Reward"("cardGameId");

-- CreateIndex
CREATE INDEX "Reward_characterGameId_idx" ON "Reward"("characterGameId");

-- CreateIndex
CREATE INDEX "BattleReward_battleId_idx" ON "BattleReward"("battleId");

-- CreateIndex
CREATE INDEX "BattleReward_rewardId_idx" ON "BattleReward"("rewardId");

-- CreateIndex
CREATE UNIQUE INDEX "BattleReward_battleId_rewardId_key" ON "BattleReward"("battleId", "rewardId");

-- AddForeignKey
ALTER TABLE "PlayerCharacter" ADD CONSTRAINT "PlayerCharacter_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerCharacter" ADD CONSTRAINT "PlayerCharacter_characterGameId_fkey" FOREIGN KEY ("characterGameId") REFERENCES "CharacterGame"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerCard" ADD CONSTRAINT "PlayerCard_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerCard" ADD CONSTRAINT "PlayerCard_cardGameId_fkey" FOREIGN KEY ("cardGameId") REFERENCES "CardGame"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deck" ADD CONSTRAINT "Deck_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deck" ADD CONSTRAINT "Deck_characterGameId_fkey" FOREIGN KEY ("characterGameId") REFERENCES "CharacterGame"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeckCard" ADD CONSTRAINT "DeckCard_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "Deck"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeckCard" ADD CONSTRAINT "DeckCard_cardGameId_fkey" FOREIGN KEY ("cardGameId") REFERENCES "CardGame"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Run" ADD CONSTRAINT "Run_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Run" ADD CONSTRAINT "Run_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "Deck"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RunZone" ADD CONSTRAINT "RunZone_zoneGameId_fkey" FOREIGN KEY ("zoneGameId") REFERENCES "ZoneGame"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RunZone" ADD CONSTRAINT "RunZone_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_zoneGameId_fkey" FOREIGN KEY ("zoneGameId") REFERENCES "ZoneGame"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_enemyId_fkey" FOREIGN KEY ("enemyId") REFERENCES "Enemy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reward" ADD CONSTRAINT "Reward_cardGameId_fkey" FOREIGN KEY ("cardGameId") REFERENCES "CardGame"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reward" ADD CONSTRAINT "Reward_characterGameId_fkey" FOREIGN KEY ("characterGameId") REFERENCES "CharacterGame"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BattleReward" ADD CONSTRAINT "BattleReward_battleId_fkey" FOREIGN KEY ("battleId") REFERENCES "Battle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BattleReward" ADD CONSTRAINT "BattleReward_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "Reward"("id") ON DELETE CASCADE ON UPDATE CASCADE;
