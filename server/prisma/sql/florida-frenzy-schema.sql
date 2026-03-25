-- ENCODIGN - ENGINE
-- PRIMARY KEY EXTERNAL ELEMENTS
-- OPTIMIZATION KEYS

DROP SCHEMA IF EXISTS florida_frenzy;
CREATE SCHEMA florida_frenzy;
USE florida_frenzy;

CREATE TABLE player (
    id_player INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(30) NOT NULL UNIQUE,
    nickname VARCHAR(50),
    email VARCHAR(100) NOT NULL UNIQUE,
    swamp_xp INT NOT NULL DEFAULT 0,
    clan_rank ENUM('ROOKIE', 'FIGHTER', 'VETERAN') NOT NULL DEFAULT 'ROOKIE',
    first_login DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME NULL DEFAULT NULL
);

CREATE TABLE character_game (
    id_character_game INT AUTO_INCREMENT PRIMARY KEY,
    ch_name VARCHAR(50) NOT NULL UNIQUE,
    ch_desc TEXT,
    base_hp INT NOT NULL DEFAULT 100,
    base_attack INT NOT NULL DEFAULT 0,
    base_defense INT NOT NULL DEFAULT 0,
    ch_ultimate VARCHAR(100) NOT NULL,
    ch_ultimate_desc TEXT,
    is_default_unlocked BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE card_game (
    id_card_game INT AUTO_INCREMENT PRIMARY KEY,
    card_name VARCHAR(100) NOT NULL UNIQUE,
    card_category ENUM('ATTACK', 'DEFENSE', 'STATUS', 'SPECIAL') NOT NULL,
    card_element ENUM('FIRE', 'WATER', 'SWAMP', 'SAND', 'ICE') NOT NULL,
    card_number INT NULL,
    card_effect VARCHAR(100),
    effect_desc TEXT,
    base_damage INT NOT NULL DEFAULT 0,
    energy_e_gain INT NOT NULL DEFAULT 0,
    energy_i_gain INT NOT NULL DEFAULT 0,
    energy_e_cost INT NOT NULL DEFAULT 0,
    energy_i_cost INT NOT NULL DEFAULT 0,
    card_rarity ENUM('BASE', 'EFFECT', 'RARE', 'CLAN') NOT NULL DEFAULT 'BASE'
);

CREATE TABLE enemy (
    id_enemy INT AUTO_INCREMENT PRIMARY KEY,
    enemy_name VARCHAR(50) NOT NULL UNIQUE,
    enemy_desc TEXT,
    enemy_type ENUM('PLATFORMER_ENEMY', 'CARD_ENEMY', 'FINAL_BOSS') NOT NULL,
    faction ENUM('RAT', 'RACCOON', 'BEAR', 'PYTHON') NOT NULL,
    enemy_base_hp INT NOT NULL DEFAULT 100,
    ai_level ENUM('EASY', 'MEDIUM', 'HARD') NOT NULL DEFAULT 'EASY',
    is_boss BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE zone_game (
    id_zone_game INT AUTO_INCREMENT PRIMARY KEY,
    zone_name VARCHAR(50) NOT NULL UNIQUE,
    zone_map VARCHAR(100),
    zone_desc TEXT,
    zone_difficulty_set ENUM('EASY', 'MEDIUM', 'HARD', 'FINAL') NOT NULL DEFAULT 'EASY'
);

CREATE TABLE player_character (
    id_player_character INT AUTO_INCREMENT PRIMARY KEY,
    id_player INT NOT NULL,
    id_character_game INT NOT NULL,
    is_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
    used_times INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_player_character_player FOREIGN KEY (id_player) REFERENCES player(id_player) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_player_character_character_game FOREIGN KEY (id_character_game) REFERENCES character_game(id_character_game) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT uq_player_character_game UNIQUE (id_player, id_character_game)
);

CREATE TABLE player_card (
    id_player_card INT AUTO_INCREMENT PRIMARY KEY,
    id_player INT NOT NULL,
    id_card_game INT NOT NULL,
    num_cards_owned INT NOT NULL DEFAULT 1,
    is_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_player_card_player FOREIGN KEY (id_player) REFERENCES player(id_player) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_player_card_card_game FOREIGN KEY (id_card_game) REFERENCES card_game(id_card_game) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT uq_player_card_game UNIQUE (id_player, id_card_game)
);

CREATE TABLE deck (
    id_deck INT AUTO_INCREMENT PRIMARY KEY,
    deck_name VARCHAR(40) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    creation_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_player INT NOT NULL,
    id_character_game INT NOT NULL,
    CONSTRAINT fk_deck_player FOREIGN KEY (id_player) REFERENCES player(id_player) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_deck_character_game FOREIGN KEY (id_character_game) REFERENCES character_game(id_character_game) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE deck_card (
    id_deck_card INT AUTO_INCREMENT PRIMARY KEY,
    id_deck INT NOT NULL,
    id_card_game INT NOT NULL,
    cards_included INT NOT NULL DEFAULT 1,
    CONSTRAINT fk_deck_card_deck FOREIGN KEY (id_deck) REFERENCES deck(id_deck) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_deck_card_card_game FOREIGN KEY (id_card_game) REFERENCES card_game(id_card_game) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT uq_deck_card UNIQUE (id_deck, id_card_game)
);

CREATE TABLE run (
    id_run INT AUTO_INCREMENT PRIMARY KEY,
    start_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME NULL,
    run_status ENUM('WIN', 'IN_PROGRESS', 'LOSE') NOT NULL DEFAULT 'IN_PROGRESS',
    zones_done INT NOT NULL DEFAULT 0,
    swamp_xp_earned INT NOT NULL DEFAULT 0,
    id_player INT NOT NULL,
    id_character_game INT NOT NULL,
    id_deck INT NOT NULL,
    CONSTRAINT fk_run_player FOREIGN KEY (id_player) REFERENCES player(id_player) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_run_character_game FOREIGN KEY (id_character_game) REFERENCES character_game(id_character_game) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_run_deck FOREIGN KEY (id_deck) REFERENCES deck(id_deck) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE battle (
    id_battle INT AUTO_INCREMENT PRIMARY KEY,
    battle_result ENUM('WIN', 'LOSE') NOT NULL,
    turn_count INT NOT NULL DEFAULT 0,
    player_hp_remaining INT NOT NULL DEFAULT 0,
    enemy_hp_remaining INT NOT NULL DEFAULT 0,
    start_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME NULL,
    id_run INT NOT NULL,
    id_zone_game INT NOT NULL,
    id_enemy INT NOT NULL,
    CONSTRAINT fk_battle_run FOREIGN KEY (id_run) REFERENCES run(id_run) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_battle_zone_game FOREIGN KEY (id_zone_game) REFERENCES zone_game(id_zone_game) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_battle_enemy FOREIGN KEY (id_enemy) REFERENCES enemy(id_enemy) ON DELETE CASCADE ON UPDATE CASCADE
);