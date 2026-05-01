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

Florida Frenzy es un videojuego roguelite en 2D que combina dos sistemas de juego principales: una fase de exploración y combate en tiempo real con perspectiva top-down, y una fase de duelo de cartas por turnos tipo TCG. El jugador asume el rol de uno de los miembros del Croc Clan y se adentra en distintas zonas hostiles inspiradas en los pantanos y alrededores urbanos de Florida, enfrentándose a enemigos menores durante la exploración y a bosses especializados mediante combates de cartas.

El ciclo principal del juego se basa en runs cortas pero rejugables, donde el jugador selecciona previamente un personaje y un deck, avanza por varias zonas consecutivas, recolecta recursos, sobrevive a la presión de los enemigos del mapa y finalmente entra en contacto con un boss que activa un duelo estratégico. Durante estos enfrentamientos, el sistema de cartas se construye alrededor de reglas inspiradas en juegos como UNO, donde las jugadas válidas dependen de coincidencias por elemento o valor, pero se expande con efectos especiales, cartas raras, construcción de mazo y un sistema dual de energía.

El elemento diferenciador de Florida Frenzy es precisamente esa combinación entre acción inmediata y planeación táctica. En la fase de duelo, el jugador no solo debe administrar su mano, deck y pila de descarte, sino también dos recursos paralelos: Energía Elemental (EE) y Energía Instinto (EI). Estos recursos determinan el acceso a cartas con efecto, jugadas más poderosas y habilidades únicas del personaje, añadiendo una capa de profundidad que va más allá de simplemente “hacer match” con la carta en mesa.

A nivel de progresión, Florida Frenzy incorpora un sistema persistente de Swamp XP, Clan Rank, personajes desbloqueables, cartas obtenidas y construcción de múltiples decks. Cada run puede terminar en victoria o derrota, pero el progreso global del jugador se conserva, permitiéndole ampliar sus opciones estratégicas en futuras partidas mediante nuevos personajes, cartas especiales, cartas de Hielo, mejoras y configuraciones de deck más avanzadas. De esta manera, el juego busca ofrecer una experiencia dinámica, con identidad visual punk-industrial y una mezcla constante entre improvisación, presión y estrategia.

### **Gameplay**

El objetivo principal es sobrevivir a una serie de runs rejugables en las cuales el jugador avanza a través de distintas zonas en un mapa 2D. Cada run combina una fase de exploración y combate en tiempo real con una fase de duelo de cartas por turnos, por lo que el éxito depende tanto de la movilidad, administración de recursos y supervivencia durante la exploración, como de la estrategia empleada en los enfrentamientos TCG contra bosses.

Cada run se estructura en una secuencia de zonas o stages consecutivos que combinan exploración, combate en tiempo real, recolección de monedas y enfrentamientos obligatorios contra bosses. La cantidad exacta de encuentros principales está definida para ser infinita, a fin de darle un valor de re-jugabilidad.

Ademas, el jugador es cuenta con un recurso que al recolectarlo, progresivamente le permitirá adquirir mejoras y objetos de gran utilidad: las monedas - disponibles durante el top-down. Esto permite al jugador decidir entre avanzar rápidamente o explorar en busca de más y más monedas.

Durante la exploración, el jugador se enfrenta a distintas facciones enemigas (ratas, osos, mapaches) que generan presión constante antes del siguiente duelo. Al llegar al encuentro obligatorio del boss de la zona —ya sea por contacto directo o al alcanzar el objetivo del stage— se activa la fase de duelo de cartas, donde el resultado depende del personaje equipado, del deck activo del jugador y de su capacidad para adaptarse al estilo del rival.

Conforme el jugador progresa, la dificultad del top-down escala. Los enemigos aplican patrones más exigentes, y el jugador obtiene acceso a nuevas opciones de progresión persistente, como personajes desbloqueables, cartas adicionales, mejoras de estadísticas y configuraciones de deck más avanzadas. Esta progresión no solo incrementa el poder del jugador, sino también la profundidad estratégica disponible entre runs.

La primera vez que el jugador inicia el juego, accede a una run introductoria o tutorial guiado por Klancy. Esta sección sirve para enseñar el flujo básico de exploración, contacto con bosses y reglas del duelo de cartas. Una vez completada, el resto de las runs utilizan la configuración estándar de dificultad y progresión del juego.

