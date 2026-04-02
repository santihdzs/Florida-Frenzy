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

INSERT INTO enemy (enemy_name, enemy_desc, enemy_type, faction, enemy_base_hp, ai_level, enemy_ultimate, enemy_ultimate_desc) VALUES 
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


INSERT INTO card_game
(card_name, card_category, card_element, card_number, card_effect, effect_desc, base_damage, shield_value, effect_value, effect_duration, effect_value_secondary, energy_e_gain, energy_i_gain, energy_e_cost, energy_i_cost, card_rarity) VALUES
-- =========================
-- FIRE BASE
-- =========================
('Fire 1','ATTACK','FIRE',1,'DAMAGE','Deal direct damage equal to value',1,0,1,0,0,1,1,0,0,'BASE'),
('Fire 2','ATTACK','FIRE',2,'DAMAGE','Deal direct damage equal to value',2,0,2,0,0,1,1,0,0,'BASE'),
('Fire 3','ATTACK','FIRE',3,'DAMAGE','Deal direct damage equal to value',3,0,3,0,0,1,1,0,0,'BASE'),
('Fire 4','ATTACK','FIRE',4,'DAMAGE','Deal direct damage equal to value',4,0,4,0,0,1,2,0,0,'BASE'),
('Fire 5','ATTACK','FIRE',5,'DAMAGE','Deal direct damage equal to value',5,0,5,0,0,2,2,0,0,'BASE'),
('Fire 6','ATTACK','FIRE',6,'DAMAGE','Deal direct damage equal to value',6,0,6,0,0,2,2,0,0,'BASE'),
('Fire 7','ATTACK','FIRE',7,'DAMAGE','Deal direct damage equal to value',7,0,7,0,0,2,3,0,0,'BASE'),
('Fire 8','ATTACK','FIRE',8,'DAMAGE','Deal direct damage equal to value',8,0,8,0,0,3,3,0,0,'BASE'),
('Fire 9','ATTACK','FIRE',9,'DAMAGE','Deal direct damage equal to value',9,0,9,0,0,3,3,0,0,'BASE'),

-- =========================
-- WATER BASE
-- =========================
('Water 1','DEFENSE','WATER',1,'SHIELD','Gain shield equal to value',0,1,1,0,0,1,1,0,0,'BASE'),
('Water 2','DEFENSE','WATER',2,'SHIELD','Gain shield equal to value',0,2,2,0,0,1,1,0,0,'BASE'),
('Water 3','DEFENSE','WATER',3,'SHIELD','Gain shield equal to value',0,3,3,0,0,1,1,0,0,'BASE'),
('Water 4','DEFENSE','WATER',4,'SHIELD','Gain shield equal to value',0,4,4,0,0,1,2,0,0,'BASE'),
('Water 5','DEFENSE','WATER',5,'SHIELD','Gain shield equal to value',0,5,5,0,0,2,2,0,0,'BASE'),
('Water 6','DEFENSE','WATER',6,'SHIELD','Gain shield equal to value',0,6,6,0,0,2,2,0,0,'BASE'),
('Water 7','DEFENSE','WATER',7,'SHIELD','Gain shield equal to value',0,7,7,0,0,2,3,0,0,'BASE'),
('Water 8','DEFENSE','WATER',8,'SHIELD','Gain shield equal to value',0,8,8,0,0,3,3,0,0,'BASE'),
('Water 9','DEFENSE','WATER',9,'SHIELD','Gain shield equal to value',0,9,9,0,0,3,3,0,0,'BASE'),

