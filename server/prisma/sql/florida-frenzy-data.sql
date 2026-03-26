/*
1. character_game
2. enemy
3. zoine_game
4. card_game
*/

-- add (ch_name, ch_desc, base_hp, base_attack, base_defense, ch_ultimate, ch_ultimate_desc, is_default_unlocked)?
INSERT INTO character_game VALUES ('Christian', 'El intrépido líder del equipo, con habilidades balanceadas, y recuperación estable.', 100, 10, 10, 'Vertical Leap', 'Recupera 50% de su vida actual y 30% de su escudo - Obtiene en su mano una carta válida basada en la carta en mesa', TRUE),
('Gustav', 'La barricada más leal del clan. Siempre listo para proteger con su mítico escudo.', 110, 8, 15, 'Head Crack', 'Recupera 25% de su vida y 60% de su escudo - Se vuelve inmune a efectos durante el siguiente turno', TRUE),
('Gavin', 'El estratega, la "máquina" más confiable. De los cocodrilos más inteligentes del pantano.', 95, 12, 8, 'Testing', 'Recupera 30% de su vida y 30% de su escudo - Durante los siguientes 2 turnos, el daño recibido de cartas enemigas se reduce en un 50%', TRUE),
('Eddy', 'El rápido y pretencioso caimán. Ni quien lo detenga.', 85, 16, 6, 'Swamp Trait', 'Recupera 75% de su vida actual, pero pierde 35% de su escudo - Durante los siguientes 2 turnos, el daño de sus cartas se duplica', TRUE);
COMMIT;


-- ad (enemy_name, enemy_desc, enemy_type, faction, enemy_base_hp, ai_level, is_boss)
INSERT INTO enemy VALUES ('Rat Scout', 'Rápidos pero débiles', 'PLATFORMER_ENEMY', 'RAT', 40, 'EASY', FALSE),
('Raccoon Raider', 'Roaming balanceado', 'PLATFORMER_ENEMY', 'RACCOON', 60, 'MEDIUM', FALSE),
('Bear Brute', 'Tanques semi-centrados (estáticos)', 'PLATFORMER_ENEMY', 'BEAR', 100, 'HARD', FALSE),

('Skawl', 'Un oponente pequeño, astuto pero peligroso, siempre motivado por la victoria. Solía ser cocinero.', 'CARD_ENEMY', 'RAT', 150, 'EASY', TRUE),
('Rabyz', 'Enemigo muy inteligente y egoísta. Cuidado con sus astutos movimientos, podrías perder tu comida antes que nadie...', 'CARD_ENEMY', 'RACCOON', 175, 'MEDIUM', TRUE),
('Boldear', 'Un oponente formidable, que garantiza una pelea larga, tediosa y desagradable. Ni se te ocurra pedirle un abrazo.', 'CARD_ENEMY', 'BEAR', 275, 'HARD', TRUE),
('Pythra', 'Hay una razón por la que nadie dice ni una palabra cuando él está cerca... después de todo, es una especie invasora.', 'FINAL_BOSS', 'PYTHON', 350, 'HARD', TRUE);

INSERT INTO zone_game VALUES ('Swamp', 'map_swamp', 'El hogar del clan', 'EASY'),
('Garbage Dump', 'map_garbage', 'Basurero caótico', 'MEDIUM'),
('Suburbs', 'map_suburbs', 'Una calle peligrosa', 'HARD'),
('Sewers', 'map_sewers', 'Zona final en el desagüe', 'FINAL');


-- (card_name, card_category, card_element, card_number, card_effect, effect_desc, base_damage, energy_e_gain, energy_i_gain, energy_e_cost, energy_i_cost, card_rarity) 
INSERT INTO card_game VALUES
-- FIRE
('Fire 1', 'ATTACK', 'FIRE', 1, NULL, 'Base fire card', 1, 1, 1, 0, 0, 'BASE'),
('Fire 2', 'ATTACK', 'FIRE', 2, NULL, 'Base fire card', 2, 1, 1, 0, 0, 'BASE'),
('Fire 3', 'ATTACK', 'FIRE', 3, NULL, 'Base fire card', 3, 1, 1, 0, 0, 'BASE'),
('Fire 4', 'ATTACK', 'FIRE', 4, NULL, 'Base fire card', 4, 1, 2, 0, 0, 'BASE'),
('Fire 5', 'ATTACK', 'FIRE', 5, NULL, 'Base fire card', 5, 2, 2, 0, 0, 'BASE'),
('Fire 6', 'ATTACK', 'FIRE', 6, NULL, 'Base fire card', 6, 2, 2, 0, 0, 'BASE'),
('Fire 7', 'ATTACK', 'FIRE', 7, NULL, 'Base fire card', 7, 2, 3, 0, 0, 'BASE'),
('Fire 8', 'ATTACK', 'FIRE', 8, NULL, 'Base fire card', 8, 3, 3, 0, 0, 'BASE'),
('Fire 9', 'ATTACK', 'FIRE', 9, NULL, 'Base fire card', 9, 3, 3, 0, 0, 'BASE'),

