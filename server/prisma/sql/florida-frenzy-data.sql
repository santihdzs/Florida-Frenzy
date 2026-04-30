/*
1. character_game
2. enemy
3. zone_game
4. card_game
*/

INSERT INTO "CharacterGame" (
  "chName",
  "chDesc",
  "baseHp",
  "baseAttack",
  "baseDefense",
  "chUltimate",
  "chUltimateDesc",
  "isDefaultUnlocked"
)
VALUES
(
  'Christian',
  'El intrépido líder del equipo, con habilidades balanceadas y recuperación estable.',
  120,
  2,
  5,
  'Vertical Leap',
  'Recupera 55% de su vida actual y 30% de su escudo. Obtiene en su mano una carta válida basada en la carta en mesa.',
  TRUE
),
(
  'Gustav',
  'La barricada más leal del clan. Siempre listo para proteger con su mítico escudo.',
  135,
  1,
  15,
  'Head Crack',
  'Recupera 25% de su vida y 60% de su escudo. Se vuelve inmune a efectos durante 3 turnos.',
  TRUE
),
(
  'Gavin',
  'El estratega, la máquina más confiable. De los cocodrilos más inteligentes del pantano.',
  115,
  2,
  8,
  'Testing',
  'Recupera 30% de su vida y 30% de su escudo. Durante los siguientes 2 turnos, el daño recibido de cartas enemigas se reduce en 50%.',
  TRUE
),
(
  'Eddy',
  'El rápido y pretencioso caimán. Ni quien lo detenga.',
  100,
  4,
  4,
  'Swamp Trait',
  'Recupera 75% de su vida actual, pero pierde 35% de su escudo. Durante los siguientes 2 turnos, el daño de sus cartas se duplica.',
  TRUE
);

INSERT INTO "Enemy" (
  "enemyName",
  "enemyDesc",
  "enemyType",
  "faction",
  "enemyBaseHp",
  "aiLevel",
  "enemyUltimate",
  "enemyUltimateDesc"
) VALUES

-- PLATFORMER
('Rat Scout', 'Rápidos pero débiles', 'PLATFORMER_ENEMY', 'RAT', 40, 'EASY', NULL, NULL),
('Raccoon Raider', 'Roaming balanceado', 'PLATFORMER_ENEMY', 'RACCOON', 60, 'MEDIUM', NULL, NULL),
('Bear Brute', 'Tanques lentos pero peligrosos', 'PLATFORMER_ENEMY', 'BEAR', 100, 'HARD', NULL, NULL),

-- BOSSES
('Skawl', 'Pequeño, astuto y peligroso.', 'CARD_ENEMY', 'RAT', 150, 'EASY', 'Double Rat', 'Duplica el daño de sus cartas base por 2 turnos, gana 10 de vida y 5 de escudo'),
('Rabyz', 'Inteligente y egoísta.', 'CARD_ENEMY', 'RACCOON', 175, 'EASY', 'Nasty Corrosion', 'Aplica veneno al jugador por 3 turnos y vacía su EE y EI, gana 30 de vida'),
('Boldear', 'Formidable y resistente.', 'CARD_ENEMY', 'BEAR', 275, 'MEDIUM', 'Crushing Control', 'Elimina el escudo del jugador, lo aturde 1 turno, gana 25 de escudo y 10 de vida'),
('Pythra', 'Boss principal formidable e impredecible.', 'FINAL_BOSS', 'PYTHON', 350, 'HARD', 'Frozen Dominion', 'Usa cartas legendarias y puede replicar ultis de otros bosses');


INSERT INTO "ZoneGame" (
  "zoneName",
  "zoneMap",
  "zoneDesc",
  "zoneDifficulty"
)
VALUES
(
  'Swamp',
  'map_swamp',
  'El hogar del clan',
  'MEDIUM'
),
(
  'Garbage Dump',
  'map_garbage',
  'Basurero caótico',
  'MEDIUM'
),
(
  'Suburbs',
  'map_suburbs',
  'Una calle peligrosa',
  'HARD'
),
(
  'Sewers',
  'map_sewers',
  'Zona final en el desagüe',
  'HARD'
);


INSERT INTO "CardGame" (
  "cardName",
  "cardCategory",
  "cardElement",
  "cardNumber",
  "cardEffect",
  "effectDesc",
  "baseDamage",
  "shieldValue",
  "effectValue",
  "effectDuration",
  "effectValueSecondary",
  "energyEGain",
  "energyIGain",
  "energyECost",
  "energyICost",
  "cardRarity"
) VALUES

