/*
1. character_game
2. enemy
3. zoine_game
4. card_game
5. plater
6. tablas intermediarias
7. run
8. battle
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