Cuando el jugador pierde una run o un enfrentamiento decisivo, debe reiniciar desde el inicio del ciclo de progresión, pero conserva su progreso global. Este progreso persistente incluye el avance de Clan Rank, personajes desbloqueados, cartas obtenidas y herramientas de construcción de deck. De este modo, cada derrota sigue aportando al crecimiento estratégico del jugador para runs futuras.

El sistema de combate se basa en un modelo híbrido entre reglas tipo UNO y construcción de mazo (deckbuilding). Antes de cada run, el jugador selecciona un personaje y un deck activo; durante los duelos, utiliza una mano limitada de cartas que se renueva progresivamente mediante robo. Las jugadas se basan en coincidencias por elemento o valor numérico, mientras que la gestión de recursos como Energía Elemental e Instinto permite ejecutar estrategias más complejas.

El duelo utiliza dos recursos paralelos: **Energía Elemental (EE) y Energía Instinto (EI)**.

- **Energía Elemental**: se genera al jugar cartas del mismo elemento consecutivamente.
- **Energía Instinto**: se genera dependiendo del valor numérico de la carta jugada.

Ambos recursos tienen un límite máximo y se reinician al finalizar un combate.

---

Al finalizar una run, ya sea por victoria o por derrota, el jugador obtiene Swamp XP, recurso que alimenta el sistema de progresión global conocido como Clan Rank. Este sistema determina qué tan amplio es el acceso del jugador a nuevas cartas, configuraciones de deck y herramientas estratégicas entre runs.

#### **Clan Rank System**

El progreso del jugador se organiza en distintos niveles de Clan Rank, representando su experiencia acumulada y el acceso a nuevas opciones de construcción de deck:

- **Rookie (maxLevel < 4)**  
  Acceso al set base de cartas y a los decks más pequeños.
  Enfocado en aprendizaje del sistema central.

- **Veteran (maxLevel >= 4)**  
  Acceso a cartas con efecto y a nuevas herramientas de construcción de deck.
  Introduce decisiones más complejas de control, gasto de energía y sinergia.

- **Elite (maxLevel >= 8)**  
  Acceso a cartas de Hielo y a configuraciones de deck más amplias y avanzadas.
  Aumenta la complejidad estratégica disponible.

- **Legend (maxLevel >= 13)**
  Acceso al rango más alto de personalización y al conjunto completo de contenido desbloqueable del sistema principal.
  Representa la optimización máxima del progreso global del jugador.

Las cartas legendarias no se obtienen directamente mediante Clan Rank, sino que se plantean como recompensas raras ligadas a la fase de exploración de las runs. Esto las convierte en elementos excepcionales del progreso, separados del desbloqueo más estructurado del resto del sistema de cartas.

Es importante distinguir entre progreso temporal y permanente:

- **Se conserva entre runs**:
  - Swamp XP
  - Clan Rank
  - Cartas desbloqueadas o compradas
  - Personajes desbloqueados
  - Progreso general de construcción de deck

- **No se conserva entre runs**:
  - Mejoras de vida y escudo
  - Mejoras temporales
  - Estado del duelo en curso

Esto refuerza la naturaleza roguelite del juego, donde cada nueva run representa un nuevo intento, pero con herramientas estratégicas acumuladas previamente.


### **Mindset**

El objetivo es mezclar un la jugabilidad "nostálgica" con los elementos 'punk' y caricaturescos de los personajes. Provocando una sensación de estrategia caótica, con identidad punk-industrial del pantano. El jugador debe sentirse como un miembro mas del clan que improvisa constantemente. La experiencia está diseñada bajo la idea de que sea fácil de entender, pero difícil de dominar.

El caos visual contrasta con la claridad de información de la interfaz, fomentando análisis crítico y lógico en medio de la tensión.

## _Technical_

---

### **Screens**
1. Title Screen
Contiene el logo del juego, una imagen del pantano en el fondo, y las siguientes opciones (en descendente):
    - Play
    - Multiplayer
    - Shop
    - Friends
    - Log Out
    1. Sidebar de opciones
        - Play
        - Deck (management y creation)
        - Stats (globales y de admin)
        - Info (How to Play)
        - Story (Lore y descripciones de los personajes)
        - Tutorial (escena)
        - Settings (Volumen, idioma, resolución, display, cuenta)
