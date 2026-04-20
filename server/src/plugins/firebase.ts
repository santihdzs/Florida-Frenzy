import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';
import admin from 'firebase-admin';

declare module 'fastify' {
  interface FastifyInstance {
    firebaseAdmin: typeof admin;
  }
}

const firebasePlugin: FastifyPluginAsync = fp(async (fastify) => {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!serviceAccount) {
    fastify.log.warn(
      'FIREBASE_SERVICE_ACCOUNT env var not set — Firebase auth will be unavailable'
    );
    fastify.decorate('firebaseAdmin', admin);
    return;
  }

  if (admin.apps.length === 0) {
    let parsed: object;
    try {
      parsed = JSON.parse(serviceAccount);
    } catch {
      fastify.log.warn('FIREBASE_SERVICE_ACCOUNT is not valid JSON — Firebase auth will be unavailable');
      fastify.decorate('firebaseAdmin', admin);
      return;
    }
    admin.initializeApp({
      credential: admin.credential.cert(parsed),
    });
  }

  fastify.decorate('firebaseAdmin', admin);
});

export default firebasePlugin;
