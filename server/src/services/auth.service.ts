import bcrypt from 'bcrypt';
import type { FastifyInstance } from 'fastify';
import type { Player } from '@prisma/client';
import type { DecodedIdToken } from 'firebase-admin/auth';

const BCRYPT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  return bcrypt.compare(password, storedHash);
}

export function generateToken(
  fastify: FastifyInstance,
  player: Pick<Player, 'id' | 'authProvider'>
): string {
  return fastify.jwt.sign({
    playerId: player.id,
    authProvider: player.authProvider,
  });
}

export async function verifyFirebaseToken(
  fastify: FastifyInstance,
  idToken: string
): Promise<DecodedIdToken> {
  return fastify.firebaseAdmin.auth().verifyIdToken(idToken);
}