2. Level Select
    - No existe una pantalla de selección manual de nivel. El progreso se organiza mediante runs continuas y stages encadenados, que avanzan internamente conforme el jugador completa la exploración y los duelos correspondientes.
3. Game
    - Modo Exploración / Run Scene
        Fase de exploración y combate en tiempo real con perspectiva top-down. El jugador se desplaza por el mapa, administra vida, stamina y munición, enfrenta enemigos menores, recolecta monedas y avanza hasta llegar al encuentro del boss del stage. El contacto con dicho boss activa la transición a la fase de duelo de cartas.
    - Duelo de Cartas
        Muestra el tablero principal del TCG, incluyendo la carta en mesa, mano del jugador, deck, pila de descarte, estadísticas del personaje activo y estadísticas del boss enemigo. También presenta los recursos de combate del sistema dual de energía y la retroalimentación visual del turno.
        1. Deck / Collection Review:
        El jugador puede revisar su deck activo, cartas disponibles, restricciones de construcción y progreso de colección desde las pantallas de administración del deck y de progreso fuera de la run. Esta función sustituye el concepto de un inventario tradicional.
        2. Stage Complete / Progress Feedback:
        Al completar un stage o un encuentro clave, el juego muestra una pantalla de progreso con recompensas obtenidas, como monedas y XP. A futuro, esta capa puede ampliarse hacia selecciones más complejas de recompensa o modificación del deck.
        3. Deck Builder:
        Pantalla dedicada a la creación y administración de decks. Aquí el jugador puede seleccionar cartas poseídas, revisar restricciones según Clan Rank, administrar varios decks, verificar el tamaño permitido del mazo y definir el personaje asociado al deck activo. 
        
        Esta pantalla forma parte del sistema de progresión persistente del juego y no solo de una preparación momentánea antes de la run.

4. End Credits
    Actualmente solo hay una escena de "desenlace" al vencer al main/final Boss, Pythra por primera vez; dada la lógica del juego, no hay un final como tal.


### **Controls**

Florida Frenzy utiliza teclado y mouse en ambas fases principales del juego, aunque los controles cambian según el modo activo.

**Exploration / Run Scene**
1. W / A / S / D ← Movimiento del personaje
2. Shift ← Sprint / aceleración temporal, consumiendo stamina
3. Mouse Movement ← Apuntar durante la exploración
4. Click Izquierdo ← Disparar
5. ESC ← Pausa

**Cards Duel / Duel Scene**
1. Mouse Movement ← Navegar la interfaz del duelo
2. Click Izquierdo ← Seleccionar y jugar una carta válida
3. Click Derecho ← Descartar una carta
4. ESC ← Pausa

*Notas*
- El juego desactiva la navegación de teclado cuando el usuario escribe en inputs o textareas del front-end.
- El click derecho dentro del canvas está reservado para interacciones del juego y no para abrir el menú contextual del navegador.

---

### **Mechanics**

---

#### **Top-Down Exploration System**

Durante la fase de exploración, el jugador participa en una run top-down en tiempo real, donde se desplaza por el mapa, evita o combate enemigos menores (minions), recolecta monedas, mientras que se proteje de los ataques inminentes, y avanza hasta llegar al encuentro del boss que activará el duelo de cartas.

##### **Level Generation**

Los niveles se generan de forma semi-aleatoria a partir de segmentos predefinidos. Cada zona mantiene su identidad visual y temática, pero la disposición de zonas, obstáculos y enemigos puede variar entre runs.

Esto permite:

- Rejugabilidad
- Variación en rutas
- Diferentes niveles de riesgo

Cada mapa se construye a partir de segmentos predefinidos, de modo que:

- La temática visual de la zona se conserva
- Cambian algunos obstáculos, rutas y enemigos menores
- Hay una conexión evidente con el terreno explorado, y aquel que aparece de fondo en el duelo de cartas del nivel

##### **Player Movement & Combat**

El jugador puede desplazarse libremente en cuatro direcciones durante la exploración, usar sprint consumiendo stamina y atacar a distancia mediante disparo. El combate en esta fase no es el núcleo principal del juego, pero sí funciona como una fuente constante de presión y desgaste antes del siguiente duelo de cartas.


##### **Minor Enemies (Minions)**