-- =========================
-- FIRE BASE
-- =========================
('Fire Card 1','ATTACK','FIRE',1,'DAMAGE','Haz 2 de daño al enemigo.',2,0,2,0,0,2,2,1,0,'BASE'),
('Fire Card 2','ATTACK','FIRE',2,'DAMAGE','Haz 4 de daño al enemigo.',4,0,4,0,0,2,2,1,0,'BASE'),
('Fire Card 3','ATTACK','FIRE',3,'DAMAGE','Haz 6 de daño al enemigo.',6,0,6,0,0,2,2,1,0,'BASE'),
('Fire Card 4','ATTACK','FIRE',4,'DAMAGE','Haz 8 de daño al enemigo.',8,0,8,0,0,2,2,1,0,'BASE'),
('Fire Card 5','ATTACK','FIRE',5,'DAMAGE','Haz 10 de daño al enemigo.',10,0,10,0,0,3,3,2,0,'BASE'),
('Fire Card 6','ATTACK','FIRE',6,'DAMAGE','Haz 12 de daño al enemigo.',12,0,12,0,0,3,3,2,0,'BASE'),
('Fire Card 7','ATTACK','FIRE',7,'DAMAGE','Haz 14 de daño al enemigo.',14,0,14,0,0,3,3,2,0,'BASE'),
('Fire Card 8','ATTACK','FIRE',8,'DAMAGE','Haz 16 de daño al enemigo.',16,0,16,0,0,4,4,3,0,'BASE'),
('Fire Card 9','ATTACK','FIRE',9,'DAMAGE','Haz 18 de daño al enemigo.',18,0,18,0,0,4,4,3,0,'BASE'),

-- =========================
-- WATER BASE
-- =========================
('Water Card 1','DEFENSE','WATER',1,'SHIELD','Gana 2 puntos de escudo.',0,2,2,0,0,2,2,1,0,'BASE'),
('Water Card 2','DEFENSE','WATER',2,'SHIELD','Gana 4 puntos de escudo.',0,4,4,0,0,2,2,1,0,'BASE'),
('Water Card 3','DEFENSE','WATER',3,'SHIELD','Gana 6 puntos de escudo.',0,6,6,0,0,2,2,1,0,'BASE'),
('Water Card 4','DEFENSE','WATER',4,'SHIELD','Gana 8 puntos de escudo.',0,8,8,0,0,2,2,1,0,'BASE'),
('Water Card 5','DEFENSE','WATER',5,'SHIELD','Gana 10 puntos de escudo.',0,10,10,0,0,3,3,2,0,'BASE'),
('Water Card 6','DEFENSE','WATER',6,'SHIELD','Gana 12 puntos de escudo.',0,12,12,0,0,3,3,2,0,'BASE'),
('Water Card 7','DEFENSE','WATER',7,'SHIELD','Gana 14 puntos de escudo.',0,14,14,0,0,3,3,2,0,'BASE'),
('Water Card 8','DEFENSE','WATER',8,'SHIELD','Gana 16 puntos de escudo.',0,16,16,0,0,4,4,3,0,'BASE'),
('Water Card 9','DEFENSE','WATER',9,'SHIELD','Gana 18 puntos de escudo.',0,18,18,0,0,4,4,3,0,'BASE'),

-- =========================
-- SWAMP BASE
-- =========================
('Swamp Card 1','STATUS','SWAMP',1,'POISON','Envenena al enemigo por 2 de daño durante 1 turnos.',0,0,2,1,0,2,2,1,0,'BASE'),
('Swamp Card 2','STATUS','SWAMP',2,'POISON','Envenena al enemigo por 2 de daño durante 1 turnos.',0,0,2,1,0,2,2,1,0,'BASE'),
('Swamp Card 3','STATUS','SWAMP',3,'POISON','Envenena al enemigo por 2 de daño durante 1 turnos.',0,0,2,1,0,2,2,1,0,'BASE'),
('Swamp Card 4','STATUS','SWAMP',4,'POISON','Envenena al enemigo por 2 de daño durante 1 turnos.',0,0,2,1,0,2,2,1,0,'BASE'),
('Swamp Card 5','STATUS','SWAMP',5,'POISON','Envenena al enemigo por 2 de daño durante 1 turnos.',0,0,2,1,0,3,3,2,0,'BASE'),
('Swamp Card 6','STATUS','SWAMP',6,'POISON','Envenena al enemigo por 3 de daño durante 2 turnos.',0,0,3,2,0,3,3,2,0,'BASE'),
('Swamp Card 7','STATUS','SWAMP',7,'POISON','Envenena al enemigo por 3 de daño durante 2 turnos.',0,0,3,2,0,3,3,2,0,'BASE'),
('Swamp Card 8','STATUS','SWAMP',8,'POISON','Envenena al enemigo por 4 de daño durante 2 turnos.',0,0,4,2,0,4,4,3,0,'BASE'),
('Swamp Card 9','STATUS','SWAMP',9,'POISON','Envenena al enemigo por 4 de daño durante 3 turnos.',0,0,4,3,0,4,4,3,0,'BASE'),

