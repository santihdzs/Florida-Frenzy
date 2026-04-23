--- Florida Frenzy Database Triggers ---

-- Automatically update the lastLogin timestamp whenever a player's record is updated
CREATE OR REPLACE FUNCTION fn_update_last_login()
RETURNS TRIGGER AS $$
BEGIN
  NEW."lastLogin" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql; -- written in PostgreSQL's procedural language

CREATE TRIGGER trg_update_last_login
BEFORE UPDATE OF "lastLogin" ON "Player"
FOR EACH ROW
EXECUTE FUNCTION fn_update_last_login();


-- Increment totalGamesPlayed when a run is completed or abandoned
CREATE OR REPLACE FUNCTION fn_increment_total_games_played()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."runStatus" IN ('COMPLETED', 'ABANDONED')
     AND (OLD."runStatus" IS DISTINCT FROM NEW."runStatus") THEN
    UPDATE "Player"
    SET "totalGamesPlayed" = "totalGamesPlayed" + 1
    WHERE id = NEW."playerId";
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_increment_total_games_played
AFTER UPDATE ON "Run"
FOR EACH ROW
EXECUTE FUNCTION fn_increment_total_games_played();


-- Increment totalEnemiesKilled when a battle is won
CREATE OR REPLACE FUNCTION fn_increment_total_enemies_killed()
RETURNS TRIGGER AS $$
DECLARE
  v_player_id INT;
BEGIN
  IF NEW."battleResult" = 'WIN' THEN
    SELECT "playerId" INTO v_player_id
    FROM "Run"
    WHERE id = NEW."runId";

    UPDATE "Player"
    SET "totalEnemiesKilled" = "totalEnemiesKilled" + 1
    WHERE id = v_player_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_increment_total_enemies_killed
AFTER INSERT ON "Battle"
FOR EACH ROW
EXECUTE FUNCTION fn_increment_total_enemies_killed();


-- Sync zonesDone in Run whenever a RunZone is marked as COMPLETED
CREATE OR REPLACE FUNCTION fn_sync_zones_done()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'COMPLETED' THEN
    UPDATE "Run"
    SET "zonesDone" = (
      SELECT COUNT(*)
      FROM "RunZone"
      WHERE "runId" = NEW."runId"
        AND status = 'COMPLETED'
    )
    WHERE id = NEW."runId";
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_zones_done
AFTER INSERT OR UPDATE ON "RunZone"
FOR EACH ROW
EXECUTE FUNCTION fn_sync_zones_done();