-- Florida Frenzy Database Schema (MySQL-compatible mirror of schema.prisma)
-- Generated from Prisma schema. The authoritative source is schema.prisma + Prisma migrations.
-- NOTE: The production database is PostgreSQL. This file is for MySQL reference only.

DROP SCHEMA IF EXISTS florida_frenzy;
CREATE SCHEMA florida_frenzy;
USE florida_frenzy;

-- ── Enums (represented as MySQL ENUMs inline on each column) ─────────────────
-- CardCategory : ATTACK | DEFENSE | STATUS | SPECIAL
-- CardElement  : FIRE | WATER | SWAMP | SAND | ICE
-- CardRarity   : BASE | EFFECT | RARE | LEGENDARY
-- EnemyType    : PLATFORMER_ENEMY | CARD_ENEMY | FINAL_BOSS
-- Faction      : RAT | RACCOON | BEAR | PYTHON
-- AiLevel      : EASY | MEDIUM | HARD
-- ZoneDifficulty: EASY | MEDIUM | HARD | FINAL
-- RunStatus    : IN_PROGRESS | COMPLETED | ABANDONED
-- BattleResult : WIN | LOSE
-- RunZoneStatus: PENDING | IN_PROGRESS | COMPLETED | SKIPPED
-- RewardType   : CARD | CHARACTER | XP | COINS
-- AuthProvider : LOCAL | FIREBASE | BOTH
-- FriendStatus : PENDING | ACCEPTED

