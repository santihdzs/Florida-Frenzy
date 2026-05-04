# Florida Frenzy

A multiplayer roguelite that combines a real-time co-op platformer with a turn-based card battler. Players build decks, run procedurally generated maps together, and fight card-based boss encounters across escalating difficulty zones.

## Live Deployment

[florida-frenzy.santihdzs.com](https://florida-frenzy.santihdzs.com) — hosted on Render

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Game engine | Phaser 3 | 3.70.0 |
| Client language | TypeScript | 5.3.0 |
| Client build | Vite | 5.0.0 |
| Realtime (client) | `socket.io-client` | 4.8.3 |
| Server framework | Fastify | 4.25.0 |
| Server language | TypeScript + tsx | 5.3.0 / 4.7.0 |
| Auth (JWT) | @fastify/jwt | 8.0.1 |
| ORM | Prisma | 5.8.0 |
| Database | PostgreSQL | — |
| Password hashing | bcrypt | 6.0.0 |
| Realtime (server) | `socket.io` | 4.8.3 |

## Local Setup

### Prerequisites

- Node.js 20+
- PostgreSQL running locally (or a hosted connection string)

### 1. Clone and install

```bash
git clone https://github.com/santihdzs/Florida-Frenzy.git
cd Florida-Frenzy
npm install            # install root dependencies
npm run install:all    # install client and server dependencies
```

### 2. Configure environment variables

Create `server/.env`:

```env
DATABASE_URL="postgresql://your_user:your_password@localhost:5432/florida_frenzy"
JWT_SECRET="replace-with-a-strong-secret"
```

- `DATABASE_URL` — standard PostgreSQL connection string
- `JWT_SECRET` — any random secret; without it the server defaults to an insecure dev value and logs a warning

### 3. Set up the database

```bash
cd server
npm run db:generate   # generate the Prisma client
npm run db:migrate    # apply all migrations to your database
psql $DATABASE_URL -f prisma/sql/florida-frenzy-data.sql  # seed game data
cd ..
```

### 4. Run

```bash
# From the repo root — starts client and server concurrently
npm run dev
```

| Service | URL |
|---------|-----|
| Client (Vite) | http://localhost:5173 |
| Server (Fastify) | http://localhost:3001 |
| Health check | http://localhost:3001/health |

To run them separately:

```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
cd client && npm run dev
```

## Project Structure

```
Florida-Frenzy/
├── client/
│   ├── src/
│   │   ├── scenes/        # Phaser scenes (Boot, Menu, Run, Shop, Stats, Friends, etc.)
│   │   └── utils/         # Auth helpers, socket singleton, scene transitions
│   ├── public/            # Static assets: sprites, tilemaps, audio
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── routes/        # REST endpoints: auth, users, runs, shop, friends, cards, decks, leaderboard
│   │   ├── services/      # Business logic (deck building, user stats, clan rank)
│   │   ├── plugins/       # Fastify plugins: prisma, JWT auth, Firebase (optional)
│   │   ├── socket/        # socket.io: room manager, server-authoritative game loop
│   │   └── index.ts       # Server entry point — listens on port 3001
│   ├── prisma/
│   │   ├── schema.prisma  # Database schema (Player, Run, Deck, Card, Enemy, Friendship, …)
│   │   ├── migrations/    # Prisma migration history
│   │   └── sql/           # Raw SQL: seed data, stored procedures, views
│   └── package.json
│
├── package.json            # Root workspace scripts (install:all, dev)
└── README
```

## Team

| Name | Student ID |
|------|-----------|
| Santiago Hernandez | A01787550 |
| Manuel Montero | A01660761 |
| Yael Ordaz | A01786776 |
