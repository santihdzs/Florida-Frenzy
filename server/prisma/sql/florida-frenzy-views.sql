--- Florida Frenzy Database Views ---
--- Better to make them in MySQL Workbench and then export the SQL code
--- Will be useful for the API to fetch aggregated data without 
--- needing complex queries in the application code

-- General Player Profile View
CREATE OR REPLACE VIEW vw_player_profile AS
SELECT
  p.id,
  p.username,
  p.email,
  p."authProvider",
  p."isAdmin",
  p."isMuted",
  p."maxXp",
  p."maxHp",
  p."totalCoins",
  p."firstLogin",
  p."lastLogin"
FROM "Player" p;

-- Accumulated Player Progress View
CREATE OR REPLACE VIEW vw_player_progress AS
SELECT
  p.id,
  p.username,
  p."totalGamesPlayed",
  p."totalEnemiesKilled",
  p."totalCoins",
  p."maxXp"
FROM "Player" p;

-- Top-Down Game Player Stats View
CREATE OR REPLACE VIEW vw_player_combat_stats AS
SELECT
  p.id,
  p.username,
  p."bulletDamage",
  p."fireRate",
  p."reloadTime",
  p."hasNoReload",
  p."magSize",
  p."staminaPool",
  p."staminaRegen"
FROM "Player" p;

-- Player's Decks View
CREATE OR REPLACE VIEW vw_player_decks AS
SELECT
  d.id AS deck_id,
  d."deckName",
  d."isActive",
  d."creationDate",
  p.id AS player_id,
  p.username,
  cg.id AS character_id,
  cg."chName"
FROM "Deck" d
JOIN "Player" p ON d."playerId" = p.id
JOIN "CharacterGame" cg ON d."characterGameId" = cg.id;

-- Deck Content View
CREATE OR REPLACE VIEW vw_deck_cards AS
SELECT
  d.id AS deck_id,
  d."deckName",
  cg.id AS card_id,
  cg."cardName",
  cg."cardCategory",
  cg."cardElement",
  cg."cardRarity",
  dc."cardsIncluded"
FROM "DeckCard" dc
JOIN "Deck" d ON dc."deckId" = d.id
JOIN "CardGame" cg ON dc."cardGameId" = cg.id;

-- Player's Owned Cards View
CREATE OR REPLACE VIEW vw_player_owned_cards AS
SELECT
  p.id AS player_id,
  p.username,
  cg.id AS card_id,
  cg."cardName",
  cg."cardCategory",
  cg."cardElement",
  cg."cardRarity",
  pc."numCardsOwned",
  pc."isUnlocked"
FROM "PlayerCard" pc
JOIN "Player" p ON pc."playerId" = p.id
JOIN "CardGame" cg ON pc."cardGameId" = cg.id;

-- Player's Unlocked Characters View
CREATE OR REPLACE VIEW vw_player_unlocked_characters AS
SELECT
  p.id AS player_id,
  p.username,
  cg.id AS character_id,
  cg."chName",
  pc."isUnlocked",
  pc."usedTimes"
FROM "PlayerCharacter" pc
JOIN "Player" p ON pc."playerId" = p.id
JOIN "CharacterGame" cg ON pc."characterGameId" = cg.id;

-- Player's Runs Summary View
CREATE OR REPLACE VIEW vw_run_summary AS
SELECT
  r.id AS run_id,
  p.username,
  r."runStatus",
  r."zonesDone",
  r."xpEarned",
  r."coinsEarned",
  r."maxLevel",
  r."startTime",
  r."endTime",
  d."deckName"
FROM "Run" r
JOIN "Player" p ON r."playerId" = p.id
LEFT JOIN "Deck" d ON r."deckId" = d.id;

-- Player's Battle History View
CREATE OR REPLACE VIEW vw_battle_summary AS
SELECT
  b.id AS battle_id,
  r.id AS run_id,
  p.username,
  z."zoneName",
  e."enemyName",
  b."battleResult",
  b."turnCount",
  b."playerHpRemaining",
  b."enemyHpRemaining",
  b."startTime",
  b."endTime"
FROM "Battle" b
JOIN "Run" r ON b."runId" = r.id
JOIN "Player" p ON r."playerId" = p.id
JOIN "ZoneGame" z ON b."zoneGameId" = z.id
JOIN "Enemy" e ON b."enemyId" = e.id;

-- Player's Battle Rewards View
CREATE OR REPLACE VIEW vw_battle_rewards AS
SELECT
  br.id AS battle_reward_id,
  b.id AS battle_id,
  r."rewardName",
  r."rewardType",
  r."rewardValue",
  br."playerChoice"
FROM "BattleReward" br
JOIN "Battle" b ON br."battleId" = b.id
JOIN "Reward" r ON br."rewardId" = r.id;