/*
1. character_game
2. enemy
3. zone_game
4. card_game
*/

INSERT INTO character_game (ch_name, ch_desc, base_hp, base_attack, base_defense, ch_ultimate, ch_ultimate_desc, is_default_unlocked) VALUES ('Christian', 'El intrépido líder del equipo, con habilidades balanceadas, y recuperación estable.', 100, 10, 10, 'Vertical Leap', 'Recupera 50% de su vida actual y 30% de su escudo - Obtiene en su mano una carta válida basada en la carta en mesa', TRUE),
('Gustav', 'La barricada más leal del clan. Siempre listo para proteger con su mítico escudo.', 110, 8, 15, 'Head Crack', 'Recupera 25% de su vida y 60% de su escudo - Se vuelve inmune a efectos durante el siguiente turno', TRUE),
('Gavin', 'El estratega, la "máquina" más confiable. De los cocodrilos más inteligentes del pantano.', 95, 12, 8, 'Testing', 'Recupera 30% de su vida y 30% de su escudo - Durante los siguientes 2 turnos, el daño recibido de cartas enemigas se reduce en un 50%', TRUE),
('Eddy', 'El rápido y pretencioso caimán. Ni quien lo detenga.', 85, 16, 6, 'Swamp Trait', 'Recupera 75% de su vida actual, pero pierde 35% de su escudo - Durante los siguientes 2 turnos, el daño de sus cartas se duplica', TRUE);
COMMIT;

INSERT INTO enemy (enemy_name, enemy_desc, enemy_type, faction, enemy_base_hp, enemy_ultimate, enemy_ultimate_desc, ai_level) VALUES 
-- PLATFORMER
('Rat Scout', 'Rápidos pero débiles', 'PLATFORMER_ENEMY', 'RAT', 40, 'EASY', NULL, NULL),
('Raccoon Raider', 'Roaming balanceado', 'PLATFORMER_ENEMY', 'RACCOON', 60, 'MEDIUM', NULL, NULL),
('Bear Brute', 'Tanques semi-centrados (estáticos)', 'PLATFORMER_ENEMY', 'BEAR', 100, 'HARD', NULL, NULL),

-- BOSSES
('Skawl', 'Pequeño, astuto y peligroso.', 'CARD_ENEMY', 'RAT', 150, 'EASY', 'Shield Break', 'Reduce daño recibido y debilita ataques del jugador por 2 turnos'),
('Rabyz', 'Inteligente y egoísta.', 'CARD_ENEMY', 'RACCOON', 175, 'MEDIUM', 'Cleanse Drain', 'Elimina efectos activos y reduce energía del jugador'),
('Boldear', 'Formidable y resistente.', 'CARD_ENEMY', 'BEAR', 275, 'HARD', 'Crushing Control', 'Limita al jugador a 1 carta y bloquea potenciación'),
('Pythra', 'Boss final dominante.', 'FINAL_BOSS', 'PYTHON', 350, 'HARD', 'Frozen Dominion', 'Usa cartas de hielo y replica habilidades de otros bosses');


INSERT INTO zone_game (zone_name, zone_map, zone_desc, zone_difficulty_set) VALUES ('Swamp', 'map_swamp', 'El hogar del clan', 'EASY'),
('Garbage Dump', 'map_garbage', 'Basurero caótico', 'MEDIUM'),
('Suburbs', 'map_suburbs', 'Una calle peligrosa', 'HARD'),
('Sewers', 'map_sewers', 'Zona final en el desagüe', 'FINAL');


INSERT INTO card_game (card_name, card_category, card_element, card_number, card_effect, effect_desc, base_damage, energy_e_gain, energy_i_gain, energy_e_cost, energy_i_cost, card_rarity) VALUES
-- FIRE
('Fire 1', 'ATTACK', 'FIRE', 1, 'DAMAGE', 'Deal direct damage equal to value', 1, 1, 1, 0, 0, 'BASE'),
('Fire 2', 'ATTACK', 'FIRE', 2, 'DAMAGE', 'Deal direct damage equal to value', 2, 1, 1, 0, 0, 'BASE'),
('Fire 3', 'ATTACK', 'FIRE', 3, 'DAMAGE', 'Deal direct damage equal to value', 3, 1, 1, 0, 0, 'BASE'),
('Fire 4', 'ATTACK', 'FIRE', 4, 'DAMAGE', 'Deal direct damage equal to value', 4, 1, 2, 0, 0, 'BASE'),
('Fire 5', 'ATTACK', 'FIRE', 5, 'DAMAGE', 'Deal direct damage equal to value', 5, 2, 2, 0, 0, 'BASE'),
('Fire 6', 'ATTACK', 'FIRE', 6, 'DAMAGE', 'Deal direct damage equal to value', 6, 2, 2, 0, 0, 'BASE'),
('Fire 7', 'ATTACK', 'FIRE', 7, 'DAMAGE', 'Deal direct damage equal to value', 7, 2, 3, 0, 0, 'BASE'),
('Fire 8', 'ATTACK', 'FIRE', 8, 'DAMAGE', 'Deal direct damage equal to value', 8, 3, 3, 0, 0, 'BASE'),
('Fire 9', 'ATTACK', 'FIRE', 9, 'DAMAGE', 'Deal direct damage equal to value', 9, 3, 3, 0, 0, 'BASE'),