Durante la exploración, el jugador enfrenta enemigos menores que funcionan como obstáculos activos. A nivel de diseño, estos se agrupan en arquetipos de comportamiento como unidades rápidas, unidades de presión a distancia y unidades resistentes de control espacial. Narrativamente, estos arquetipos corresponden a las distintas facciones del juego (ratas, mapaches y osos).

- **Ratas**
  - Baja vida
  - Daño bajo
  - Movimiento rápido
  - Suelen aparecer en grupo
  - Comportamiento: avanzan constantemente hacia el jugador
  - Rol: obligan a reaccionar rápido y castigan distracciones

- **Mapaches**
  - Vida media
  - Daño medio
  - Comportamiento mixto entre movilidad y ataque a distancia
  - Pueden colocarse en una posición y lanzar proyectiles al jugador antes de reposicionarse
  - Rol: generar presión desde media distancia y bloquear rutas

- **Osos**
  - Alta vida
  - Daño alto
  - Movimiento lento, pero persecución directa cuando detectan al jugador
  - Requieren varios impactos para ser derrotados
  - Rol: controlar espacio, cerrar rutas y forzar enfrentamientos

##### **Approximate Combat Values**

Los valores exactos pueden ajustarse durante el balanceo, pero conceptualmente se contemplan así:

- **Ratas**
  - Vida: baja
  - Ataque: bajo
  - Resistencias: mínimas

- **Mapaches**
  - Vida: media
  - Ataque: medio
  - Resistencias: moderadas

- **Osos**
  - Vida: alta
  - Ataque: alto
  - Resistencias: altas

Estos enemigos pueden derrotarse mediante a distancia, pero su propósito principal no es detener completamente la run, sino debilitar al jugador antes del siguiente boss.

##### **Obstacles & Objects**

Cada mapa cuenta con diferentes obstaculos y objetos con los cuales el jugador se puede topar. Pueden ser los charcos que le ofrecen restauración de vida, o los agujeros que lo mandan directamente para el lobby. U objetos neutrales que sirven como barreras entre el jugador y los minions. 

---

El duelo de cartas consiste en diferentes reglas y atributos que definen el flujo del enfrentamiento. De nuevo, esta directamente inspirado en el juego 'UNO', las mecánicas se asemejan a las de este juego de mesa. Con algunos elementos innovadores y estratégicos, que hacen de una jugada algo más entretenido.

El combate con cartas se desarrolla por turnos alternados entre el jugador y el enemigo en cuestión. Durante un turno, cada participante puede jugar una carta válida desde su mano, o realizar una acción alternativa (como descartar una carta).

--- 

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

--- 

##### **No Valid Move Rule**

Si un jugador no tiene una carta válida, roba 1 carta adicional desde su deck.

Si ninguna carta del deck conicide con lo que el jugador necesita, o ya no queda alguna en primer lugar, el jugador empieza a comer de la pila de descarte.

Esto obliga al jugador a decidir entre perder recursos o perder vida.

**Aclaración importante:**  
El jugador **no puede jugar una carta inválida** solo para desperdiciarla.  
Si una carta no coincide por elemento o valor numérico con la carta en mesa, simplemente no puede ser utilizada en ese turno.

En ese caso, el jugador debe:
- robar desde su deck
- continuar robando según las reglas del sistema
- o descartar voluntariamente una carta desde su mano si decide gestionar recursos de esa forma

--- 

#### **Card Structure**

Cada carta contiene:

- Elemento
- Valor numérico
- Tipo
- Efecto(s) (si aplica)
- Rareza
- Costo de energías

--- 

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

- **Hielo**: el quinto elemento especial y raro. Funciona como comodín y permite efectos avanzados como congelamiento, bloqueo de habilidades, manipulación de turnos y jugadas múltiples.

![IceFront](../client/src/assets/sprites/CardIceFront.png)

--- 

#### **Card Categories**

Las cartas se clasifican según su función dentro del combate:

- **Ataque**: infligen daño directo al oponente.
- **Defensa**: generan escudo o reducen daño recibido.
- **Estado**: aplican efectos como veneno, quemadura, control, alivio, y más.
- **Especial**: modifican reglas del turno o del sistema de juego.

Las **cartas básicas** dependen principalmente de su valor numérico y elemento para determinar su efecto.

Las **cartas con efecto** introducen mecánicas adicionales como estados, control del turno, modificación de daño o alteración de reglas, y generalmente requieren consumo de energía para ser utilizadas.

