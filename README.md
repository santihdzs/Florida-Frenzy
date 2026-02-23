# Florida Frenzy

A turn-based roguelite card battler built with a modern web stack.

## Tech Stack

### Frontend
- **Phaser 3** — Game engine for rendering, animations, and client-side combat logic
- **TypeScript** — Type-safe JavaScript
- **Vite** — Fast build tool and dev server

### Backend
- **Node.js** — Runtime
- **Fastify** — Web framework (TypeScript)
- **Firebase Auth** — Google Sign-In authentication
- **PostgreSQL** — Database
- **Prisma** — ORM for database operations

## Repository Structure

```
Florida-Frenzy/
├── client/                 # Frontend (Phaser 3 + Vite)
│   ├── src/
│   │   ├── scenes/        # Phaser scenes (Boot, Menu, Combat, etc.)
│   │   ├── components/    # Reusable game components
│   │   ├── utils/         # Helpers, constants, types
│   │   └── index.ts       # Entry point
│   ├── public/            # Static assets
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
│
├── server/                 # Backend (Fastify + Prisma)
│   ├── src/
│   │   ├── routes/        # API endpoints
│   │   ├── services/      # Business logic
│   │   ├── middleware/    # Auth, error handling
│   │   ├── types/         # TypeScript types
│   │   └── index.ts       # Entry point
│   ├── prisma/
│   │   └── schema.prisma  # Database schema
│   └── package.json
│
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL (local or hosted)
- Firebase project (for Auth)

### Setup

1. **Clone and install all dependencies:**
   ```bash
   npm run install:all
   ```

2. **Configure environment:**

   Create `server/.env`:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/florida_frenzy"
   FIREBASE_PROJECT_ID="your-project-id"
   JWT_SECRET="your-secret"
   ```

   Create `client/.env`:
   ```env
   VITE_API_URL="http://localhost:3001"
   VITE_FIREBASE_PROJECT_ID="your-project-id"
   ```

3. **Set up database:**
   ```bash
   cd server
   npx prisma migrate dev --name init
   ```

4. **Run development servers:**
   ```bash
   npm run dev
   ```

5. **Open in browser:** http://localhost:5173

## Game Overview

Florida Frenzy is a turn-based roguelite card battler featuring:
- 1v1 Pokémon-style encounters
- Elemental strengths/weaknesses system
- Simultaneous decision mind games
- Infinite scaling difficulty
- Meta progression between runs

## Development Notes

- All game logic should be deterministic and live in shared types/utils
- Backend verifies all actions; frontend handles rendering
- Combat resolution happens server-side for multiplayer support
