--- Florida Frenzy Database Procedures ---
--- These are stored procedures that can be called from the application code to 
--- perform common database operations - could replace certain functions inside
--- the current .ts scripts that interact with the database, 
--- and also ensure that complex operations are handled consistently at the database level


-- Procedure to create a new player in the database
CREATE OR REPLACE PROCEDURE sp_create_player(
  p_username TEXT,
  p_email TEXT,
  p_password_hash TEXT
)

LANGUAGE plpgsql -- meaning this procedure is written in PL/pgSQL, the procedural language for PostgreSQL
AS $$
BEGIN
  INSERT INTO "Player" (
    username,
    email,
    "passwordHash",
    "authProvider"
  )

  VALUES (
    p_username,
    p_email,
    p_password_hash,
    'LOCAL'
  );

END;
$$;


-- Create a new run for a player with a specific deck
CREATE OR REPLACE PROCEDURE sp_start_run(
  p_player_id INT,
  p_deck_id INT
)

LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO "Run" (
    "playerId",
    "deckId",
    "runStatus",
    "zonesDone",
    "xpEarned",
    "coinsEarned",
    "maxLevel"
  )

  VALUES (
    p_player_id,
    p_deck_id,
    'IN_PROGRESS',
    0,
    0,
    0,
    1
  );

END;
$$;


-- Procedure to complete a battle and update the run's progress
CREATE OR REPLACE PROCEDURE sp_complete_battle(
  p_run_id INT,
  p_zone_id INT,
  p_enemy_id INT,
  p_result "BattleResult",
  p_turn_count INT,
  p_player_hp_remaining INT,
  p_enemy_hp_remaining INT
)

LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO "Battle" (
    "runId",
    "zoneGameId",
    "enemyId",
    "battleResult",
    "turnCount",
    "playerHpRemaining",
    "enemyHpRemaining",
    "startTime",
    "endTime"
  )

  VALUES (
    p_run_id,
    p_zone_id,
    p_enemy_id,
    p_result,
    p_turn_count,
    p_player_hp_remaining,
    p_enemy_hp_remaining,
    NOW(),
    NOW()
  );

END;
$$;


-- Procedure to assign a reward to a completed battle
CREATE OR REPLACE PROCEDURE sp_assign_reward_to_battle(
  p_battle_id INT,
  p_reward_id INT,
  p_player_choice BOOLEAN
)

LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO "BattleReward" (
    "battleId",
    "rewardId",
    "playerChoice"
  )
  VALUES (
    p_battle_id,
    p_reward_id,
    p_player_choice
  );

END;
$$;