Estas son las que traen más balance consigo al juego; puesto que pueden llegar a ser relativamente complejas, o simplemente cuentan con algún efecto instantáneo que cambia las probabilidades de un duelo.

--- 

#### **Card System - Complete Catalog**

Adentrandonos más en la lógica del sistema de cartas, en cuántas hay y qué hacen, este se divide en cuatro categorías principales:

1. Cartas Base  
2. Cartas Especiales  
3. Cartas de Hielo  
4. Cartas Legendarias (Extremadamente raras)  

Cada tipo cumple un rol específico dentro del combate.

##### **Card Value & Effect Resolution**

El valor numérico de una carta sí modifica directamente su impacto base.

En cartas base:

- **Fire X** → inflige daño directo igual a X
- **Water X** → genera escudo igual a X
- **Swamp X** → aplica un efecto de desgaste proporcional a X
- **Sand X** → reduce daño entrante en proporción a X

En cartas especiales, el valor numérico puede:

- aumentar daño base,
- ampliar duración de un estado,
- incrementar escudo generado,
- o funcionar como requisito de activación según el efecto.

##### **When Effects Apply**

Los efectos especiales se aplican inmediatamente después de que la carta es jugada y validada, salvo que el efecto indique explícitamente una duración posterior.

Por lo tanto, una carta puede generar:

- un efecto inmediato (ej. daño, escudo, limpieza),
- un efecto temporal (ej. veneno por turnos, bloqueo por 1 turno),
- o una modificación de reglas (ej. jugar 2 cartas, desactivar cartas con efecto).

---

#### **1. Base Cards (36 cartas)**

Cartas fundamentales del juego. No poseen efectos especiales, pero definen el flujo principal del combate. Y como es mencionado, son las cartas que siempre permanecerán desbloqueadas. Definen la base de toda carta, y el juego no funcionaría sin estas.

Cada una tiene:
- Un número (1–9)
- Un elemento
- Un comportamiento base según su elemento

##### **Elementos base**
Como fueron descritos previamente, en términos de mecánicas y funcionamiento simple, cada una se categoriza de la siguiente forma:

- **Fire (Fuego)** → Daño directo  
- **Water (Agua)** → Genera escudo  
- **Swamp (Pantano)** → Aplica veneno (daño por turnos)  
- **Sand (Arena)** → Reduce daño recibido  

---

##### **Comportamiento por elemento**

- **Fire X**
  - Inflige daño directo, de acuerdo a su valor numérico

- **Water X**
  - Genera escudo, de acuerdo a su valor numérico

- **Swamp X**
  - Aplica veneno durante X turnos (daño acumulativo o constante), de acuerdo a su valor numérico dividido entre 3

- **Sand X**
  - Reduce el daño recibido en el siguiente turno, de acuerdo a su valor numérico

---

#### **2. Special Cards (20 cartas)**

Cartas con efectos adicionales que expanden la estrategia.  
Cada elemento cuenta con **5 variantes especiales**.

---

##### **Fire Special Cards (Ofensivas)**

- **Burn Strike**
  - 12 daño + 4 burn por 2 turnos

- **Half Break**
  - 10 daño. Bloquea cartas Fire por 1 turno

- **Rage Boost**
  - 20 daño si el rival está bajo 50% HP

- **Explosion**
  - 24 daño. Recibes 6 de recoil

- **Chain Fire**
  - 12 daño. Tu próximo Fire gana +6 daño

---

##### **Water Special Cards (Defensivas)**

- **Healing Wave**
  - 10 escudo y cura 6 HP

- **Shield Surge**
  - Duplica tu escudo. Si no tienes, ganas 24

- **Cleanse**
  - Cleanses all active negative effects

- **Reflect**
  - Refleja 35% del daño por 1 turno

- **Flow State**
  - +30% energía por 2 turnos

---

##### **Swamp Special Cards (Control / desgaste)**

- **Toxic Spread**
  - 10 poison por 3 turnos

- **Decay**
  - Reduce el escudo rival en 10%

- **Infection**
  - Extiende 1 turno los efectos del rival

- **Corrosion**
  - Reduce por 6 el daño rival por 2 turnos

- **Leech**
  - 10 daño. Roba 25% del daño como vida

---

##### **Sand Special Cards (Mitigación / control)**

