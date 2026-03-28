-- ENCODIGN - ENGINE
-- PRIMARY KEY EXTERNAL ELEMENTS
-- OPTIMIZATION KEYS

DROP SCHEMA IF EXISTS florida_frenzy;
CREATE SCHEMA florida_frenzy;
USE florida_frenzy;

CREATE TABLE player (
    id_player SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    username VARCHAR(30) NOT NULL,
    nickname VARCHAR(50),
    email VARCHAR(100) NOT NULL,
    swamp_xp INT NOT NULL DEFAULT 0,
    clan_rank ENUM('ROOKIE', 'FIGHTER', 'VETERAN') NOT NULL DEFAULT 'ROOKIE',
    first_login DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME NULL DEFAULT NULL

    PRIMARY KEY (id_player),
    UNIQUE KEY uq_player_username (username),
    UNIQUE KEY uq_player_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE character_game (
    id_character_game SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    ch_name VARCHAR(50) NOT NULL,
    ch_desc TEXT,
    base_hp SMALLINT UNSIGNED NOT NULL DEFAULT 100,
    base_attack SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    base_defense SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    ch_ultimate VARCHAR(100) NOT NULL,
    ch_ultimate_desc TEXT,
    is_default_unlocked BOOLEAN NOT NULL DEFAULT FALSE,

    PRIMARY KEY (id_character_game),
    UNIQUE KEY uq_character_game_name (ch_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE card_game (
    id_card_game SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    card_name VARCHAR(100) NOT NULL,
    card_category ENUM('ATTACK', 'DEFENSE', 'STATUS', 'SPECIAL') NOT NULL,
    card_element ENUM('FIRE', 'WATER', 'SWAMP', 'SAND', 'ICE') NOT NULL,
    card_number TINYINT UNSIGNED NULL,
    card_effect VARCHAR(100),
    effect_desc TEXT,
    base_damage SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    energy_e_gain TINYINT UNSIGNED NOT NULL DEFAULT 0,
    energy_i_gain TINYINT UNSIGNED NOT NULL DEFAULT 0,
    energy_e_cost TINYINT UNSIGNED NOT NULL DEFAULT 0,
    energy_i_cost TINYINT UNSIGNED NOT NULL DEFAULT 0,
    card_rarity ENUM('BASE', 'EFFECT', 'RARE', 'CLAN') NOT NULL DEFAULT 'BASE',

    PRIMARY KEY (id_card_game),
    UNIQUE KEY uq_card_game_name (card_name),
    KEY idx_card_game_category (card_category),
    KEY idx_card_game_element (card_element),
    KEY idx_card_game_rarity (card_rarity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE enemy (
    id_enemy SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    enemy_name VARCHAR(50) NOT NULL,
    enemy_desc TEXT,
    enemy_type ENUM('PLATFORMER_ENEMY', 'CARD_ENEMY', 'FINAL_BOSS') NOT NULL,
    faction ENUM('RAT', 'RACCOON', 'BEAR', 'PYTHON') NOT NULL,
    enemy_base_hp SMALLINT UNSIGNED NOT NULL DEFAULT 100,
    enemy_ultimate VARCHAR(100),
    enemy_ultimate_desc TEXT,
    ai_level ENUM('EASY', 'MEDIUM', 'HARD') NOT NULL DEFAULT 'EASY',

    PRIMARY KEY (id_enemy),
    UNIQUE KEY uq_enemy_name (enemy_name),
    KEY idx_enemy_type (enemy_type),
    KEY idx_enemy_faction (faction),
    KEY idx_enemy_ai_level (ai_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE zone_game (
    id_zone_game SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    zone_name VARCHAR(50) NOT NULL,
    zone_map VARCHAR(100),
    zone_desc TEXT,
    zone_difficulty_set ENUM('EASY', 'MEDIUM', 'HARD', 'FINAL') NOT NULL DEFAULT 'EASY',

    PRIMARY KEY (id_zone_game),
    UNIQUE KEY uq_zone_game_name (zone_name),
    KEY idx_zone_game_difficulty (zone_difficulty_set)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE player_character (
    id_player_character INT UNSIGNED NOT NULL AUTO_INCREMENT,
    id_player SMALLINT UNSIGNED NOT NULL,
    id_character_game SMALLINT UNSIGNED NOT NULL,
    is_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
    used_times INT UNSIGNED NOT NULL DEFAULT 0,

    PRIMARY KEY (id_player_character),
    KEY idx_player_character_player (id_player),
    KEY idx_player_character_character (id_character_game),
    UNIQUE KEY uq_player_character_game (id_player, id_character_game),
    CONSTRAINT fk_player_character_player FOREIGN KEY (id_player) REFERENCES player(id_player) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_player_character_character_game FOREIGN KEY (id_character_game) REFERENCES character_game(id_character_game) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE player_card (
    id_player_card INT UNSIGNED NOT NULL AUTO_INCREMENT,
    id_player SMALLINT UNSIGNED NOT NULL,
    id_card_game SMALLINT UNSIGNED NOT NULL,
    num_cards_owned INT UNSIGNED NOT NULL DEFAULT 1,
    is_unlocked BOOLEAN NOT NULL DEFAULT FALSE,

    PRIMARY KEY (id_player_card),
    KEY idx_player_card_player (id_player),
    KEY idx_player_card_card_game (id_card_game),
    UNIQUE KEY uq_player_card_game (id_player, id_card_game),
    CONSTRAINT fk_player_card_player FOREIGN KEY (id_player) REFERENCES player(id_player) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_player_card_card_game FOREIGN KEY (id_card_game) REFERENCES card_game(id_card_game) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE deck (
    id_deck SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    deck_name VARCHAR(40) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    creation_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_player SMALLINT UNSIGNED NOT NULL,
    id_character_game SMALLINT UNSIGNED NOT NULL,

    PRIMARY KEY (id_deck),
    KEY idx_deck_player (id_player),
    KEY idx_deck_character_game (id_character_game),
    KEY idx_deck_is_active (is_active),
    CONSTRAINT fk_deck_player FOREIGN KEY (id_player) REFERENCES player(id_player) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_deck_character_game FOREIGN KEY (id_character_game) REFERENCES character_game(id_character_game) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE deck_card (
    id_deck_card INT UNSIGNED NOT NULL AUTO_INCREMENT,
    id_deck SMALLINT UNSIGNED NOT NULL,
    id_card_game SMALLINT UNSIGNED NOT NULL,
    cards_included TINYINT UNSIGNED NOT NULL DEFAULT 1,

    PRIMARY KEY (id_deck_card),
    KEY idx_deck_card_deck (id_deck),
    KEY idx_deck_card_card_game (id_card_game),
    UNIQUE KEY uq_deck_card (id_deck, id_card_game),
    CONSTRAINT fk_deck_card_deck FOREIGN KEY (id_deck) REFERENCES deck(id_deck) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_deck_card_card_game FOREIGN KEY (id_card_game) REFERENCES card_game(id_card_game) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE run (
    id_run INT UNSIGNED NOT NULL AUTO_INCREMENT,
    start_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME NULL,
    run_status ENUM('WIN', 'IN_PROGRESS', 'LOSE') NOT NULL DEFAULT 'IN_PROGRESS',
    zones_done TINYINT UNSIGNED NOT NULL DEFAULT 0,
    swamp_xp_earned INT UNSIGNED NOT NULL DEFAULT 0,
    id_player SMALLINT UNSIGNED NOT NULL,
    id_character_game SMALLINT UNSIGNED NOT NULL,
    id_deck SMALLINT UNSIGNED NOT NULL,

    PRIMARY KEY (id_run),
    KEY idx_run_player (id_player),
    KEY idx_run_character_game (id_character_game),
    KEY idx_run_deck (id_deck),
    KEY idx_run_status (run_status),
    CONSTRAINT fk_run_player FOREIGN KEY (id_player) REFERENCES player(id_player) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_run_character_game FOREIGN KEY (id_character_game) REFERENCES character_game(id_character_game) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_run_deck FOREIGN KEY (id_deck) REFERENCES deck(id_deck) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE run (
    id_run INT UNSIGNED NOT NULL AUTO_INCREMENT,
    start_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME NULL,
    run_status ENUM('WIN', 'IN_PROGRESS', 'LOSE') NOT NULL DEFAULT 'IN_PROGRESS',
    zones_done TINYINT UNSIGNED NOT NULL DEFAULT 0,
    swamp_xp_earned INT UNSIGNED NOT NULL DEFAULT 0,
    id_player SMALLINT UNSIGNED NOT NULL,
    id_character_game SMALLINT UNSIGNED NOT NULL,
    id_deck SMALLINT UNSIGNED NOT NULL,

    PRIMARY KEY (id_run),
    KEY idx_run_player (id_player),
    KEY idx_run_character_game (id_character_game),
    KEY idx_run_deck (id_deck),
    KEY idx_run_status (run_status),
    CONSTRAINT fk_run_player FOREIGN KEY (id_player) REFERENCES player(id_player) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_run_character_game FOREIGN KEY (id_character_game) REFERENCES character_game(id_character_game) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_run_deck FOREIGN KEY (id_deck) REFERENCES deck(id_deck) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