-- WATER
('Water 1', 'DEFENSE', 'WATER', 1, 'SHIELD', 'Gain shield equal to value', 0, 1, 1, 0, 0, 'BASE'),
('Water 2', 'DEFENSE', 'WATER', 2, 'SHIELD', 'Gain shield equal to value', 0, 1, 1, 0, 0, 'BASE'),
('Water 3', 'DEFENSE', 'WATER', 3, 'SHIELD', 'Gain shield equal to value', 0, 1, 1, 0, 0, 'BASE'),
('Water 4', 'DEFENSE', 'WATER', 4, 'SHIELD', 'Gain shield equal to value', 0, 1, 2, 0, 0, 'BASE'),
('Water 5', 'DEFENSE', 'WATER', 5, 'SHIELD', 'Gain shield equal to value', 0, 2, 2, 0, 0, 'BASE'),
('Water 6', 'DEFENSE', 'WATER', 6, 'SHIELD', 'Gain shield equal to value', 0, 2, 2, 0, 0, 'BASE'),
('Water 7', 'DEFENSE', 'WATER', 7, 'SHIELD', 'Gain shield equal to value', 0, 2, 3, 0, 0, 'BASE'),
('Water 8', 'DEFENSE', 'WATER', 8, 'SHIELD', 'Gain shield equal to value', 0, 3, 3, 0, 0, 'BASE'),
('Water 9', 'DEFENSE', 'WATER', 9, 'SHIELD', 'Gain shield equal to value', 0, 3, 3, 0, 0, 'BASE'),

-- SWAMP
('Swamp 1', 'STATUS', 'SWAMP', 1, 'POISON', 'Apply poison damage over time', 0, 1, 1, 0, 0, 'BASE'),
('Swamp 2', 'STATUS', 'SWAMP', 2, 'POISON', 'Apply poison damage over time', 0, 1, 1, 0, 0, 'BASE'),
('Swamp 3', 'STATUS', 'SWAMP', 3, 'POISON', 'Apply poison damage over time', 0, 1, 1, 0, 0, 'BASE'),
('Swamp 4', 'STATUS', 'SWAMP', 4, 'POISON', 'Apply poison damage over time', 0, 1, 2, 0, 0, 'BASE'),
('Swamp 5', 'STATUS', 'SWAMP', 5, 'POISON', 'Apply poison damage over time', 0, 2, 2, 0, 0, 'BASE'),
('Swamp 6', 'STATUS', 'SWAMP', 6, 'POISON', 'Apply poison damage over time', 0, 2, 2, 0, 0, 'BASE'),
('Swamp 7', 'STATUS', 'SWAMP', 7, 'POISON', 'Apply poison damage over time', 0, 2, 3, 0, 0, 'BASE'),
('Swamp 8', 'STATUS', 'SWAMP', 8, 'POISON', 'Apply poison damage over time', 0, 3, 3, 0, 0, 'BASE'),
('Swamp 9', 'STATUS', 'SWAMP', 9, 'POISON', 'Apply poison damage over time', 0, 3, 3, 0, 0, 'BASE'),

-- SAND
('Sand 1', 'DEFENSE', 'SAND', 1, 'WEAKEN', 'Reduce incoming damage next turn', 0, 1, 1, 0, 0, 'BASE'),
('Sand 2', 'DEFENSE', 'SAND', 2, 'WEAKEN', 'Reduce incoming damage next turn', 0, 1, 1, 0, 0, 'BASE'),
('Sand 3', 'DEFENSE', 'SAND', 3, 'WEAKEN', 'Reduce incoming damage next turn', 0, 1, 1, 0, 0, 'BASE'),
('Sand 4', 'DEFENSE', 'SAND', 4, 'WEAKEN', 'Reduce incoming damage next turn', 0, 1, 2, 0, 0, 'BASE'),
('Sand 5', 'DEFENSE', 'SAND', 5, 'WEAKEN', 'Reduce incoming damage next turn', 0, 2, 2, 0, 0, 'BASE'),
('Sand 6', 'DEFENSE', 'SAND', 6, 'WEAKEN', 'Reduce incoming damage next turn', 0, 2, 2, 0, 0, 'BASE'),
('Sand 7', 'DEFENSE', 'SAND', 7, 'WEAKEN', 'Reduce incoming damage next turn', 0, 2, 3, 0, 0, 'BASE'),
('Sand 8', 'DEFENSE', 'SAND', 8, 'WEAKEN', 'Reduce incoming damage next turn', 0, 3, 3, 0, 0, 'BASE'),
('Sand 9', 'DEFENSE', 'SAND', 9, 'WEAKEN', 'Reduce incoming damage next turn', 0, 3, 3, 0, 0, 'BASE');