- **Quicksand**
  - Reduce el próximo ataque rival a la mitad

- **Dust Blind**
  - Nega el próximo Sand rival. Si no aplica, ganas 20 escudo

- **Barrier**
  - Gana 20 escudo. Si el rival juega Swamp Special, ganas 20 más

- **Skywalker**
  - Comodín Sand contra cualquier Special

- **Sandstorm**
  - Tus cartas Sand ganan +20% daño por 3 turnos

---

#### **3. Ice Cards (5 cartas especiales)**

Cartas raras con efectos únicos.  
No siguen reglas estándar de elemento.

---

- **Ice Stun**
  - Congela al rival por 1 turno

- **Ice Jam**
  - Bloquea las especiales rivales por 2 turnos

- **Ice Overdrive**
  - Puedes jugar 2 cartas este turno

- **Ice Shift**
  - La mano rival va a discard. Roba una nueva desde la discard pile

- **Ice Flood**
  - Si la carta en mesa es base, copia su número y fuerza respuesta solo por ese número. Si la carta en mesa es especial, gana 25 HP y 25 escudo y el rival puede responder con cualquier carta

---

#### **4. Legendary Cards (Extremely Rare)**

Cartas únicas, obtenidas únicamente en el top-down.  
Tienen efectos extremadamente poderosos.

---

- **Crocodile**
  - Remueve el 35% de la vida del oponente

- **Alligator**
  - Recupera el 100% de su vida

- **Gavial**
  - Carga la Ulti del jugador instantaneamente

- **Caiman**
  - Aplica un estado aleatorio al enemigo

- **Sarcosuchus**
  - Reduce al enemigo a 25 HP y 25 escudo

---

#### **Balance Notes**

- Las cartas base garantizan consistencia  
- Las cartas especiales introducen decisiones estratégicas  
- Las cartas de hielo rompen reglas del sistema  
- Las cartas legendarias funcionan como "game changers"  

--- 

#### **Deck System**

##### **Deck Construction Rules**

Antes de cada run el jugador debe construir su deck, respetando las siguientes reglas:

- El tamaño del deck, y cuantas slots tiene disponibles, depende de su Clan Rank:
  - **Rookie** → 12 cartas
  - **Veteran** → 15 cartas
  - **Elite** → 19 cartas
  - **Legend** → 21 cartas

- El deck puede incluir lógicamente, todas las cartas, siempre y cuando las tenga desbloqueadas o compradas.

- Restricciones:
  - El jugador solo puede construir el deck con cartas previamente desbloqueadas o compradas (previamente mencionado)
  - Para salvar y activar un deck, tiene que si o si llenarlo

Esto permite que la construcción del mazo sea una decisión estratégica real y no solo una selección estética.

A continuación, desarrolamos un poco más en la lógica detrás de esto.

---

#### **Hand, Deck & Discard Interaction**

El sistema de cartas se compone de tres estructuras principales durante el combate:

- **Deck (mazo)**
- **Hand (mano)**
- **Discard Pile (pila de descarte)**

---

##### **Deck (Mazo)**

El deck representa el conjunto de cartas activas del jugador durante una run.

De nuevo, estas cartas son seleccionadas antes de iniciar la run y representan la base estratégica del jugador.

---

##### **Hand (Mano)**

- El jugador inicia cada combate con una mano de **5 cartas**.
- Cada turno roba **1 carta adicional** desde su deck.
- Solo las cartas en la mano pueden ser jugadas.

Esto obliga al jugador a gestionar sus recursos y planificar sus jugadas con información limitada.

---

##### **Discard Pile (Pila de descarte)**

Al inicio del combate, existe una pila de descarte con cartas base (**72 cartas base mezcladas**) que sirve como fuente adicional en caso de que el deck no sea suficiente. Todas las cartas utilizadas o descartadas se envían a una esta misma pila.

---

##### **Forced Draw & Discard Interaction**

Si un jugador no tiene una carta válida:

1. Roba cartas desde su deck.
2. Si el deck no contiene una carta útil y se agota, comienza a robar desde la pila de descarte.

Sin embargo, las cartas robadas desde la pila de descarte:

- **NO se agregan directamente a la mano**
- Se envían nuevamente al fondo de la pila de descarte
- El jugador continúa robando hasta encontrar una carta válida

---

##### **Draw Fatigue System**

Robar repetidamente desde la pila de descarte genera penalizaciones.