-- =========================
-- SAND BASE
-- =========================
('Sand Card 1','DEFENSE','SAND',1,'WEAKEN','Haz 1 de daño y reduce el daño del enemigo por 2 para el siguiente turno.',1,0,2,1,0,2,2,1,0,'BASE'),
('Sand Card 2','DEFENSE','SAND',2,'WEAKEN','Haz 2 de daño y reduce el daño del enemigo por 4 para el siguiente turno.',2,0,4,1,0,2,2,1,0,'BASE'),
('Sand Card 3','DEFENSE','SAND',3,'WEAKEN','Haz 3 de daño y reduce el daño del enemigo por 6 para el siguiente turno.',3,0,6,1,0,2,2,1,0,'BASE'),
('Sand Card 4','DEFENSE','SAND',4,'WEAKEN','Haz 4 de daño y reduce el daño del enemigo por 8 para el siguiente turno.',4,0,8,1,0,2,2,1,0,'BASE'),
('Sand Card 5','DEFENSE','SAND',5,'WEAKEN','Haz 5 de daño y reduce el daño del enemigo por 10 para el siguiente turno.',5,0,10,1,0,3,3,2,0,'BASE'),
('Sand Card 6','DEFENSE','SAND',6,'WEAKEN','Haz 6 de daño y reduce el daño del enemigo por 12 para el siguiente turno.',6,0,12,1,0,3,3,2,0,'BASE'),
('Sand Card 7','DEFENSE','SAND',7,'WEAKEN','Haz 7 de daño y reduce el daño del enemigo por 14 para el siguiente turno.',7,0,14,1,0,3,3,2,0,'BASE'),
('Sand Card 8','DEFENSE','SAND',8,'WEAKEN','Haz 8 de daño y reduce el daño del enemigo por 16 para el siguiente turno.',8,0,16,1,0,4,4,3,0,'BASE'),
('Sand Card 9','DEFENSE','SAND',9,'WEAKEN','Haz 9 de daño y reduce el daño del enemigo por 18 para el siguiente turno.',9,0,18,1,0,4,4,3,0,'BASE'),

-- =========================
-- FIRE SPECIAL
-- =========================
('Burn Strike','ATTACK','FIRE',6,'BURN','12 daño + 4 burn por 2 turnos',12,0,4,2,0,4,2,1,1,'EFFECT'),
('Half Break','ATTACK','FIRE',5,'BLOCK_FIRE','10 daño. Bloquea cartas Fire por 1 turno',10,0,1,1,0,2,2,2,1,'EFFECT'),
('Rage Boost','ATTACK','FIRE',7,'RAGE','20 daño si el rival está bajo 50% HP',10,0,100,1,0,3,3,2,2,'EFFECT'),
('Explosion','ATTACK','FIRE',NULL,'EXPLOSION','24 daño. Recibes 6 de recoil',24,0,6,0,0,3,3,3,1,'EFFECT'),
('Chain Fire','ATTACK','FIRE',6,'CHAIN','12 daño. Tu próximo Fire gana +6 daño',12,0,6,1,0,4,2,0,1,'EFFECT'),

-- =========================
-- WATER SPECIAL
-- =========================
('Healing Wave','DEFENSE','WATER',5,'HEAL','10 escudo y cura 6 HP',0,10,6,0,0,4,4,2,2,'EFFECT'),
('Shield Surge','DEFENSE','WATER',6,'DOUBLE_SHIELD','Duplica tu escudo. Si no tienes, ganas 24',0,24,100,0,0,2,2,1,1,'EFFECT'),
('Cleanse','STATUS','WATER',NULL,'CLEANSE','Limpia todos tus efectos negativos activos',0,0,1,0,0,3,3,2,2,'EFFECT'),
('Reflect','DEFENSE','WATER',5,'REFLECT','Refleja 35% del daño por 1 turno',0,0,35,1,0,5,3,2,2,'EFFECT'),
('Flow State','STATUS','WATER',NULL,'ENERGY_BOOST','+30% energía por 2 turnos',0,0,30,2,0,2,2,1,1,'EFFECT'),