-- =========================
-- SWAMP BASE
-- =========================
('Swamp 1','STATUS','SWAMP',1,'POISON','Apply poison over time',0,0,1,1,0,1,1,0,0,'BASE'),
('Swamp 2','STATUS','SWAMP',2,'POISON','Apply poison over time',0,0,2,1,0,1,1,0,0,'BASE'),
('Swamp 3','STATUS','SWAMP',3,'POISON','Apply poison over time',0,0,1,1,0,1,1,0,0,'BASE'),
('Swamp 4','STATUS','SWAMP',4,'POISON','Apply poison over time',0,0,1,1,0,1,2,0,0,'BASE'),
('Swamp 5','STATUS','SWAMP',5,'POISON','Apply poison over time',0,0,1,1,0,2,2,0,0,'BASE'),
('Swamp 6','STATUS','SWAMP',6,'POISON','Apply poison over time',0,0,2,1,0,2,2,0,0,'BASE'),
('Swamp 7','STATUS','SWAMP',7,'POISON','Apply poison over time',0,0,2,1,0,2,3,0,0,'BASE'),
('Swamp 8','STATUS','SWAMP',8,'POISON','Apply poison over time',0,0,2,1,0,3,3,0,0,'BASE'),
('Swamp 9','STATUS','SWAMP',9,'POISON','Apply poison over time',0,0,3,1,0,3,3,0,0,'BASE'),

-- =========================
-- SAND BASE
-- =========================
('Sand 1','DEFENSE','SAND',1,'WEAKEN','Reduce incoming damage next turn',0,0,1,1,0,1,1,0,0,'BASE'),
('Sand 2','DEFENSE','SAND',2,'WEAKEN','Reduce incoming damage next turn',0,0,2,1,0,1,1,0,0,'BASE'),
('Sand 3','DEFENSE','SAND',3,'WEAKEN','Reduce incoming damage next turn',0,0,3,1,0,1,1,0,0,'BASE'),
('Sand 4','DEFENSE','SAND',4,'WEAKEN','Reduce incoming damage next turn',0,0,4,1,0,1,2,0,0,'BASE'),
('Sand 5','DEFENSE','SAND',5,'WEAKEN','Reduce incoming damage next turn',0,0,5,1,0,2,2,0,0,'BASE'),
('Sand 6','DEFENSE','SAND',6,'WEAKEN','Reduce incoming damage next turn',0,0,6,1,0,2,2,0,0,'BASE'),
('Sand 7','DEFENSE','SAND',7,'WEAKEN','Reduce incoming damage next turn',0,0,7,1,0,2,3,0,0,'BASE'),
('Sand 8','DEFENSE','SAND',8,'WEAKEN','Reduce incoming damage next turn',0,0,8,1,0,3,3,0,0,'BASE'),
('Sand 9','DEFENSE','SAND',9,'WEAKEN','Reduce incoming damage next turn',0,0,9,1,0,3,3,0,0,'BASE'),

-- =========================
-- FIRE SPECIAL
-- =========================
('Burn Strike','ATTACK','FIRE',6,'BURN','Damage + burn for 2 turns',6,0,2,2,0,2,2,2,0,'EFFECT'),
('Half Break','ATTACK','FIRE',5,'BLOCK_FIRE','Half damage, block enemy fire for 1 turn',3,0,1,1,0,2,2,2,0,'EFFECT'),
('Rage Boost','ATTACK','FIRE',7,'RAGE','Double damage if player HP is below 50%',7,0,100,1,0,2,3,3,0,'EFFECT'),
('Explosion','ATTACK','FIRE',NULL,'EXPLOSION','High damage but self-damage',12,0,3,0,0,3,3,3,1,'EFFECT'),
('Chain Fire','ATTACK','FIRE',6,'CHAIN','Boost next fire attack',6,0,3,1,0,2,2,2,0,'EFFECT'),

-- =========================
-- WATER SPECIAL
-- =========================
('Healing Wave','DEFENSE','WATER',5,'HEAL','Convert part of shield into HP',0,5,25,0,0,2,2,2,0,'EFFECT'),
('Shield Surge','DEFENSE','WATER',6,'DOUBLE_SHIELD','Double current shield gain',0,12,100,0,0,2,2,2,0,'EFFECT'),
('Cleanse','STATUS','WATER',NULL,'CLEANSE','Remove negative effects',0,0,1,0,0,2,2,2,0,'EFFECT'),
('Reflect','DEFENSE','WATER',5,'REFLECT','Return part of damage received',0,0,25,1,0,2,2,2,0,'EFFECT'),
('Flow State','STATUS','WATER',NULL,'ENERGY_BOOST','Increase energy gain',0,0,20,2,0,2,2,2,0,'EFFECT'),

