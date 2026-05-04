import type { FastifyPluginAsync } from 'fastify';
import { badRequest, notFound } from '../utils/errors.js';

interface SearchQuery {
  username?: string;
}

interface RequestBody {
  receiverId: number;
}

interface FriendshipBody {
  friendshipId: number;
}

interface FriendshipParams {
  id: string;
}

const friendsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.authenticate);

  // GET /api/friends/search?username=X
  fastify.get<{ Querystring: SearchQuery }>(
    '/search',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: { username: { type: 'string' } },
        },
      },
    },
    async (request, reply) => {
      const { username = '' } = request.query;
      const playerId = request.user.playerId;

      const players = await fastify.prisma.player.findMany({
        where: {
          username: { contains: username, mode: 'insensitive' },
          id: { not: playerId },
        },
        take: 10,
        select: { id: true, username: true, maxXp: true },
      });

      return reply.send(players);
    }
  );

  // POST /api/friends/request
  fastify.post<{ Body: RequestBody }>(
    '/request',
    {
      schema: {
        body: {
          type: 'object',
          required: ['receiverId'],
          properties: { receiverId: { type: 'integer', minimum: 1 } },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const senderId = request.user.playerId;
      const { receiverId } = request.body;

      if (senderId === receiverId) {
        return reply.code(400).send(badRequest('Cannot send friend request to yourself'));
      }

      const receiver = await fastify.prisma.player.findUnique({
        where: { id: receiverId },
        select: { id: true },
      });
      if (!receiver) {
        return reply.code(404).send(notFound('Player not found'));
      }

      const existing = await fastify.prisma.friendship.findFirst({
        where: {
          OR: [
            { senderId, receiverId },
            { senderId: receiverId, receiverId: senderId },
          ],
        },
      });
      if (existing) {
        return reply.code(400).send(badRequest('Friendship or request already exists'));
      }

      const friendship = await fastify.prisma.friendship.create({
        data: { senderId, receiverId },
        include: {
          sender:   { select: { id: true, username: true } },
          receiver: { select: { id: true, username: true } },
        },
      });

      return reply.code(201).send(friendship);
    }
  );

  // GET /api/friends/requests
  fastify.get('/requests', async (request, reply) => {
    const playerId = request.user.playerId;

    const requests = await fastify.prisma.friendship.findMany({
      where: { receiverId: playerId, status: 'PENDING' },
      include: {
        sender: { select: { id: true, username: true } },
      },
    });

    return reply.send(requests);
  });

  // POST /api/friends/accept
  fastify.post<{ Body: FriendshipBody }>(
    '/accept',
    {
      schema: {
        body: {
          type: 'object',
          required: ['friendshipId'],
          properties: { friendshipId: { type: 'integer', minimum: 1 } },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const playerId = request.user.playerId;
      const { friendshipId } = request.body;

      const friendship = await fastify.prisma.friendship.findUnique({
        where: { id: friendshipId },
      });

      if (!friendship) {
        return reply.code(404).send(notFound('Friend request not found'));
      }
      if (friendship.receiverId !== playerId) {
        return reply.code(400).send(badRequest('You are not the receiver of this request'));
      }
      if (friendship.status !== 'PENDING') {
        return reply.code(400).send(badRequest('Request is not pending'));
      }

      const updated = await fastify.prisma.friendship.update({
        where: { id: friendshipId },
        data: { status: 'ACCEPTED' },
        include: {
          sender:   { select: { id: true, username: true } },
          receiver: { select: { id: true, username: true } },
        },
      });

      return reply.send(updated);
    }
  );

  // POST /api/friends/reject
  fastify.post<{ Body: FriendshipBody }>(
    '/reject',
    {
      schema: {
        body: {
          type: 'object',
          required: ['friendshipId'],
          properties: { friendshipId: { type: 'integer', minimum: 1 } },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const playerId = request.user.playerId;
      const { friendshipId } = request.body;

      const friendship = await fastify.prisma.friendship.findUnique({
        where: { id: friendshipId },
      });

      if (!friendship) {
        return reply.code(404).send(notFound('Friend request not found'));
      }
      if (friendship.receiverId !== playerId) {
        return reply.code(400).send(badRequest('You are not the receiver of this request'));
      }
      if (friendship.status !== 'PENDING') {
        return reply.code(400).send(badRequest('Request is not pending'));
      }

      await fastify.prisma.friendship.delete({ where: { id: friendshipId } });
      return reply.send({ success: true });
    }
  );

  // GET /api/friends
  fastify.get('/', async (request, reply) => {
    const playerId = request.user.playerId;

    const friendships = await fastify.prisma.friendship.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [{ senderId: playerId }, { receiverId: playerId }],
      },
      include: {
        sender:   { select: { id: true, username: true, maxXp: true } },
        receiver: { select: { id: true, username: true, maxXp: true } },
      },
    });

    // friendships include both parties; resolve to the other person from the current player's perspective
    const friends = friendships.map(f => ({
      ...(f.senderId === playerId ? f.receiver : f.sender),
      friendshipId: f.id,
    }));

    return reply.send(friends);
  });

  // DELETE /api/friends/:id
  fastify.delete<{ Params: FriendshipParams }>('/:id', async (request, reply) => {
    const playerId = request.user.playerId;
    const friendshipId = parseInt(request.params.id, 10);

    if (isNaN(friendshipId)) {
      return reply.code(400).send(badRequest('Invalid friendship ID'));
    }

    const friendship = await fastify.prisma.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (!friendship) {
      return reply.code(404).send(notFound('Friendship not found'));
    }
    if (friendship.senderId !== playerId && friendship.receiverId !== playerId) {
      return reply.code(400).send(badRequest('You are not part of this friendship'));
    }

    await fastify.prisma.friendship.delete({ where: { id: friendshipId } });
    return reply.send({ success: true });
  });
};

export default friendsRoutes;
