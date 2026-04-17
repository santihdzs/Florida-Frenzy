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

fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
    console.log('Server running at http://localhost:3001');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();