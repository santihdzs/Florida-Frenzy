-- TEST DATA (generada por ChatGPT)

USE florida_frenzy;

-- ---------------------------------------------------------
-- PLAYERS
-- ---------------------------------------------------------
INSERT INTO player (username, nickname, email, swamp_xp, clan_rank) VALUES
('player_01', 'P1', 'player1@test.com', 120, 'FIGHTER'),
('player_02', 'P2', 'player2@test.com', 40, 'ROOKIE'),
('player_03', 'P3', 'player3@test.com', 260, 'VETERAN');

-- ---------------------------------------------------------
-- PLAYER_CHARACTER
-- Assumes character_game ids:
-- 1 Christian
-- 2 Gustav
-- 3 Gavin
-- 4 Eddy
-- ---------------------------------------------------------
INSERT INTO player_character (id_player, id_character_game, is_unlocked, used_times) VALUES
(1, 1, TRUE, 5),
(1, 2, TRUE, 2),
(1, 3, TRUE, 1),
(1, 4, TRUE, 0),

(2, 1, TRUE, 3),
(2, 2, FALSE, 0),
(2, 3, FALSE, 0),
(2, 4, FALSE, 0),

(3, 1, TRUE, 10),
(3, 2, TRUE, 8),
(3, 3, TRUE, 7),
(3, 4, TRUE, 6);

-- ---------------------------------------------------------
-- PLAYER_CARD
-- Assumes card_game ids 1..36 exist for base cards
-- ---------------------------------------------------------
INSERT INTO player_card (id_player, id_card_game, num_cards_owned, is_unlocked) VALUES
-- Player 1
(1, 1, 2, TRUE),
(1, 2, 2, TRUE),
(1, 3, 2, TRUE),
(1, 10, 2, TRUE),
(1, 11, 2, TRUE),
(1, 19, 1, TRUE),
(1, 20, 1, TRUE),
(1, 28, 1, TRUE),
(1, 29, 1, TRUE),

-- Player 2
(2, 1, 1, TRUE),
(2, 10, 1, TRUE),
(2, 19, 1, TRUE),
(2, 28, 1, TRUE),

-- Player 3
(3, 1, 3, TRUE),
(3, 5, 2, TRUE),
(3, 9, 1, TRUE),
(3, 10, 2, TRUE),
(3, 14, 2, TRUE),
(3, 18, 1, TRUE),
(3, 19, 2, TRUE),
(3, 23, 2, TRUE),
(3, 27, 1, TRUE),
(3, 28, 2, TRUE),
(3, 32, 2, TRUE),
(3, 36, 1, TRUE);

-- ---------------------------------------------------------
-- DECK
-- Assumes character ids:
-- 1 Christian
-- 2 Gustav
-- 3 Gavin
-- 4 Eddy
-- ---------------------------------------------------------
INSERT INTO deck (deck_name, is_active, id_player, id_character_game) VALUES
('P1 Starter Deck', TRUE, 1, 1),
('P1 Defense Deck', FALSE, 1, 2),
('P2 Rookie Deck', TRUE, 2, 1),
('P3 Veteran Deck', TRUE, 3, 4);

-- ---------------------------------------------------------
-- DECK_CARD
-- Assumes deck ids were generated in insertion order:
-- 1 P1 Starter Deck
-- 2 P1 Defense Deck
-- 3 P2 Rookie Deck
-- 4 P3 Veteran Deck
-- ---------------------------------------------------------
INSERT INTO deck_card (id_deck, id_card_game, cards_included) VALUES
-- P1 Starter Deck
(1, 1, 2),
(1, 2, 2),
(1, 10, 2),
(1, 19, 1),
(1, 28, 1),

-- P1 Defense Deck
(2, 10, 2),
(2, 11, 2),
(2, 12, 2),
(2, 28, 2),
(2, 29, 1),

-- P2 Rookie Deck
(3, 1, 1),
(3, 10, 1),
(3, 19, 1),
(3, 28, 1),

-- P3 Veteran Deck
(4, 5, 2),
(4, 9, 1),
(4, 14, 2),
(4, 23, 2),
(4, 32, 2);

-- ---------------------------------------------------------
-- RUN
-- ---------------------------------------------------------
INSERT INTO run (start_time, end_time, run_status, zones_done, swamp_xp_earned, id_player, id_character_game, id_deck) VALUES
('2026-03-28 18:00:00', '2026-03-28 18:25:00', 'WIN', 4, 100, 1, 1, 1),
('2026-03-28 19:00:00', '2026-03-28 19:10:00', 'LOSE', 2, 35, 2, 1, 3),
('2026-03-28 20:00:00', NULL, 'IN_PROGRESS', 1, 0, 3, 4, 4);

-- ---------------------------------------------------------
-- BATTLE
-- Assumes zone_game ids:
-- 1 Swamp
-- 2 Garbage Dump
-- 3 Suburbs
-- 4 Sewers
--
-- Assumes enemy ids:
-- 4 Skawl
-- 5 Rabyz
-- 6 Boldear
-- 7 Pythra
-- ---------------------------------------------------------
INSERT INTO battle
(battle_result, turn_count, player_hp_remaining, enemy_hp_remaining, start_time, end_time, id_run, id_zone_game, id_enemy) VALUES
('WIN', 9, 78, 0, '2026-03-28 18:03:00', '2026-03-28 18:07:00', 1, 1, 4),
('WIN', 12, 61, 0, '2026-03-28 18:10:00', '2026-03-28 18:15:00', 1, 2, 5),
('WIN', 15, 40, 0, '2026-03-28 18:17:00', '2026-03-28 18:22:00', 1, 3, 6),
('WIN', 20, 12, 0, '2026-03-28 18:23:00', '2026-03-28 18:25:00', 1, 4, 7),

('WIN', 8, 65, 0, '2026-03-28 19:01:00', '2026-03-28 19:05:00', 2, 1, 4),
('LOSE', 11, 0, 35, '2026-03-28 19:06:00', '2026-03-28 19:10:00', 2, 2, 5),

('WIN', 7, 83, 0, '2026-03-28 20:02:00', '2026-03-28 20:06:00', 3, 1, 4);