-- =========================
-- SWAMP SPECIAL
-- =========================
('Toxic Spread','STATUS','SWAMP',5,'TOXIC','10 poison por 3 turnos',0,0,10,3,0,3,2,2,1,'EFFECT'),
('Decay','STATUS','SWAMP',NULL,'DECAY','Reduce el escudo rival en 10%',0,0,10,2,0,2,3,1,2,'EFFECT'),
('Infection','STATUS','SWAMP',NULL,'EXTEND','Extiende 1 turno los efectos del rival',0,0,1,1,0,3,3,1,2,'EFFECT'),
('Corrosion','STATUS','SWAMP',NULL,'WEAKEN_ATTACK','Reduce por 6 el daño rival por 2 turnos',0,0,6,2,0,6,6,2,2,'EFFECT'),
('Leech','ATTACK','SWAMP',4,'LIFESTEAL','10 daño. Roba 25% del daño como vida',10,0,25,0,0,5,2,2,1,'EFFECT'),

-- =========================
-- SAND SPECIAL
-- =========================
('Quicksand','STATUS','SAND',NULL,'HALVE_ATTACK','Reduce el próximo ataque rival a la mitad',0,0,50,1,0,2,2,0,1,'EFFECT'),
('Dust Blind','STATUS','SAND',NULL,'NEGATE_SAND','Nega el próximo Sand rival. Si no aplica, ganas 20 escudo',0,20,1,1,0,4,3,2,2,'EFFECT'),
('Barrier','DEFENSE','SAND',5,'BARRIER_REACTIVE','Gana 20 escudo. Si el rival juega Swamp Special, ganas 20 más',0,20,20,1,0,6,5,2,1,'EFFECT'),
('Skywalker','SPECIAL','SAND',NULL,'WILDCARD','Comodín Sand contra cualquier Special',0,0,1,0,0,2,1,1,0,'EFFECT'),
('Sandstorm','STATUS','SAND',NULL,'BUFF','Tus cartas Sand ganan +20% daño por 3 turnos',0,0,20,3,0,4,2,2,1,'EFFECT'),

-- =========================
-- ICE RARE
-- =========================
('Ice Stun','SPECIAL','ICE',NULL,'STUN','Congela al rival por 1 turno',0,0,1,1,0,0,0,6,6,'RARE'),
('Ice Jam','SPECIAL','ICE',NULL,'JAM','Bloquea las especiales rivales por 2 turnos',0,0,1,2,0,0,0,8,6,'RARE'),
('Ice Overdrive','SPECIAL','ICE',NULL,'DOUBLE_PLAY','Puedes jugar 2 cartas este turno',0,0,1,1,0,0,0,8,8,'RARE'),
('Ice Shift','SPECIAL','ICE',NULL,'HAND_RESET','La mano rival va a discard. Roba una nueva desde la discard pile',0,0,1,0,0,0,0,10,8,'RARE'),
('Ice Flood','SPECIAL','ICE',NULL,'AMPLIFY','Si la carta en mesa es base, copia su número y fuerza respuesta solo por ese número. Si la carta en mesa es especial, gana 25 HP y 25 escudo y el rival puede responder con cualquier carta',0,25,25,0,25,0,0,8,8,'RARE'),

-- =========================
-- LEGENDARY
-- =========================
('Crocodile','SPECIAL','SWAMP',NULL,'AMPLIFY','Remueve el 35% de la vida del oponente',0,0,35,0,0,0,0,15,15,'LEGENDARY'),
('Alligator','SPECIAL','WATER',NULL,'IMMUNITY','Recupera el 100% de su vida',0,0,100,1,0,0,0,16,18,'LEGENDARY'),
('Gavial','SPECIAL','SAND',NULL,'HAND_RESET','Carga la Ulti del jugador instantáneamente',0,0,5,0,0,0,0,17,14,'LEGENDARY'),
('Caiman','SPECIAL','SWAMP',NULL,'RANDOM_STATUS','Aplica un estado aleatorio al enemigo',0,0,1,2,0,0,0,13,16,'LEGENDARY'),
('Sarcosuchus','SPECIAL','FIRE',NULL,'EXECUTE','Reduce al enemigo a 25 HP y 25 escudo',0,0,1,0,1,0,0,20,18,'LEGENDARY');