-- ── Player ───────────────────────────────────────────────────────────────────
-- maxXp, totalCoins, totalGamesPlayed, totalEnemiesKilled are CACHED/DENORMALIZED
-- from the Run table and updated by application logic. They can drift if runs are
-- deleted or corrected. At least one of firebaseUid or passwordHash must be non-null
-- (enforced at application level only).
CREATE TABLE Player (
    id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
    firebaseUid  VARCHAR(255) NULL,
    passwordHash VARCHAR(255) NULL,
    authProvider ENUM('LOCAL','FIREBASE','BOTH') NOT NULL DEFAULT 'LOCAL',
    username     VARCHAR(255) NOT NULL,
    email        VARCHAR(255) NOT NULL,
    maxXp        INT          NOT NULL DEFAULT 0,   -- cached: highest xpEarned across runs
    totalCoins   INT          NOT NULL DEFAULT 0,   -- cached: sum of coinsEarned across runs
    isAdmin      BOOLEAN      NOT NULL DEFAULT FALSE,
    isMuted      BOOLEAN      NOT NULL DEFAULT FALSE,
    maxHp        INT          NOT NULL DEFAULT 50,
    firstLogin   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lastLogin    DATETIME     NULL,
    totalGamesPlayed   INT    NOT NULL DEFAULT 0,   -- cached: count of completed runs
    totalEnemiesKilled INT    NOT NULL DEFAULT 0,   -- cached: sum of enemiesKilled across runs
    bulletDamage INT          NOT NULL DEFAULT 10,
    fireRate     INT          NOT NULL DEFAULT 1,
    reloadTime   INT          NOT NULL DEFAULT 1,
    hasNoReload  BOOLEAN      NOT NULL DEFAULT FALSE,

    PRIMARY KEY (id),
    UNIQUE KEY uq_player_firebaseUid (firebaseUid),
    UNIQUE KEY uq_player_username    (username),
    UNIQUE KEY uq_player_email       (email),
    KEY idx_player_maxXp             (maxXp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── CharacterGame ────────────────────────────────────────────────────────────
CREATE TABLE CharacterGame (
    id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
    chName            VARCHAR(255) NOT NULL,
    chDesc            TEXT         NULL,
    baseHp            INT          NOT NULL DEFAULT 100,
    baseAttack        INT          NOT NULL DEFAULT 0,
    baseDefense       INT          NOT NULL DEFAULT 0,
    chUltimate        VARCHAR(255) NOT NULL,
    chUltimateDesc    TEXT         NULL,
    isDefaultUnlocked BOOLEAN      NOT NULL DEFAULT FALSE,

    PRIMARY KEY (id),
    UNIQUE KEY uq_character_name (chName)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── CardGame ─────────────────────────────────────────────────────────────────
CREATE TABLE CardGame (
    id                   INT UNSIGNED NOT NULL AUTO_INCREMENT,
    cardName             VARCHAR(255) NOT NULL,
    cardCategory         ENUM('ATTACK','DEFENSE','STATUS','SPECIAL') NOT NULL,
    cardElement          ENUM('FIRE','WATER','SWAMP','SAND','ICE')   NOT NULL,
    cardNumber           INT          NULL,
    cardEffect           VARCHAR(255) NULL,
    effectDesc           TEXT         NULL,
    baseDamage           INT          NOT NULL DEFAULT 0,
    shieldValue          INT          NOT NULL DEFAULT 0,
    effectValue          INT          NOT NULL DEFAULT 0,
    effectDuration       INT          NOT NULL DEFAULT 0,
    effectValueSecondary INT          NOT NULL DEFAULT 0,
    energyEGain          INT          NOT NULL DEFAULT 0,
    energyIGain          INT          NOT NULL DEFAULT 0,
    energyECost          INT          NOT NULL DEFAULT 0,
    energyICost          INT          NOT NULL DEFAULT 0,
    cardRarity           ENUM('BASE','EFFECT','RARE','LEGENDARY') NOT NULL DEFAULT 'BASE',

    PRIMARY KEY (id),
    UNIQUE KEY uq_card_name          (cardName),
    KEY idx_card_category            (cardCategory),
    KEY idx_card_element             (cardElement),
    KEY idx_card_rarity              (cardRarity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Enemy ────────────────────────────────────────────────────────────────────
CREATE TABLE Enemy (
    id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
    enemyName         VARCHAR(255) NOT NULL,
    enemyDesc         TEXT         NULL,
    enemyType         ENUM('PLATFORMER_ENEMY','CARD_ENEMY','FINAL_BOSS') NOT NULL,
    faction           ENUM('RAT','RACCOON','BEAR','PYTHON')              NOT NULL,
    enemyBaseHp       INT          NOT NULL DEFAULT 100,
    enemyUltimate     VARCHAR(255) NULL,
    enemyUltimateDesc TEXT         NULL,
    aiLevel           ENUM('EASY','MEDIUM','HARD') NOT NULL DEFAULT 'EASY',

    PRIMARY KEY (id),
    UNIQUE KEY uq_enemy_name  (enemyName),
    KEY idx_enemy_type        (enemyType),
    KEY idx_enemy_faction     (faction),
    KEY idx_enemy_aiLevel     (aiLevel)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── ZoneGame ─────────────────────────────────────────────────────────────────
CREATE TABLE ZoneGame (
    id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
    zoneName       VARCHAR(255) NOT NULL,
    zoneMap        VARCHAR(255) NULL,
    zoneDesc       TEXT         NULL,
    zoneDifficulty ENUM('EASY','MEDIUM','HARD','FINAL') NOT NULL DEFAULT 'EASY',

    PRIMARY KEY (id),
    UNIQUE KEY uq_zone_name        (zoneName),
    KEY idx_zone_difficulty        (zoneDifficulty)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── PlayerCharacter ──────────────────────────────────────────────────────────
CREATE TABLE PlayerCharacter (
    id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
    playerId        INT UNSIGNED NOT NULL,
    characterGameId INT UNSIGNED NOT NULL,
    isUnlocked      BOOLEAN      NOT NULL DEFAULT FALSE,
    usedTimes       INT          NOT NULL DEFAULT 0,

    PRIMARY KEY (id),
    UNIQUE KEY uq_player_character (playerId, characterGameId),
    CONSTRAINT fk_pc_player    FOREIGN KEY (playerId)        REFERENCES Player(id)        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_pc_character FOREIGN KEY (characterGameId) REFERENCES CharacterGame(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── PlayerCard ───────────────────────────────────────────────────────────────
CREATE TABLE PlayerCard (
    id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
    playerId      INT UNSIGNED NOT NULL,
    cardGameId    INT UNSIGNED NOT NULL,
    numCardsOwned INT          NOT NULL DEFAULT 1,
    isUnlocked    BOOLEAN      NOT NULL DEFAULT FALSE,

    PRIMARY KEY (id),
    UNIQUE KEY uq_player_card (playerId, cardGameId),
    CONSTRAINT fk_pcard_player   FOREIGN KEY (playerId)   REFERENCES Player(id)   ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_pcard_cardgame FOREIGN KEY (cardGameId) REFERENCES CardGame(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Deck ─────────────────────────────────────────────────────────────────────
-- Only one active deck per player should exist: UNIQUE(playerId) WHERE isActive = TRUE
-- This partial unique constraint is enforced at application level only.
CREATE TABLE Deck (
    id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
    deckName        VARCHAR(255) NOT NULL,
    isActive        BOOLEAN      NOT NULL DEFAULT FALSE,
    creationDate    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    playerId        INT UNSIGNED NOT NULL,
    characterGameId INT UNSIGNED NOT NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uq_deck_player_name  (playerId, deckName),
    KEY idx_deck_characterGameId    (characterGameId),
    CONSTRAINT fk_deck_player    FOREIGN KEY (playerId)        REFERENCES Player(id)        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_deck_character FOREIGN KEY (characterGameId) REFERENCES CharacterGame(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── DeckCard ─────────────────────────────────────────────────────────────────
CREATE TABLE DeckCard (
    id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
    deckId        INT UNSIGNED NOT NULL,
    cardGameId    INT UNSIGNED NOT NULL,
    cardsIncluded INT          NOT NULL DEFAULT 1,

    PRIMARY KEY (id),
    UNIQUE KEY uq_deck_card (deckId, cardGameId),
    CONSTRAINT fk_deckcard_deck     FOREIGN KEY (deckId)     REFERENCES Deck(id)     ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_deckcard_cardgame FOREIGN KEY (cardGameId) REFERENCES CardGame(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Run ──────────────────────────────────────────────────────────────────────
-- zonesDone is a CACHED counter (count of COMPLETED RunZones). Can drift.
-- deckId is nullable: SetNull preserves run history if a deck is deleted.
CREATE TABLE Run (
    id        INT UNSIGNED NOT NULL AUTO_INCREMENT,
    startTime DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    endTime   DATETIME     NULL,
    runStatus ENUM('IN_PROGRESS','COMPLETED','ABANDONED') NOT NULL DEFAULT 'IN_PROGRESS',
    zonesDone INT          NOT NULL DEFAULT 0,  -- cached counter
    xpEarned  INT          NOT NULL DEFAULT 0,
    coinsEarned INT        NOT NULL DEFAULT 0,
    maxLevel  INT          NOT NULL DEFAULT 1,
    playerId  INT UNSIGNED NOT NULL,
    deckId    INT UNSIGNED NULL,                -- nullable: SetNull on deck delete

    PRIMARY KEY (id),
    KEY idx_run_playerId  (playerId),
    KEY idx_run_deckId    (deckId),
    KEY idx_run_runStatus (runStatus),
    KEY idx_run_endTime   (endTime),
    CONSTRAINT fk_run_player FOREIGN KEY (playerId) REFERENCES Player(id) ON DELETE CASCADE  ON UPDATE CASCADE,
    CONSTRAINT fk_run_deck   FOREIGN KEY (deckId)   REFERENCES Deck(id)   ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── RunZone ──────────────────────────────────────────────────────────────────
CREATE TABLE RunZone (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `order`    INT          NOT NULL,
    status     ENUM('PENDING','IN_PROGRESS','COMPLETED','SKIPPED') NOT NULL,
    claimReward BOOLEAN     NOT NULL DEFAULT FALSE,
    zoneGameId INT UNSIGNED NOT NULL,
    runId      INT UNSIGNED NOT NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uq_runzone_run_order (runId, `order`),
    KEY idx_runzone_runId      (runId),
    KEY idx_runzone_zoneGameId (zoneGameId),
    CONSTRAINT fk_runzone_run      FOREIGN KEY (runId)      REFERENCES Run(id)      ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_runzone_zonegame FOREIGN KEY (zoneGameId) REFERENCES ZoneGame(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Battle ───────────────────────────────────────────────────────────────────
-- enemyId uses RESTRICT: enemy definitions cannot be deleted while battles reference them.
CREATE TABLE Battle (
    id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
    battleResult      ENUM('WIN','LOSE') NOT NULL,
    turnCount         INT          NOT NULL DEFAULT 0,
    playerHpRemaining INT          NOT NULL DEFAULT 0,
    enemyHpRemaining  INT          NOT NULL DEFAULT 0,
    startTime         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    endTime           DATETIME     NULL,
    runId             INT UNSIGNED NOT NULL,
    zoneGameId        INT UNSIGNED NOT NULL,
    enemyId           INT UNSIGNED NOT NULL,

    PRIMARY KEY (id),
    KEY idx_battle_runId      (runId),
    KEY idx_battle_zoneGameId (zoneGameId),
    KEY idx_battle_enemyId    (enemyId),
    CONSTRAINT fk_battle_run      FOREIGN KEY (runId)      REFERENCES Run(id)      ON DELETE CASCADE  ON UPDATE CASCADE,
    CONSTRAINT fk_battle_zonegame FOREIGN KEY (zoneGameId) REFERENCES ZoneGame(id) ON DELETE CASCADE  ON UPDATE CASCADE,
    CONSTRAINT fk_battle_enemy    FOREIGN KEY (enemyId)    REFERENCES Enemy(id)    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Reward ───────────────────────────────────────────────────────────────────
-- cardGameId and characterGameId are mutually exclusive (not both non-null).
-- Enforced at application level only.
CREATE TABLE Reward (
    id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
    rewardName      VARCHAR(255) NOT NULL,
    rewardType      ENUM('CARD','CHARACTER','XP','COINS') NOT NULL,
    rewardDesc      TEXT         NULL,
    rewardValue     INT          NOT NULL DEFAULT 0,
    cardGameId      INT UNSIGNED NULL,
    characterGameId INT UNSIGNED NULL,

    PRIMARY KEY (id),
    KEY idx_reward_cardGameId      (cardGameId),
    KEY idx_reward_characterGameId (characterGameId),
    CONSTRAINT fk_reward_cardgame  FOREIGN KEY (cardGameId)      REFERENCES CardGame(id)      ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_reward_character FOREIGN KEY (characterGameId) REFERENCES CharacterGame(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── BattleReward ─────────────────────────────────────────────────────────────
CREATE TABLE BattleReward (
    id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
    playerChoice BOOLEAN      NOT NULL DEFAULT FALSE,
    battleId     INT UNSIGNED NOT NULL,
    rewardId     INT UNSIGNED NOT NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uq_battlereward (battleId, rewardId),
    KEY idx_battlereward_battleId (battleId),
    KEY idx_battlereward_rewardId (rewardId),
    CONSTRAINT fk_battlereward_battle FOREIGN KEY (battleId) REFERENCES Battle(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_battlereward_reward FOREIGN KEY (rewardId) REFERENCES Reward(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Friendship ───────────────────────────────────────────────────────────────
CREATE TABLE Friendship (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    senderId   INT UNSIGNED NOT NULL,
    receiverId INT UNSIGNED NOT NULL,
    status     ENUM('PENDING','ACCEPTED') NOT NULL DEFAULT 'PENDING',
    createdAt  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_friendship (senderId, receiverId),
    KEY idx_friendship_senderId   (senderId),
    KEY idx_friendship_receiverId (receiverId),
    KEY idx_friendship_status     (status),
    CONSTRAINT fk_friendship_sender   FOREIGN KEY (senderId)   REFERENCES Player(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_friendship_receiver FOREIGN KEY (receiverId) REFERENCES Player(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