Cada cierto número de cartas robadas, el jugador recibe daño:

- 10 cartas robadas → 10 de daño  
- 20 cartas robadas → 10 de daño  
- 30 cartas robadas → 10 de daño  

Este sistema introduce presión constante y evita que el jugador dependa indefinidamente del robo.

---

##### **Discard Action**

El jugador puede descartar una carta voluntariamente:

- La carta se elimina de la mano
- No activa ningún efecto
- Se envía directamente a la pila de descarte

Esto permite gestionar manos desfavorables y buscar mejores opciones estratégicas.

---

##### **System Purpose**

Este sistema:

- Mantiene la incertidumbre del combate
- Refuerza la importancia de la construcción del deck
- Introduce decisiones de riesgo/recompensa
- Evita estancamientos en el flujo del juego

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

Ambas energías llenan una barra compartida dividida en dos mitades (50/50). 

##### **Energy Generation**

- **Energía Elemental (EE)**:
  - Se genera al jugar cartas del mismo elemento consecutivamente. 
  - Se utiliza para activar cartas con efecto y habilidades especiales.

- **Energía Instinto (EI)**:
  - Se genera en función del valor numérico de la carta jugada.
  - Se utiliza para potenciar cartas numéricas.

##### **Energy Cost**

Hay ciertas cartas, sobre todo las raras, que exigen una cierta cantidad de energía para ser utilizadas

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
Recupera 55% de su vida actual y 30% de su escudo. 
Obtiene en su mano una carta válida basada en la carta en mesa.

![Christian](../client/src/assets/characters/christian/Christian_v4_resized.png)

- **Gustav**:  
Recupera 25% de su vida y 60% de su escudo. 
Se vuelve inmune a efectos durante 3 turnos.

![Gustav](../client/src/assets/characters/gustav/Gustav_v3_resized.png)

- **Gavin**:  
Recupera 30% de su vida y 30% de su escudo. 
Durante los siguientes 2 turnos, el daño recibido de cartas enemigas se reduce en 50%.

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

---

#### **Card Difficulty Scaling**

Cada boss de cartas cuenta con diferentes tipos de cartas

- **Easy**
  - Base + Especiales

- **Medium**
  - Base + Especiales + Hielo

- **Hard**
  - Base + Especiales + Hielo + Legendarias


#### **Bosses**

Habiendo tres facciones, cada una cuenta con un boss en específico, que introduce variaciones en el flujo del combate mediante habilidades especiales (ultimates). Estos bosses utilizan el mismo sistema de cartas, pero cuentan con ventajas únicas que obligan al jugador a adaptar su estrategia.

Tras la run introductoria, todos los bosses operan bajo una dificultad alta, variando principalmente en sus habilidades. Los valores de estas habilidades pueden escalar ligeramente conforme el jugador avanza en su progreso global, manteniendo el desafío en runs posteriores.

---

- **Skawl** — Boss introductorio (Rata) 
Recupera 35% de su vida y gana 30% de escudo.  
Durante los siguientes 2 turnos, el daño de las cartas del jugador se reduce en un 50%.

![Skawl](../client/src/assets/characters/skawl/Skawl_resized.png)

---

- **Rabyz** — Boss de control (Mapache) 
Recupera 50% de su vida y gana 20% de escudo.  
Elimina todos los efectos activos sobre sí mismo y reduce la Energía Elemental del jugador en un porcentaje moderado.

![Rabyz](../client/src/assets/characters/rabyz/Rabyz_resized.png)

---

- **Boldear** — Boss de presión (Oso)
Recupera 45% de su vida y gana 60% de escudo.  
Durante el siguiente turno del jugador, su mano se limita a jugar solo 1 carta y no puede potenciar cartas con energía.

![Boldear](../client/src/assets/characters/boldear/Boldear_resized.png)

---

- **Pythra** — Boss final (Pitón) 
Recupera 75% de su vida y gana 80% de escudo.  
Durante 3 turnos, utiliza únicamente cartas de Hielo y, adicionalmente, puede activar una versión reducida de las habilidades de los bosses anteriores.

![Pythra](../client/src/assets/characters/pythra/Pythra_resized.png)

---

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
7. Avanza a la siguiente zona si gana.
8. El ciclo se repite continuamente.

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

### **Sounds Needed (Scrapped)**

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