# ![Florida Frenzy Header](../client/src/assets/logos/logo.png)

## _Game Design Document_
![Tec de Monterrey](tecnologico-de-monterrey-blue.png)

### **Propuesta completa del juego FLORIDA FRENZY**
#### ***Equipo 7***:
- Yael Ordaz – A01786776
- J. Manuel Montero - A01660761
- Santiago Hernández – A01787550

---
##
## _Index_

1. [Index](#index)
2. [Game Design](#game-design)
    1. [Summary](#summary)
    2. [Gameplay](#gameplay)
    3. [Mindset](#mindset)
3. [Technical](#technical)
    1. [Screens](#screens)
    2. [Controls](#controls)
    3. [Mechanics](#mechanics)
4. [Level Design](#level-design)
    1. [Themes](#themes)
        1. Ambience
        2. Objects
            1. Ambient
            2. Interactive
        3. Challenges
    2. [Game Flow](#game-flow)
5. [Development](#development)
    1. [Abstract Classes](#abstract-classes--components)
    2. [Derived Classes](#derived-classes--component-compositions)
6. [Graphics](#graphics)
    1. [Style Attributes](#style-attributes)
    2. [Graphics Needed](#graphics-needed)
7. [Sounds/Music](#soundsmusic)
    1. [Style Attributes](#style-attributes-1)
    2. [Sounds Needed](#sounds-needed)
    3. [Music Needed](#music-needed)
8. [Schedule](#schedule)

---

## _Game Design_

---

### **Summary**

![CharacterFrameBackground](../client/src/assets/sprites/CharacterShowcase.png)

Florida Frenzy es un juego roguelite en 2D, que involucra mecánicas de un TCG y un 'platformer game'. Asumes el rol de alguno de los miembros del Crock Clan, y te enfrentas contra las amenazas del pantano de Florida. Colecciona cartas, gana experiencia, participa en duelos que incrementarán en dificultad conforme progreses en el juego. Este también resulta más entretenido, debido a cómo integra mecánicas 'familiares' al jugador, creando una experiencia dinámica. Combinando elementos del juego "UNO", atributos del juego clásico de cartas Pokémon, y el disfrute de una jugabilidad rápida por parte de su 'platformer'. Consistiendo en 'runs' cortas, pero intensas, que generan un juego dinámico y divertido. El elemento diferenciador del juego radica en la integración de dos sistemas paralelos. Por su parte el combate basado en coincidencia de cartas por elemento o número. Así como un sistema dual de energía (Energía Elemental e Instinto) que introduce decisiones tácticas adicionales más allá de simplemente “hacer match”.

### **Gameplay**

El objetivo principal es sobrevivir a una serie de &quot;runs&quot; (partidas reiniciables) en las cuales avanzarás a través de niveles en un mapa 2D. Cada 'run' dependerá de tu agilidad para superar los obstáculos presentes durante el platformer, así como de el nivel de dificultad que implique el duelo de cartas que se te presente durante tu trayectoria.

Con un aproximado de 3 niveles/mapas dentro del pantano (mas un breve tutorial), el jugador podrá disfrutar del juego y su versatilidad. Encontrandose con la parte 'platformer' del juego, donde el jugador evade enemigos de menor dificultad. Debido a que los mapas serán diseñados para generar ciertos elementos de manera distinta, y por consecuencia, aleatoria. Cada run principal se estructura en zonas consecutivas que combinan exploración, combate, recompensa y enfrentamientos contra jefes
- 3 enfrentamientos contra bosses de zona
- 1 enfrentamiento final contra el boss principal

Las recompensas dentro del juego se dividen en dos tipos:

- **Recompensas de combate (garantizadas)**:
  Se obtienen al ganar un duelo. El jugador puede elegir entre varias opciones que afectan su estado o su deck.

- **Recompensas de exploración (opcionales)**:
  Se encuentran durante el platformer y pueden incluir cartas raras, mejoras temporales o curación.

Esto permite al jugador decidir entre avanzar rápidamente o explorar en busca de ventajas adicionales.

El jugador se enfrentará a diversas facciones enemigas (mapaches, ratas y osos), así como a los jefes de zona, los cuales deben de ser derrotados para validar el exito de la run en curso. Cada tipo de enemigo obliga a adaptar estrategia de cartas. Al entrar en contacto con un enemigo de duelo (o boss, para simplificar), iniciará el duelo de cartas. Dependerá de la destreza y la construcción del mazo (deck) del jugador, con tal de que este resulte ganador contra alguno de los rivales que se encontrará en su camino. 

Conforme el jugador progrese, la dificultad escalará, y sus oponentes aplicarán jugadas más complicadas. De igual manera, tendrá acceso a objetos desbloqueables, de acuerdo a su progreso mismo. Siendo que sus victorias le darán acceso a un pequeño catálogo de opciones para mejorar sus estadísticas, o su propio mazo. 

La primera vez que el jugador inicia el juego, accede a una run introductoria (tutorial), guiada por Klancy. Tras completarla, las runs siguientes utilizan el nivel de dificultad estándar/alto.

Cuando pierde un combate, el jugador es regresado al primer nivel. Dada la naturaleza Roguelite del juego, conservará su progreso "global" mediante su experiencia adquirida (Swamp XP). Con la cual podrá mejorar su 'Clan Rank'; lo que le dará acceso a los desbloqueables. Como la carta estrella, "Hielo".

El sistema de combate se basa en un modelo híbrido entre mecánicas tipo UNO y construcción de mazo (deckbuilding). El jugador construye un deck antes de cada run y, durante los duelos, utiliza una mano limitada de cartas que se renueva progresivamente mediante robo. Las jugadas se basan en la coincidencia de atributos (elemento o valor numérico), mientras que la gestión de recursos como Energía Elemental e Instinto permite ejecutar estrategias más complejas. El detalle completo del sistema de cartas, reglas de jugada y funcionamiento del deck se encuentra en la sección de **Mechanics**.

También existen dos recursos:

- **Energía Elemental**: se genera al jugar cartas del mismo elemento consecutivamente. Se utiliza para activar habilidades especiales.
- **Energía Instinto**: se genera dependiendo del valor numérico de la carta jugada. Permite recargar habilidades únicas del personaje.

Ambos recursos tienen un límite máximo y se reinician al finalizar un combate.

---

Al finalizar una run, ya sea por victoria o derrota, el jugador obtiene la ya mencionada **Swamp XP**. Este recurso permite progresar dentro del sistema de rango del clan (**Clan Rank**), el cual define el acceso a nuevas mecánicas y contenido.

#### **Clan Rank System**

El progreso del jugador se organiza en niveles de Clan Rank, representando su experiencia acumulada en el juego.

Cada nivel desbloquea nuevas opciones estratégicas y amplía la complejidad del sistema:

- **Rookie (Nivel 1)**  
  Acceso al set base de cartas.  
  Sin cartas con efecto ni elementos avanzados.  
  Enfocado en aprendizaje del sistema.

- **Fighter (Nivel 2)**  
  Desbloqueo de cartas con efecto.  
  Acceso al elemento Hielo.  
  Introducción a mecánicas avanzadas y control del combate.

- **Veteran (Nivel 3)**  
  Acceso al rango completo de cartas desbloqueables y a las recompensas más avanzadas del sistema.
  Mejores recompensas al finalizar duelos.
  Obtiene un bono pasivo de vida inicial en cada nueva run (por ejemplo, +10% a la vida base).  
  Mayor optimización en la construcción de deck.

Las cartas de Clan o Especie no se desbloquean mediante Clan Rank, sino que se obtienen como recompensas raras durante la exploración en el modo platformer.

El avance entre niveles requiere cantidades crecientes de Swamp XP.

Es importante distinguir entre progreso temporal y permanente:

- **Se conserva entre runs**:
  - Swamp XP
  - Clan Rank
  - Cartas desbloqueadas
  - Personajes desbloqueados

- **No se conserva entre runs**:
  - Vida y escudo
  - Mano actual
  - Cartas obtenidas durante la run
  - Mejoras temporales

Esto refuerza la naturaleza roguelite del juego, donde cada run representa un nuevo intento con ventajas acumuladas previamente.


### **Mindset**

El objetivo es mezclar un la jugabilidad "nostálgica" con los elementos 'punk' y caricaturescos de los personajes. Provocando una sensación de estrategia caótica, con identidad punk-industrial del pantano. El jugador debe sentirse como un miembro mas del clan que improvisa constantemente. La experiencia está diseñada bajo la idea de que sea fácil de entender, pero difícil de dominar.

El caos visual contrasta con la claridad de información de la interfaz, fomentando análisis crítico y lógico en medio de la tensión.

## _Technical_

---

### **Screens**
1. Title Screen
Contiene el logo del juego, una imagen del pantano en el fondo, y las siguientes opciones (en descendente):
    - Start
    - Multiplayer (Placeholder - puede no ser implementado)
    - Store
    - Settings
    1. Options (dentro de Settings)
        - Modular el volúmen (música, efectos, y general/ambos)
        - Ajuste de pantalla (tickbox); se adapta al browser del jugador
2. Level Select
    - No habría en este caso, dado que las 'runs' son continuas.
3. Game
    - Modo Exploración
        Movimiento lateral, con elementos clásicos de un 'platformer'; el jugador se desplaza por el mapa enfrentando enemigos con mecánicas de ataque sencillas, hasta entrar en contacto con un boss que inicia un duelo de cartas.
    - Duelo de Cartas
        Muestra el tablero, el mazo con las cartas del jugador, así como las estadísticas de este mismo y las de su oponente.
        1. Inventory:
        Permite revisar el deck actual del jugador, incluyendo las cartas seleccionadas antes de la run, así como modificaciones temporales obtenidas durante la partida, estadísticas y mejoras activas.
        2. Assesment / Next Level: 
        El jugador es felicitado por su victoria y se le presentan varias opciones de recompensa. Entre ellas:

            - Obtener una nueva carta con efecto
            - Mejorar su estado actual (vida o defensa)
            - Remover una carta no deseada del deck

        El jugador deberá seleccionar una opción, afectando directamente su estrategia durante la run.
4. End Credits
    - Una vez el boss final es derrotado (Pythra), el jugador será felicitado por Klancy, quien le enseñó al jugador cómo jugar desde un inicio. Finalmente rompe la cuarta pared, y muestra los nombres de los creadores del juego.


### **Controls**

El juego requerirá del uso de teclado y mouse para ambos modos (principalmente para la exploración).

**Controles de Movimiento**
1. W & Space Bar <-- Saltar
2. D <-- Mover Derecha
3. A <-- Mover Izquierda
4. E <-- Interactuar
5. I <-- Acceso al inventario (abrir y cerrar)
6. ESC <-- Pausa
7. Mouse Movement <-- Apuntar (Exploración) e interactuar con el tablero de cartas
8. Click Izquierdo <-- Disparar (Exploración) y seleccionar/jugar una carta (doble click para confirmar una selección)
9. Click Derecho <-- Descartar una carta

### **Mechanics**

---

#### **Platformer System**

Nuevamente, durante la fase de exploración, el jugador interactúa con un entorno 2D tipo platformer, el cual sirve como transición entre combates y como fuente de presión mecánica.

##### **Level Generation**

Los niveles se generan de forma semi-aleatoria a partir de segmentos predefinidos. Cada zona mantiene su identidad visual y temática, pero la disposición de plataformas, obstáculos y enemigos puede variar entre runs.

Esto permite:

- Rejugabilidad
- Variación en rutas
- Diferentes niveles de riesgo y recompensa

Cada mapa se construye a partir de segmentos predefinidos, de modo que:

- La temática visual de la zona se conserva
- La disposición de plataformas cambia entre runs
- Cambian algunos obstáculos, rutas y enemigos menores
- Hay una conexión evidente con el terreno explorado, y aquel que aparece de fondo en el duelo de cartas del nivel

##### **Player Movement & Combat**

El jugador cuenta con las siguientes capacidades:

- Movimiento lateral (izquierda / derecha)
- Salto (Doble)
- Interacción con objetos
- Ataque básico cuerpo a cuerpo (melee)
- Ataque a distancia (disparo)

El combate dentro del platformer no es el foco principal, pero introduce presión constante. Su objetivo es desgastar al jugador antes de los duelos de cartas.


##### **Minor Enemies**

Durante la exploración, el jugador se enfrenta a enemigos menores que actúan como obstáculos activos:

- **Ratas**: rápidas, aparecen en grupo, obligan a reaccionar rápidamente.
- **Mapaches**: comportamiento intermedio, pueden bloquear rutas y perseguir al jugador brevemente.
- **Osos**: lentos pero resistentes, ocupan más espacio y controlan zonas.

Estos enemigos no representan el desafío principal, pero afectan el estado del jugador antes de los combates.

##### **Obstacles & Objects**

El entorno incluye diferentes elementos que afectan la navegación:

- Plataformas móviles
- Superficies resbalosas o ralentizantes (pantano)
- Basura acumulada que bloquea rutas
- Vehículos destruidos como obstáculos
- Tuberías y estructuras verticales

Además, pueden aparecer:

- Cofres o recompensas (tentativo)
- Cartas raras o de Clan ocultas

##### **Exploration Rewards**

Durante la exploración, el jugador puede encontrar recompensas adicionales:

- Cartas de Clan o Especie (raras)
- Mejoras temporales
- Curación parcial

Las cartas de Clan o Especie tienen una probabilidad de aparición baja, convirtiéndolas en recompensas raras que incentivan la exploración.

---

El duelo de cartas consiste en diferentes reglas y atributos que definen el flujo del enfrentamiento. Ya que esta directamente inspirado en el juego 'UNO', las mecánicas se asemejan a las de este juego de mesa. Con algunos elementos innovadores y estratégicos, que hacen de una jugada algo más entretenido.

El combate con cartas se desarrolla por turnos alternados entre el jugador y el enemigo en cuestión. Durante un turno, cada participante puede jugar una carta válida desde su mano, o realizar una acción alternativa (como descartar una carta).

#### **Valid Plays**

Una carta se considera válida si coincide con la carta en mesa en al menos uno de estos dos atributos:

- Elemento
- Valor numérico

**Ejemplo 1:**  
Carta en mesa: Fuego 5  
Carta del jugador: Fuego 8  
Resultado: válida por coincidencia de elemento.

**Ejemplo 2:**  
Carta en mesa: Arena 4  
Carta del jugador: Agua 4  
Resultado: válida por coincidencia de número.

**Ejemplo 3:**  
Carta en mesa: Pantano 7  
Carta del jugador: Fuego 3  
Resultado: inválida.

**Ejemplo 4:**
Carta en mesa: Agua 4
Carta del jugador: Hielo (Ice Overdrive)
Resultado: válida, al ser un comodin, el jugador puede utilizar esta carta legalmente

#### **No Valid Move Rule**

Si un jugador no tiene una carta válida, roba 1 carta adicional desde su deck.

Si después de robar sigue sin poder jugar, recibe daño leve por exposición.

Esto obliga al jugador a decidir entre perder recursos o perder vida.


#### **Card Structure**

Cada carta contiene:

- Elemento
- Valor numérico
- Tipo
- Efecto (si aplica)
- Rareza
- Costo de energía (si aplica)

#### **Element Types**

Las cartas del juego se dividen en cuatro elementos principales:

- **Fuego**: daño directo basado en el valor numérico de la carta, con posibles efectos de quemadura.

![Fire](../client/src/assets/sprites/CardFire.png)

- **Arena**: daño moderado y control del oponente, incluyendo reducción de daño y bloqueo de jugadas.

![Sand](../client/src/assets/sprites/CardSand.png)

- **Pantano**: enfoque en desgaste, aplicando veneno y efectos progresivos.

![Swamp](../client/src/assets/sprites/CardSwamp.png)

- **Agua**: defensa, mitigación de daño y recuperación parcial.

![Water](../client/src/assets/sprites/CardWater.png)

- **Hielo**: elemento especial y raro. Funciona como comodín y permite efectos avanzados como congelamiento, bloqueo de habilidades, manipulación de turnos y jugadas múltiples.

![IceFront](../client/src/assets/sprites/CardIceFront.png)


#### **Card Categories**

Las cartas se clasifican según su función dentro del combate:

- **Ataque**: infligen daño directo al oponente.
- **Defensa**: generan escudo o reducen daño recibido.
- **Estado**: aplican efectos como veneno, quemadura o control.
- **Especial**: modifican reglas del turno o del sistema de juego.

Las **cartas básicas** dependen principalmente de su valor numérico y elemento para determinar su efecto.

Las **cartas con efecto** introducen mecánicas adicionales como estados, control del turno, modificación de daño o alteración de reglas, y generalmente requieren consumo de energía para ser utilizadas.

Esto genera una progresión natural desde jugadas simples, hasta estrategias más complejas.

#### **Deck System**

Antes de iniciar una run, el jugador construye un deck compuesto por un número limitado de cartas (12, máximo 16). Estas cartas provienen de las opciones desbloqueadas mediante progreso (Swamp XP y Clan Rank).

Durante el combate:

- El jugador roba una mano inicial de 5 cartas.
- Cada turno roba 1 carta adicional.
- Solo puede jugar cartas disponibles en su mano.
- Las cartas utilizadas pasan a una pila de descarte.
- Si el deck se agota, el descarte puede reciclarse.

Este sistema permite al jugador planear su estrategia antes de la run, mientras que mantiene incertidumbre durante el combate, al no tener acceso inmediato a todas sus cartas.

Las cartas del elemento Hielo son consideradas raras y poderosas. Por esta razón, su cantidad dentro de un deck es limitada.

Esto obliga al jugador a utilizarlas de manera estratégica y modera la cantidad de comodines activados.

La acción de "descartar" consiste en remover una carta de la mano del jugador sin activar su efecto, enviándola directamente a la pila de descarte.

Descartar permite al jugador gestionar su mano cuando no cuenta con jugadas favorables, sacrificando recursos a corto plazo para mejorar sus opciones futuras. 

Por ejemplo, si la mano del jugador contiene:

- Fuego 3
- Fuego 4
- Fuego 5
- Arena 2
- Pantano 1

Y la carta en la mesa es **Agua 7**, el jugador puede:

- **Robar**: con la posibilidad de obtener una carta útil.
- **Descartar**: eliminando una carta inútil para mejorar sus opciones futuras.


#### **Energy System**

Como fue mencionado, el juego utiliza un sistema dual de energía compuesto por dos recursos:

- **Energía Elemental (EE)**
- **Energía Instinto (EI)**

Ambas energías llenan una barra compartida dividida en dos mitades (50/50). La habilidad especial solo puede activarse cuando ambas mitades de la barra (EE y EI) están completamente llenas.

##### **Energy Generation**

- **Energía Elemental (EE)**:
  - Se genera al jugar cartas del mismo elemento consecutivamente.
  - Se utiliza para activar cartas con efecto y habilidades especiales.

- **Energía Instinto (EI)**:
  - Se genera en función del valor numérico de la carta jugada.
  - Se utiliza para potenciar cartas numéricas.

##### **Card Enhancement**

El jugador puede utilizar Energía Instinto para incrementar el valor de una carta:

- 10 → costo moderado de energía
- 11 → costo alto
- 12 → costo máximo

Esto permite transformar cartas básicas en jugadas más poderosas, a cambio de consumir recursos.

Ambos recursos se reinician al finalizar cada combate.

##### **Energy Cost**

El uso de Energía Instinto para potenciar cartas sigue una escala proporcional basada en la barra total disponible:

- Aumentar el valor de una carta de 9 a 10 consume aproximadamente 33% de la barra de Energía Instinto.
- Aumentar de 10 a 11 consume aproximadamente 66% acumulado.
- Aumentar de 11 a 12 consume el 100% de la barra.

Esto permite al jugador decidir entre múltiples mejoras moderadas o una sola jugada de alto impacto.

Las cartas con efecto consumen Energía Elemental dependiendo de su potencia, mientras que nuevamente las habilidades especiales (ultimates) requieren que la barra total (EE + EI) esté completamente llena.


#### **Initial Card Set Examples**

| Carta | Elemento | Número | Tipo | Efecto |
|------|----------|------:|------|--------|
| Splash Guard | Agua | 5 | Defensa | Reduce 7 de daño recibido este turno, inflige 2 de daño |
| Tidal Push | Agua | 6 | Ataque | Inflige 12 de daño |
| Venom Drip | Pantano | 2 | Estado | Aplica veneno por 2 turnos |
| Mire Trap | Pantano | 6 | Ataque | Inflige 6 de daño |
| Burn Bite | Fuego | 4 | Ataque y Estado | Inflige 4 de daño directo y aplica 2 de daño por quemadura |
| Wild Flare | Fuego | 11 | Especial | Inflige 11 de daño alto pero consume Energía Instinto (66%) |
| Quick Sand | Arena | 5 | Defensa y Estado | Reduce 50% de daño del siguiente ataque enemigo |
| Dust Jam | Arena | 8 | Ataque | Inflige 8 de daño |
| Ice Overdrive | Hielo | Null | Especial | Funciona como comodín de elemento |
| Ice Stun | Hielo | 2 | Estado | Congela al enemigo por 2 turnos |
| Ice Jam | Hielo | Null | Estado | El jugador en turno puede jugar 2 cartas por 2 turnos |

#### **Health and Shield System**

El jugador cuenta con dos recursos principales durante el combate:

- **Vida (HP)**: valor base de 100 puntos. Si llega a 0, el jugador pierde el duelo.
- **Escudo**: inicia en 0 y puede generarse mediante cartas, habilidades o recompensas.

El escudo absorbe el daño antes que la vida. Una vez agotado, el daño restante se aplica directamente a la vida.

El escudo no tiene un límite fijo, pero su acumulación depende del uso estratégico de cartas defensivas.

#### **Playable Clan Members**

Cada personaje comparte la base del sistema de cartas, pero cuenta con una habilidad especial (ultimate) que se activa al llenar completamente la barra de energía, compuesta por Energía Elemental y Energía Instinto.

Estas habilidades permiten modificar el flujo del combate y refuerzan el estilo de juego de cada personaje.

- **Christian**:  
Recupera 50% de su vida actual y 30% de su escudo.  
Obtiene en su mano una carta válida basada en la carta en mesa.

![Christian](../client/src/assets/characters/christian/Christian_v4_resized.png)

- **Gustav**:  
Recupera 25% de su vida y 60% de su escudo.  
Se vuelve inmune a efectos durante el siguiente turno.

![Gustav](../client/src/assets/characters/gustav/Gustav_v3_resized.png)

- **Gavin**:  
Recupera 30% de su vida y 30% de su escudo.  
Durante los siguientes 2 turnos, el daño recibido de cartas enemigas se reduce en un 50%.

![Gavin](../client/src/assets/characters/gavin/Gavin_v3_resized.png)

- **Eddy**:  
Recupera 75% de su vida actual, pero pierde 35% de su escudo.  
Durante los siguientes 2 turnos, el daño de sus cartas se duplica.

![Christian](../client/src/assets/characters/eddy/Eddy_v2_resized.png)


Cada personaje modifica la forma óptima de construir el deck y gestionar recursos durante la run.



#### **Enemies**

Es importante diferenciar entre dos tipos de enemigos:

- **Enemigos de exploración (platformer)**: actúan como obstáculos y generan presión constante, pero no utilizan el sistema de cartas.
- **Enemigos de duelo (bosses)**: representan encuentros obligatorios dentro de cada zona. Cada uno corresponde a una facción y actúa como punto de progreso dentro de la run, activando un duelo de cartas con mecánicas únicas.

Dependiendo del nivel de dificultad o del tipo de enemigo, la inteligencia artificial puede tomar decisiones diferentes al momento de jugar una carta. Tenemos contempladas tres modalidades:
*Easy AI*
    Selecciona una carta válida de forma aleatoria, entre las opciones disponibles.

*Medium AI*
    Le da prioridad a cartas que produzcan coincidencias dobles (elemento y número), con el objetivo de generar energía más rápido.

*Hard AI (permanente tras la primera run)*
    Evalúa las cartas disponibles, dándole prioridad a jugadas que generen la mayor cantidad de energía, activen habilidades y mantengan presión ofensiva sobre el jugador

#### **Bosses**

Habiendo tres facciones, cada una cuenta con un boss en específico, que introduce variaciones en el flujo del combate mediante habilidades especiales (ultimates). Estos bosses utilizan el mismo sistema de cartas, pero cuentan con ventajas únicas que obligan al jugador a adaptar su estrategia.

Tras la run introductoria, todos los bosses operan bajo una dificultad alta, variando principalmente en sus habilidades. Los valores de estas habilidades pueden escalar ligeramente conforme el jugador avanza en su progreso global, manteniendo el desafío en runs posteriores.

---

- **Skawl** — Boss introductorio (Rata) 
Recupera 35% de su vida y gana 30% de escudo.  
Durante los siguientes 2 turnos, el daño de las cartas del jugador se reduce en un 50%.

Diseñado para introducir la mecánica de bosses, castiga jugadas agresivas sin planificación.

![Skawl](../client/src/assets/characters/skawl/Skawl_resized.png)

---

- **Rabyz** — Boss de control (Mapache) 
Recupera 50% de su vida y gana 20% de escudo.  
Elimina todos los efectos activos sobre sí mismo y reduce la Energía Elemental del jugador en un porcentaje moderado.

Enfocado en romper la estrategia del jugador, obligándolo a reconstruir momentum.

![Rabyz](../client/src/assets/characters/rabyz/Rabyz_resized.png)

---

- **Boldear** — Boss de presión (Oso)
Recupera 45% de su vida y gana 60% de escudo.  
Durante el siguiente turno del jugador, su mano se limita a jugar solo 1 carta y no puede potenciar cartas con energía.

Limita la capacidad ofensiva del jugador, manteniendo presión sin eliminar completamente la interacción.

![Boldear](../client/src/assets/characters/boldear/Boldear_resized.png)

---

- **Pythra** — Boss final (Pitón) 
Recupera 75% de su vida y gana 80% de escudo.  
Durante 3 turnos, utiliza únicamente cartas de Hielo y, adicionalmente, puede activar una versión reducida de las habilidades de los bosses anteriores.

Funciona como la prueba final, combinando control, presión y manipulación del flujo del combate.

![Pythra](../client/src/assets/characters/pythra/Pythra_resized.png)

---



## _Level Design_

---

### **Themes (maps)**

1. Pantano (Swamp)
    1. Mood
        1. Turbulento, sucio, tierroso, hogareño
    2. Objects
        1. _Ambient_
            1. Árboles
            2. Vegetación de la zona
            3. Riachuelo del pantano
            4. Superficie a la orilla del riachuelo
        2. _Interactive_
            1. Ratas (primer mapa)
            2. Inicio de duelo con boss (por contacto)
2. Basurero (garbage dump)
    1. Mood
        1. Sucio, revuelto, incomodo
    2. Objects
        1. _Ambient_
            1. Elementos de armaduras
            2. Camiones
        2. _Interactive_
            1. Mapaches (segundo mapa)
            2. Inicio de duelo con boss (por contacto)
3. Suburbios (suburbs)
    1. Mood
        1. Peligroso, remoto
    2. Objects
        1. _Ambient_
            1. Casas, departamentos
            2. Calles
            3. Vehículos
        2. _Interactive_
            1. Osos (tercer mapa)
            2. Inicio de duelo con boss (por contacto)
4. El Desagüe (The Sewers)
    1. Mood
        1. Peligroso, sucio, conflictuado, desconocido
    2. Objects
        1. _Ambient_
            1. Tuberias
            2. Plataformas
            3. Escaleras
        2. _Interactive_
            1. Osos (tercer mapa)
            2. Inicio de duelo con boss final (por contacto)
            3. Pythra - Boss Final (Python bivittatus)


### **Game Flow**

1. Klancy introduce al jugador al mundo de Florida Frenzy.
2. Le da una breve introudcción (texto) sobre qué esperar (dará pistas durante cada evento dentro de esta run de novato).
3. El jugador inicia una run.
4. Explora una zona del mapa (platformer).
5. Entra en contacto con un boss (activa un duelo de cartas).
6. El jugador debe derrotar a su oponente con las reglas del duelo.
7. Si gana, recibe una recompensa o mejora para el mazo.
8. Avanza a la siguiente zona.
9. El ciclo se repite otras 2 veces, hasta llegar al jefe final.
10. Al derrotar al jefe final, se activa el cierre de la run y la secuencia final.

O en su defecto:
Platformer → Boss 1 → Platformer → Boss 2 → Platformer → Boss 3 → Platformer → Boss Final


---
## _Development_

---

### **Abstract Classes / Components**

1. BaseEntity
    1. BasePlayer
    2. BaseEnemy
    3. BaseNPC
2. BaseCard
3. BaseDeck
4. BaseBattle
5. BaseZone
6. BaseInteractable
7. BaseObstacle

_(example)_

### **Derived Classes / Component Compositions**

1. BasePlayer
    1. CrocClanCharacter
        1. CharacterChristian
        2. CharacterGustav
        3. CharacterGavin
        4. CharacterEddy

2. BaseEnemy
    1. EnemyRizzy
    2. EnemyRabyz
    3. EnemyBoldear
    4. BossPythra
    5. NPCRat
    6. NPCRaccoon
    7. NPCBear

3. BaseCard
    1. CardWater
    2. CardFire
    3. CardSwamp
    4. CardSand
    5. CardIce
        1. IceStun
        2. IceOverdrive
        3. IceJam

4. BaseZone
    1. ZoneSwamp
    2. ZoneGarbageDump
    3. ZoneSuburbs
    4. ZoneSewers

5. BaseInteractable
    1. InteractableEnemyTrigger
    2. InteractableRewardChest
    3. InteractableEventSpot

6. BaseObstacle
    1. ObstacleSwampWater
    2. ObstacleGarbagePile
    3. ObstacleBrokenCar



## _Graphics_

---

### **Style Attributes**

Decidimos irnos por un estilo caricaturesco, con elementos relativamente realistas, para los personajes. Adecuando sus alreadedores (escenarios) con esta misma idea. Aunque, durante el proceso del desarrollo, la IA utilizada para generar a los personajes base (ChatGPT), realizó a los enemigos ligeramente más realistas y con más detalles. La idea es que los cocodrilos tengan este aspecto de guerreros de un clan, que recicla lo que encuentra en los basureros (y tristemente en los ríos) de toda el área pantanosa de Florida. Aprendieron "el arte antiguo" de Florida Frenzy, por lo que el aspecto de las cartas va por una impresión de "antigüedades" o elementos legendarios. Los enemigos son la consecuencia de experimentos bio-cibernéticos que se dieron a la fuga. Mientras que estos lograron adquirir su inteligencia por medio de su interconección con computadoras al cerebro, nuestro protagonistas la desarrollaron por los contaminantes y radiación que se encuentra en las aguas del pantano.

Dejando así un contraste visual entre "buenos vs. malos", dándole una perspectiva clara al jugador. Los poderes/elementos de las cartas están hechos para ser lo más simples, entendibles y llamativas posibles. 

Los personajes, así como otros sprites y diseños que se utilizarán en el juego, se encuentran en las siguientes carpetas:

| Category | Location |
|----------|----------|
| Logos | [logos](../client/src/assets/logos/) |
| Iconos | [iconos](../client/public/) |
| Sprites | [sprites](../client/src/assets/sprites/) |
| Fondos | [backgrounds](../client/src/assets/backgrounds/) |
| Personajes (WIP) | [characters](../client/src/assets/characters/) |
| Sprites y diseños desechados | [scrapped_assets](../Videojuego/scrapped_assets/) |



### **Graphics Needed**

1. Characters
    1. Playable Characters (Croc Clan)
        1. Christian (idle, walk, jump, attack (platformer) - idle, attack, damage, ultimate (TCG))
        2. Gustav (idle, walk, jump, attack (platformer) - idle, attack, damage, ultimate (TCG))
        3. Gavin (idle, walk, jump, attack (platformer) - idle, attack, damage, ultimate (TCG))
        4. Eddy (idle, walk, jump, attack (platformer) - idle, attack, damage, ultimate (TCG))
    2. Bosses
        1. Skawl (rat boss - idle, attack, damage, ultimate)
        2. Rabyz (raccoon boss - idle, attack, damage, ultimate)
        3. Boldear (bear boss - idle, attack, damage, ultimate)
        4. Pythra (final boss - idle, attack, damage, ultimate)
    3. Minor Enemies (platformer)
        1. Rat (idle, movement)
        2. Raccoon (idle, movement)
        3. Bear (idle, movement)

2. Environment / Blocks
    1. Swamp terrain (mud, water, vegetation)
    2. Garbage dump elements (trash piles, metal scraps)
    3. Suburban elements (roads, houses, vehicles)
    4. Sewer structures (pipes, platforms, ladders)

3. UI Elements
    1. Health bar (HP)
    2. Shield bar
    3. Energy bar (EE / EI split)
    4. Card UI (hand, deck, discard, table)
    5. Menu interfaces (main menu, options, inventory)

4. Cards
    1. Elemental cards (Fire, Water, Swamp, Sand)
    2. Ice cards (special variants)
    3. Clan/Species cards (rare)

5. Objects & Interactables
    1. Chests
    2. Reward nodes / event points
    3. Enemy triggers (duel initiation)


## _Sounds/Music_

---

### **Style Attributes**

El estilo sonoro del juego busca mantener coherencia con su estética "punk-industrial del pantano", combinando elementos retro, con un enfoque moderno.

La música estará inspirada en:

- Boom-bap (old-school hip-hop)
- Sonido 8-bit / chiptune
- Ritmos marcados y repetitivos para acompañar la tensión del juego

Esto genera una mezcla entre lo nostálgico y lo urbano, alineado con la identidad del Croc Clan.

En cuanto a efectos de sonido:

- Se prioriza claridad sobre realismo
- Feedback inmediato al jugador
- Sonidos cortos, impactantes y distinguibles

El audio debe permitir al jugador identificar acciones clave sin interferir con la música.

---

### **Sounds Needed**

1. Movement & Environment
    1. Footsteps (swamp / mud)
    2. Footsteps (hard surface / urban)
    3. Jump
    4. Landing (soft / hard)

2. Combat (Platformer)
    1. Melee attack hit
    2. Projectile shot
    3. Enemy hit

3. Card System
    1. Card play sound
    2. Invalid move feedback
    3. Draw card
    4. Discard card
    5. Energy gain (EE / EI)
    6. Ultimate activation

4. Feedback
    1. Damage taken
    2. Shield gain
    3. Victory (duel win)
    4. Defeat (run end)
    5. Reward selection

---

### **Music Needed**

1. Swamp Theme (exploration)
    - Calm but tense, slow boom-bap rhythm

2. Combat Theme (card duels)
    - Faster tempo, more intense beats

3. Boss Theme
    - Higher intensity, layered instrumentation

4. Menu Theme
    - Minimalist loop, relaxed tone

5. End Credits Theme
    - Conclusive, slightly uplifting variation of main theme


## _Schedule_

---

_(define the main activities and expected timeline; subject to change during development)_

1. Pre-production
    1. Define Game Design Document (GDD)
    2. Define core mechanics (cards, deck, energy system)
    3. Define game loop and progression systems

2. Core System Development
    1. Implement base classes (player, enemy, card, deck)
    2. Implement card system logic (valid plays, effects, discard)
    3. Implement energy system (EE / EI)
    4. Implement turn-based combat system

3. Platformer Development
    1. Implement player movement and physics
    2. Implement enemy behaviors (NPCs)
    3. Implement level generation system
    4. Integrate exploration and duel triggers

4. Game Systems Integration
    1. Implement Clan Rank and progression
    2. Implement reward system
    3. Implement boss logic and AI behavior

5. UI & Visual Integration
    1. Implement HUD (HP, shield, energy)
    2. Implement card interface
    3. Implement menus and navigation

6. Audio Integration
    1. Add sound effects
    2. Add background music
    3. Balance audio levels

7. Testing & Balancing
    1. Gameplay balancing (cards, bosses, progression)
    2. Bug fixing
    3. Performance optimization

8. Finalization
    1. Polish visuals and audio
    2. Prepare final build
    3. Documentation and presentation

---

![TheEndOfThisDocument](../client/src/assets/backgrounds/everglades.jpg)