-- WATER
('Water 1', 'DEFENSE', 'WATER', 1, NULL, 'Base water card', 0, 1, 1, 0, 0, 'BASE'),
('Water 2', 'DEFENSE', 'WATER', 2, NULL, 'Base water card', 0, 1, 1, 0, 0, 'BASE'),
('Water 3', 'DEFENSE', 'WATER', 3, NULL, 'Base water card', 0, 1, 1, 0, 0, 'BASE'),
('Water 4', 'DEFENSE', 'WATER', 4, NULL, 'Base water card', 0, 1, 2, 0, 0, 'BASE'),
('Water 5', 'DEFENSE', 'WATER', 5, NULL, 'Base water card', 0, 2, 2, 0, 0, 'BASE'),
('Water 6', 'DEFENSE', 'WATER', 6, NULL, 'Base water card', 0, 2, 2, 0, 0, 'BASE'),
('Water 7', 'DEFENSE', 'WATER', 7, NULL, 'Base water card', 0, 2, 3, 0, 0, 'BASE'),
('Water 8', 'DEFENSE', 'WATER', 8, NULL, 'Base water card', 0, 3, 3, 0, 0, 'BASE'),
('Water 9', 'DEFENSE', 'WATER', 9, NULL, 'Base water card', 0, 3, 3, 0, 0, 'BASE'),

-- SWAMP
('Swamp 1', 'STATUS', 'SWAMP', 1, NULL, 'Base swamp card', 0, 1, 1, 0, 0, 'BASE'),
('Swamp 2', 'STATUS', 'SWAMP', 2, NULL, 'Base swamp card', 0, 1, 1, 0, 0, 'BASE'),
('Swamp 3', 'STATUS', 'SWAMP', 3, NULL, 'Base swamp card', 0, 1, 1, 0, 0, 'BASE'),
('Swamp 4', 'STATUS', 'SWAMP', 4, NULL, 'Base swamp card', 0, 1, 2, 0, 0, 'BASE'),
('Swamp 5', 'STATUS', 'SWAMP', 5, NULL, 'Base swamp card', 0, 2, 2, 0, 0, 'BASE'),
('Swamp 6', 'STATUS', 'SWAMP', 6, NULL, 'Base swamp card', 0, 2, 2, 0, 0, 'BASE'),
('Swamp 7', 'STATUS', 'SWAMP', 7, NULL, 'Base swamp card', 0, 2, 3, 0, 0, 'BASE'),
('Swamp 8', 'STATUS', 'SWAMP', 8, NULL, 'Base swamp card', 0, 3, 3, 0, 0, 'BASE'),
('Swamp 9', 'STATUS', 'SWAMP', 9, NULL, 'Base swamp card', 0, 3, 3, 0, 0, 'BASE'),

-- SAND
('Sand 1', 'DEFENSE', 'SAND', 1, NULL, 'Base sand card', 0, 1, 1, 0, 0, 'BASE'),
('Sand 2', 'DEFENSE', 'SAND', 2, NULL, 'Base sand card', 0, 1, 1, 0, 0, 'BASE'),
('Sand 3', 'DEFENSE', 'SAND', 3, NULL, 'Base sand card', 0, 1, 1, 0, 0, 'BASE'),
('Sand 4', 'DEFENSE', 'SAND', 4, NULL, 'Base sand card', 0, 1, 2, 0, 0, 'BASE'),
('Sand 5', 'DEFENSE', 'SAND', 5, NULL, 'Base sand card', 0, 2, 2, 0, 0, 'BASE'),
('Sand 6', 'DEFENSE', 'SAND', 6, NULL, 'Base sand card', 0, 2, 2, 0, 0, 'BASE'),
('Sand 7', 'DEFENSE', 'SAND', 7, NULL, 'Base sand card', 0, 2, 3, 0, 0, 'BASE'),
('Sand 8', 'DEFENSE', 'SAND', 8, NULL, 'Base sand card', 0, 3, 3, 0, 0, 'BASE'),
('Sand 9', 'DEFENSE', 'SAND', 9, NULL, 'Base sand card', 0, 3, 3, 0, 0, 'BASE');