/*
* This is the main entry point for the Florida Frenzy server application.
* It sets up the Fastify server, registers plugins and routes, and starts 
* listening for incoming requests.
* The server provides various API endpoints for authentication, user management,
* game runs, leaderboards, shop interactions, friends management, and card 
* management.
*/

import Fastify from 'fastify';
import cors from '@fastify/cors';
import prismaPlugin from './plugins/prisma.js';
import authPlugin from './plugins/auth.js';
import firebasePlugin from './plugins/firebase.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import runRoutes from './routes/run.routes.js';
import leaderboardRoutes from './routes/leaderboard.routes.js';
import shopRoutes from './routes/shop.routes.js';
import friendsRoutes from './routes/friends.routes.js';
import cardRoutes from './routes/cards.routes.js';
import enemyRoutes from './routes/enemy.routes.js';
import deckRoutes from './routes/deck.routes.js';


const fastify = Fastify({ logger: true });

await fastify.register(cors, { origin: true });
await fastify.register(prismaPlugin);
await fastify.register(firebasePlugin);
await fastify.register(authPlugin);

await fastify.register(authRoutes, { prefix: '/api/auth' });
await fastify.register(userRoutes, { prefix: '/api/users' });
await fastify.register(runRoutes, { prefix: '/api/runs' });
await fastify.register(leaderboardRoutes, { prefix: '/api/leaderboard' });
await fastify.register(shopRoutes, { prefix: '/api/shop' });
await fastify.register(friendsRoutes, { prefix: '/api/friends' });
await fastify.register(cardRoutes, { prefix: '/api/cards' });
await fastify.register(enemyRoutes, { prefix: '/api/enemies' });
await fastify.register(deckRoutes, { prefix: '/api/decks' });
fastify.get('/health', async () => { // Health check endpoint to verify that the server is running
  return { status: 'ok', timestamp: new Date().toISOString() };
});

const start = async () => { // Function to start the server and listen on the specified port
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
    console.log('Server running at http://localhost:3001');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();