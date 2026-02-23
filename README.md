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

2. **Run the game:**
   ```bash
   # Single command (both frontend + backend)
   npm run dev

   # Or run separately for debugging:
   # Terminal 1 - Backend (http://localhost:3001)
   cd server && npm run dev

   # Terminal 2 - Frontend (http://localhost:5173)
   cd client && npm run dev
   ```

3. **Open in browser:** http://localhost:5173

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