-- =========================
-- SWAMP SPECIAL
-- =========================
('Toxic Spread','STATUS','SWAMP',5,'TOXIC','Apply poison damage over 3 turns',0,0,5,3,0,2,2,2,0,'EFFECT'),
('Decay','STATUS','SWAMP',NULL,'DECAY','Reduce enemy shield progressively',0,0,5,2,0,2,2,2,0,'EFFECT'),
('Infection','STATUS','SWAMP',NULL,'EXTEND','Extend active effects by 1 turn',0,0,1,1,0,2,2,2,0,'EFFECT'),
('Corrosion','STATUS','SWAMP',NULL,'WEAKEN_ATTACK','Reduce enemy card damage',0,0,20,2,0,2,2,2,0,'EFFECT'),
('Leech','ATTACK','SWAMP',4,'LIFESTEAL','Recover HP from part of damage dealt',4,0,15,0,0,2,2,2,0,'EFFECT'),

-- =========================
-- SAND SPECIAL
-- =========================
('Quicksand','STATUS','SAND',NULL,'BLOCK_NUMBER','Block a specific number',0,0,1,1,0,2,2,2,0,'EFFECT'),
('Dust Blind','STATUS','SAND',NULL,'BLIND','Hide enemy base card values',0,0,1,1,0,2,2,2,0,'EFFECT'),
('Barrier','DEFENSE','SAND',5,'SHIELD_BOOST','Apply extra shield',0,20,20,0,0,2,2,2,0,'EFFECT'),
('Skywalker','SPECIAL','SAND',NULL,'WILDCARD','Wildcard exclusive to sand',0,0,1,0,0,2,2,2,0,'EFFECT'),
('Sandstorm','STATUS','SAND',NULL,'BUFF','Increase sand damage for 3 turns',0,0,7,3,0,2,2,2,0,'EFFECT'),

-- =========================
-- ICE
-- =========================
('Ice Stun','SPECIAL','ICE',NULL,'STUN','Freeze enemy for 1 turn',0,0,1,1,0,3,3,3,0,'RARE'),
('Ice Jam','SPECIAL','ICE',NULL,'JAM','Disable effect cards for 1 turn',0,0,1,1,0,3,3,3,0,'RARE'),
('Ice Overdrive','SPECIAL','ICE',NULL,'DOUBLE_PLAY','Allow 2 cards in 1 turn',0,0,1,1,0,3,3,3,0,'RARE'),
('Ice Shift','SPECIAL','ICE',NULL,'WILDCARD','Match element or number',0,0,1,0,0,3,3,3,0,'RARE'),
('Ice Flood','SPECIAL','ICE',NULL,'FORCE_DRAW','Force enemy to draw until finding chosen element',0,0,1,0,0,3,3,3,0,'RARE'),

-- =========================
-- CLAN
-- =========================
('Crocodile','SPECIAL','SWAMP',NULL,'AMPLIFY','Copy current card and amplify effect',0,0,5,0,0,3,3,3,0,'CLAN'),
('Alligator','SPECIAL','WATER',NULL,'IMMUNITY','Convert incoming damage to shield for 1 turn',0,0,100,1,0,3,3,3,0,'CLAN'),
('Gavial','SPECIAL','SAND',NULL,'HAND_RESET','Redraw current hand',0,0,5,0,0,3,3,3,0,'CLAN'),
('Caiman','SPECIAL','SWAMP',NULL,'RANDOM_STATUS','Apply a random status effect',0,0,1,2,0,3,3,3,0,'CLAN'),
('Sarcosuchus','SPECIAL','FIRE',NULL,'EXECUTE','Reduce enemy to 1 HP and 1 shield',0,0,1,0,1,5,5,5,0,'CLAN');