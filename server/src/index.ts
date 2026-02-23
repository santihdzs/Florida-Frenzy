import Fastify from 'fastify';
import cors from '@fastify/cors';

const fastify = Fastify({ logger: true });

// Register CORS
fastify.register(cors, { 
  origin: true 
});

// Health check
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Placeholder routes
fastify.get('/api/user', async (request) => {
  return { message: 'Auth endpoint - implement Firebase verification' };
});

fastify.post('/api/run', async (request) => {
  return { message: 'Run creation - implement later' };
});

fastify.get('/api/leaderboard', async (request) => {
  return { message: 'Leaderboard - implement later' };
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
