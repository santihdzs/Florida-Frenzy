USE florida_frenzy;

SELECT DATABASE();

SHOW COLUMNS FROM character_game;
SHOW COLUMNS FROM florida_frenzy.character_game;

SELECT * FROM florida_frenzy.enemy ORDER BY enemy_name ASC;

-- tests
EXPLAIN SELECT florida_frenzy.deck.id_deck, florida_frenzy.deck.deck_name, florida_frenzy.deck.is_active FROM florida_frenzy.deck WHERE florida_frenzy.deck.id_player = 1;

EXPLAIN SELECT deck_card.id_deck, card_game.card_name, deck_card.cards_included FROM deck_card JOIN card_game ON deck_card.id_card_game = card_game.id_card_game WHERE deck_card.id_deck = 1;

EXPLAIN SELECT player_card.id_player, card_game.card_name, player_card.num_cards_owned FROM player_card JOIN card_game ON player_card.id_card_game = card_game.id_card_game WHERE player_card.id_player = 1;

EXPLAIN SELECT id_run, run_status, swamp_xp_earned, zones_done FROM run WHERE id_player = 1;

EXPLAIN SELECT battle.id_battle, enemy.enemy_name, zone_game.zone_name, battle.battle_result, battle.turn_count FROM battle JOIN enemy ON battle.id_enemy = enemy.id_enemy JOIN zone_game ON battle.id_zone_game = zone_game.id_zone_game WHERE battle.id_run = 1;