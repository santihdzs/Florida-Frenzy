import type { FastifyPluginAsync } from 'fastify';
import {
  registerSchema,
  loginSchema,
  firebaseLoginSchema,
} from '../schemas/auth.schema.js';
import {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyFirebaseToken,
} from '../services/auth.service.js';
import { conflict, badRequest } from '../utils/errors.js';

interface RegisterBody {
  username: string;
  email: string;
  passwordHash: string;
}

interface LoginBody {
  email: string;
  passwordHash: string;
}

interface FirebaseLoginBody {
  idToken: string;
}

const authRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /api/auth/register
  fastify.post<{ Body: RegisterBody }>(
    '/register',
    { schema: registerSchema },
    async (request, reply) => {
      const { username, email, passwordHash } = request.body;

      const existing = await fastify.prisma.player.findFirst({
        where: { OR: [{ email }, { username }] },
      });
      if (existing) {
        return reply.code(409).send(conflict('Email or username already in use'));
      }

      const hashed = await hashPassword(passwordHash);
      const player = await fastify.prisma.player.create({
        data: { username, email, passwordHash: hashed, authProvider: 'LOCAL' },
        select: {
          id: true,
          username: true,
          email: true,
          maxXp: true,
          totalCoins: true,
          maxHp: true,
          isAdmin: true,
          authProvider: true,
          firebaseUid: true,
          firstLogin: true,
          lastLogin: true,
        },
      });

      const token = generateToken(fastify, player);
      return reply.code(201).send({ token, player });
    }
  );

  // POST /api/auth/login
  fastify.post<{ Body: LoginBody }>(
    '/login',
    { schema: loginSchema },
    async (request, reply) => {
      const { email, passwordHash } = request.body;

      const player = await fastify.prisma.player.findUnique({ where: { email } });
      if (!player) {
        return reply
          .code(401)
          .send({ statusCode: 401, error: 'Unauthorized', message: 'Invalid credentials' });
      }

      if (!player.passwordHash) {
        return reply
          .code(400)
          .send(badRequest('This account uses Firebase login — no password set'));
      }

      const valid = await verifyPassword(passwordHash, player.passwordHash);
      if (!valid) {
        return reply
          .code(401)
          .send({ statusCode: 401, error: 'Unauthorized', message: 'Invalid credentials' });
      }

      await fastify.prisma.player.update({
        where: { id: player.id },
        data: { lastLogin: new Date() },
      });

      const { passwordHash: _pw, ...safePlayer } = player;
      const token = generateToken(fastify, player);
      return reply.send({ token, player: safePlayer });
    }
  );

  // POST /api/auth/firebase-login
  fastify.post<{ Body: FirebaseLoginBody }>(
    '/firebase-login',
    { schema: firebaseLoginSchema },
    async (request, reply) => {
      const { idToken } = request.body;

      let decoded;
      try {
        decoded = await verifyFirebaseToken(fastify, idToken);
      } catch {
        return reply
          .code(401)
          .send({ statusCode: 401, error: 'Unauthorized', message: 'Invalid Firebase token' });
      }

      let player = await fastify.prisma.player.findUnique({
        where: { firebaseUid: decoded.uid },
      });

      if (!player) {
        const email = decoded.email ?? `${decoded.uid}@firebase.local`;
        const rawUsername =
          decoded.name?.replace(/\s+/g, '_').slice(0, 30) ?? `user_${decoded.uid.slice(0, 12)}`;
        const usernameExists = await fastify.prisma.player.findUnique({
          where: { username: rawUsername },
        });
        const username = usernameExists
          ? `${rawUsername}_${Date.now()}`.slice(0, 30)
          : rawUsername;

        player = await fastify.prisma.player.create({
          data: { firebaseUid: decoded.uid, email, username, authProvider: 'FIREBASE' },
        });
      } else {
        await fastify.prisma.player.update({
          where: { id: player.id },
          data: { lastLogin: new Date() },
        });
      }

      const { passwordHash: _pw, ...safePlayer } = player;
      const token = generateToken(fastify, player);
      return reply.send({ token, player: safePlayer });
    }
  );

  // POST /api/auth/link-firebase — requires auth
  fastify.post<{ Body: FirebaseLoginBody }>(
    '/link-firebase',
    { preHandler: [fastify.authenticate], schema: firebaseLoginSchema },
    async (request, reply) => {
      const { idToken } = request.body;

      let decoded;
      try {
        decoded = await verifyFirebaseToken(fastify, idToken);
      } catch {
        return reply
          .code(401)
          .send({ statusCode: 401, error: 'Unauthorized', message: 'Invalid Firebase token' });
      }

      const existing = await fastify.prisma.player.findUnique({
        where: { firebaseUid: decoded.uid },
      });
      if (existing && existing.id !== request.user.playerId) {
        return reply
          .code(409)
          .send(conflict('Firebase account already linked to another player'));
      }

      const updated = await fastify.prisma.player.update({
        where: { id: request.user.playerId },
        data: { firebaseUid: decoded.uid, authProvider: 'BOTH' },
        select: {
          id: true,
          username: true,
          email: true,
          maxXp: true,
          totalCoins: true,
          maxHp: true,
          isAdmin: true,
          authProvider: true,
          firebaseUid: true,
          firstLogin: true,
          lastLogin: true,
        },
      });

      return reply.send({ player: updated });
    }
  );
};

export default authRoutes;
