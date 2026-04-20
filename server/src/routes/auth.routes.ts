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
import { conflict, badRequest, unauthorized } from '../utils/errors.js';
import { SAFE_PLAYER_SELECT } from '../utils/playerSelect.js';

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
        select: SAFE_PLAYER_SELECT,
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

      const playerWithPw = await fastify.prisma.player.findUnique({
        where: { email },
        select: { id: true, passwordHash: true, authProvider: true },
      });
      if (!playerWithPw || !playerWithPw.passwordHash) {
        return reply.code(401).send(unauthorized('Invalid credentials'));
      }

      const valid = await verifyPassword(passwordHash, playerWithPw.passwordHash);
      if (!valid) {
        return reply.code(401).send(unauthorized('Invalid credentials'));
      }

      const safePlayer = await fastify.prisma.player.update({
        where: { id: playerWithPw.id },
        data: { lastLogin: new Date() },
        select: SAFE_PLAYER_SELECT,
      });

      const token = generateToken(fastify, playerWithPw);
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
        return reply.code(401).send(unauthorized('Invalid Firebase token'));
      }

      let safePlayer;
      const existing = await fastify.prisma.player.findUnique({
        where: { firebaseUid: decoded.uid },
        select: { id: true, authProvider: true },
      });

      if (!existing) {
        const email = decoded.email ?? `firebase_${decoded.uid}@firebase.local`;
        const rawUsername =
          decoded.name?.replace(/\s+/g, '_').slice(0, 30) ?? `user_${decoded.uid.slice(0, 12)}`;
        const usernameExists = await fastify.prisma.player.findUnique({
          where: { username: rawUsername },
        });
        const username = usernameExists
          ? `${rawUsername}_${Date.now()}`.slice(0, 30)
          : rawUsername;

        safePlayer = await fastify.prisma.player.create({
          data: { firebaseUid: decoded.uid, email, username, authProvider: 'FIREBASE' },
          select: SAFE_PLAYER_SELECT,
        });
      } else {
        safePlayer = await fastify.prisma.player.update({
          where: { id: existing.id },
          data: { lastLogin: new Date() },
          select: SAFE_PLAYER_SELECT,
        });
      }

      const token = generateToken(fastify, { id: safePlayer.id, authProvider: safePlayer.authProvider });
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
        return reply.code(401).send(unauthorized('Invalid Firebase token'));
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
        select: SAFE_PLAYER_SELECT,
      });

      return reply.send({ player: updated });
    }
  );
};

export default authRoutes;
