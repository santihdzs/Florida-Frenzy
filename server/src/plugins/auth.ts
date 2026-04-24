import fp from 'fastify-plugin';
import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import fastifyJwt from '@fastify/jwt';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { playerId: number; authProvider: string };
    user: { playerId: number; authProvider: string };
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

const authPlugin: FastifyPluginAsync = fp(async (fastify) => {
  if (!process.env.JWT_SECRET) {
    fastify.log.warn('JWT_SECRET not set — using insecure default. Do NOT use in production.');
  }
  fastify.register(fastifyJwt, {
    secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
  });

  fastify.decorate(
    'authenticate',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
      } catch {
        reply
          .code(401)
          .send({ statusCode: 401, error: 'Unauthorized', message: 'Invalid or missing token' });
      }
    }
  );
});

export default authPlugin;
