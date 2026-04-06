# Florida Frenzy - Esquema de Datos (v1)

## Tablas Principales
- player
- character_game
- card_game
- enemy
- zone_game
- deck
- run
- battle

## Tablas Intermediarias
- player_character
- player_card
- deck_card

## Notas
- Separa el catálogo del jueog con el progreso del jugador.
- Tablas intermediarias con relaciones muchos a muchos.
- Las 'runs' y las 'battles' se guardan como el historial del gameplay.