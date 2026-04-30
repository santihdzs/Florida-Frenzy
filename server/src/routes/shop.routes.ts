import type { FastifyPluginAsync } from 'fastify';
import { badRequest } from '../utils/errors.js';
import { SAFE_PLAYER_SELECT } from '../utils/playerSelect.js';
import { computeClanRank, type ClanRank } from '../services/user.service.js';
import { CardRarity } from '@prisma/client';

const CARD_COSTS: Partial<Record<CardRarity, number>> = {
  EFFECT: 1500,
  RARE: 2000,
};

const RANK_ORDER: Record<ClanRank, number> = { ROOKIE: 0, VETERAN: 1, ELITE: 2, LEGEND: 3 };

function hasRankAccessLocal(playerRank: ClanRank, requiredRank: ClanRank): boolean {
  return RANK_ORDER[playerRank] >= RANK_ORDER[requiredRank];
}

function getRequiredRankForCardRarity(rarity: CardRarity): ClanRank {
  if (rarity === 'EFFECT') return 'VETERAN';
  if (rarity === 'RARE') return 'ELITE';
  return 'LEGEND';
}

const HP_TIERS = [
  { from: 50,  to: 60,  cost: 700  },
  { from: 60,  to: 70,  cost: 1000 },
  { from: 70,  to: 80,  cost: 2500 },
  { from: 80,  to: 90,  cost: 2500 },
  { from: 90,  to: 100, cost: 3000 },
  { from: 100, to: 120, cost: 3500 },
  { from: 120, to: 140, cost: 4000 },
  { from: 140, to: 160, cost: 4500 },
  { from: 160, to: 180, cost: 5000 },
  { from: 180, to: 200, cost: 5000 },
];

const DAMAGE_TIERS = [
  { from: 10, to: 15, cost: 1000 },
  { from: 15, to: 20, cost: 2000 },
  { from: 20, to: 30, cost: 3000 },
  { from: 30, to: 50, cost: 4000 },
];

const FIRE_RATE_TIERS = [
  { from: 1, to: 2, cost: 1000 },
  { from: 2, to: 3, cost: 2000 },
  { from: 3, to: 4, cost: 3000 },
  { from: 4, to: 5, cost: 4000 },
];

const RELOAD_TIERS = [
  { from: 1, to: 2, cost: 1000 },
  { from: 2, to: 3, cost: 2000 },
  { from: 3, to: 4, cost: 3000 },
  { from: 4, to: 5, cost: 4000 },
];

const MAG_SIZE_TIERS = [
  { from: 10, to: 15, cost: 1000 },
  { from: 15, to: 20, cost: 2000 },
  { from: 20, to: 25, cost: 3000 },
  { from: 25, to: 30, cost: 4000 },
];

const STAMINA_POOL_TIERS = [
  { from: 1, to: 2, cost: 1000 },
  { from: 2, to: 3, cost: 2000 },
  { from: 3, to: 4, cost: 3000 },
  { from: 4, to: 5, cost: 4000 },
];

const STAMINA_REGEN_TIERS = [
  { from: 1, to: 2, cost: 1000 },
  { from: 2, to: 3, cost: 2000 },
  { from: 3, to: 4, cost: 3000 },
  { from: 4, to: 5, cost: 4000 },
];

const CHARACTER_CATALOG = [
  { key: 'christian', coinCost: 0,    xpRequired: 0    },
  { key: 'gavin',     coinCost: 1500, xpRequired: 1250 },
  { key: 'gustav',    coinCost: 3000, xpRequired: 2750 },
  { key: 'eddy',      coinCost: 6000, xpRequired: 4750 },
] as const;
type CharacterKey = typeof CHARACTER_CATALOG[number]['key'];

const shopRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.authenticate);

  // POST /api/shop/upgrade-hp
  fastify.post('/upgrade-hp', { schema: { body: { type: 'object', additionalProperties: false } } }, async (request, reply) => {
    const playerId = request.user.playerId;

    const player = await fastify.prisma.player.findUniqueOrThrow({
      where: { id: playerId },
      select: { maxHp: true, totalCoins: true },
    });

    const maxValue = HP_TIERS[HP_TIERS.length - 1].to;
    if (player.maxHp >= maxValue) {
      return reply.code(400).send(badRequest('Max HP reached'));
    }
    const tier = HP_TIERS.find(t => t.from === player.maxHp);
    if (!tier) {
      return reply.code(400).send(badRequest('Invalid upgrade state — contact support'));
    }

    if (player.totalCoins < tier.cost) {
      return reply.code(400).send(badRequest('Not enough coins'));
    }

    const updatedPlayer = await fastify.prisma.player.update({
      where: { id: playerId },
      data: { maxHp: tier.to, totalCoins: { decrement: tier.cost } },
      select: SAFE_PLAYER_SELECT,
    });

    return reply.send({ player: updatedPlayer });
  });

  // POST /api/shop/upgrade-damage
  fastify.post('/upgrade-damage', { schema: { body: { type: 'object', additionalProperties: false } } }, async (request, reply) => {
    const playerId = request.user.playerId;

    const player = await fastify.prisma.player.findUniqueOrThrow({
      where: { id: playerId },
      select: { bulletDamage: true, totalCoins: true },
    });

    const maxValue = DAMAGE_TIERS[DAMAGE_TIERS.length - 1].to;
    if (player.bulletDamage >= maxValue) {
      return reply.code(400).send(badRequest('Max damage reached'));
    }
    const tier = DAMAGE_TIERS.find(t => t.from === player.bulletDamage);
    if (!tier) {
      return reply.code(400).send(badRequest('Invalid upgrade state — contact support'));
    }

    if (player.totalCoins < tier.cost) {
      return reply.code(400).send(badRequest('Not enough coins'));
    }

    const updatedPlayer = await fastify.prisma.player.update({
      where: { id: playerId },
      data: { bulletDamage: tier.to, totalCoins: { decrement: tier.cost } },
      select: SAFE_PLAYER_SELECT,
    });

    return reply.send({ player: updatedPlayer });
  });

  // POST /api/shop/upgrade-fire-rate
  fastify.post('/upgrade-fire-rate', { schema: { body: { type: 'object', additionalProperties: false } } }, async (request, reply) => {
    const playerId = request.user.playerId;

    const player = await fastify.prisma.player.findUniqueOrThrow({
      where: { id: playerId },
      select: { fireRate: true, totalCoins: true },
    });

    const maxValue = FIRE_RATE_TIERS[FIRE_RATE_TIERS.length - 1].to;
    if (player.fireRate >= maxValue) {
      return reply.code(400).send(badRequest('Max fire rate reached'));
    }
    const tier = FIRE_RATE_TIERS.find(t => t.from === player.fireRate);
    if (!tier) {
      return reply.code(400).send(badRequest('Invalid upgrade state — contact support'));
    }

    if (player.totalCoins < tier.cost) {
      return reply.code(400).send(badRequest('Not enough coins'));
    }

    const updatedPlayer = await fastify.prisma.player.update({
      where: { id: playerId },
      data: { fireRate: tier.to, totalCoins: { decrement: tier.cost } },
      select: SAFE_PLAYER_SELECT,
    });

    return reply.send({ player: updatedPlayer });
  });

  // POST /api/shop/upgrade-reload-time
  fastify.post('/upgrade-reload-time', { schema: { body: { type: 'object', additionalProperties: false } } }, async (request, reply) => {
    const playerId = request.user.playerId;

    const player = await fastify.prisma.player.findUniqueOrThrow({
      where: { id: playerId },
      select: { reloadTime: true, totalCoins: true },
    });

    const maxValue = RELOAD_TIERS[RELOAD_TIERS.length - 1].to;
    if (player.reloadTime >= maxValue) {
      return reply.code(400).send(badRequest('Max reload time reached'));
    }
    const tier = RELOAD_TIERS.find(t => t.from === player.reloadTime);
    if (!tier) {
      return reply.code(400).send(badRequest('Invalid upgrade state — contact support'));
    }

    if (player.totalCoins < tier.cost) {
      return reply.code(400).send(badRequest('Not enough coins'));
    }

    const updatedPlayer = await fastify.prisma.player.update({
      where: { id: playerId },
      data: { reloadTime: tier.to, totalCoins: { decrement: tier.cost } },
      select: SAFE_PLAYER_SELECT,
    });

    return reply.send({ player: updatedPlayer });
  });

  // POST /api/shop/upgrade-no-reload
  fastify.post('/upgrade-no-reload', { schema: { body: { type: 'object', additionalProperties: false } } }, async (request, reply) => {
    const playerId = request.user.playerId;
    const NO_RELOAD_COST = 5000;

    const player = await fastify.prisma.player.findUniqueOrThrow({
      where: { id: playerId },
      select: { reloadTime: true, hasNoReload: true, totalCoins: true },
    });

    if (player.reloadTime < 5) {
      return reply.code(400).send(badRequest('Max out reload time first'));
    }

    if (player.hasNoReload) {
      return reply.code(400).send(badRequest('Already unlocked'));
    }

    if (player.totalCoins < NO_RELOAD_COST) {
      return reply.code(400).send(badRequest('Not enough coins'));
    }

    const updatedPlayer = await fastify.prisma.player.update({
      where: { id: playerId },
      data: { hasNoReload: true, totalCoins: { decrement: NO_RELOAD_COST } },
      select: SAFE_PLAYER_SELECT,
    });

    return reply.send({ player: updatedPlayer });
  });

  // POST /api/shop/upgrade-mag-size
  fastify.post('/upgrade-mag-size', { schema: { body: { type: 'object', additionalProperties: false } } }, async (request, reply) => {
    const playerId = request.user.playerId;

    const player = await fastify.prisma.player.findUniqueOrThrow({
      where: { id: playerId },
      select: { magSize: true, totalCoins: true },
    });

    const maxValue = MAG_SIZE_TIERS[MAG_SIZE_TIERS.length - 1].to;
    if (player.magSize >= maxValue) {
      return reply.code(400).send(badRequest('Max magazine size reached'));
    }
    const tier = MAG_SIZE_TIERS.find(t => t.from === player.magSize);
    if (!tier) {
      return reply.code(400).send(badRequest('Invalid upgrade state — contact support'));
    }

    if (player.totalCoins < tier.cost) {
      return reply.code(400).send(badRequest('Not enough coins'));
    }

    const updatedPlayer = await fastify.prisma.player.update({
      where: { id: playerId },
      data: { magSize: tier.to, totalCoins: { decrement: tier.cost } },
      select: SAFE_PLAYER_SELECT,
    });

    return reply.send({ player: updatedPlayer });
  });

  // POST /api/shop/upgrade-stamina-pool
  fastify.post('/upgrade-stamina-pool', { schema: { body: { type: 'object', additionalProperties: false } } }, async (request, reply) => {
    const playerId = request.user.playerId;

    const player = await fastify.prisma.player.findUniqueOrThrow({
      where: { id: playerId },
      select: { staminaPool: true, totalCoins: true },
    });

    const maxValue = STAMINA_POOL_TIERS[STAMINA_POOL_TIERS.length - 1].to;
    if (player.staminaPool >= maxValue) {
      return reply.code(400).send(badRequest('Max stamina reached'));
    }
    const tier = STAMINA_POOL_TIERS.find(t => t.from === player.staminaPool);
    if (!tier) {
      return reply.code(400).send(badRequest('Invalid upgrade state — contact support'));
    }

    if (player.totalCoins < tier.cost) {
      return reply.code(400).send(badRequest('Not enough coins'));
    }

    const updatedPlayer = await fastify.prisma.player.update({
      where: { id: playerId },
      data: { staminaPool: tier.to, totalCoins: { decrement: tier.cost } },
      select: SAFE_PLAYER_SELECT,
    });

    return reply.send({ player: updatedPlayer });
  });

  // POST /api/shop/upgrade-stamina-regen
  fastify.post('/upgrade-stamina-regen', { schema: { body: { type: 'object', additionalProperties: false } } }, async (request, reply) => {
    const playerId = request.user.playerId;

    const player = await fastify.prisma.player.findUniqueOrThrow({
      where: { id: playerId },
      select: { staminaRegen: true, totalCoins: true },
    });

    const maxValue = STAMINA_REGEN_TIERS[STAMINA_REGEN_TIERS.length - 1].to;
    if (player.staminaRegen >= maxValue) {
      return reply.code(400).send(badRequest('Max stamina recovery reached'));
    }
    const tier = STAMINA_REGEN_TIERS.find(t => t.from === player.staminaRegen);
    if (!tier) {
      return reply.code(400).send(badRequest('Invalid upgrade state — contact support'));
    }

    if (player.totalCoins < tier.cost) {
      return reply.code(400).send(badRequest('Not enough coins'));
    }

    const updatedPlayer = await fastify.prisma.player.update({
      where: { id: playerId },
      data: { staminaRegen: tier.to, totalCoins: { decrement: tier.cost } },
      select: SAFE_PLAYER_SELECT,
    });

    return reply.send({ player: updatedPlayer });
  });
  // POST /api/shop/buy-character
  fastify.post<{ Body: { characterKey: string } }>(
    '/buy-character',
    {
      schema: {
        body: {
          type: 'object',
          required: ['characterKey'],
          properties: { characterKey: { type: 'string' } },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const playerId = request.user.playerId;
      const { characterKey } = request.body;

      const catalog = CHARACTER_CATALOG.find(c => c.key === characterKey);
      if (!catalog) {
        return reply.code(400).send(badRequest('Unknown character'));
      }

      const player = await fastify.prisma.player.findUniqueOrThrow({
        where: { id: playerId },
        select: { totalCoins: true, maxXp: true, unlockedCharacters: true },
      });

      if (player.unlockedCharacters.includes(characterKey)) {
        return reply.code(400).send(badRequest('Character already unlocked'));
      }

      if (player.maxXp < catalog.xpRequired) {
        return reply.code(400).send(badRequest(`Not enough XP — need ${catalog.xpRequired}`));
      }

      if (player.totalCoins < catalog.coinCost) {
        return reply.code(400).send(badRequest('Not enough coins'));
      }

      const updatedPlayer = await fastify.prisma.player.update({
        where: { id: playerId },
        data: {
          totalCoins: { decrement: catalog.coinCost },
          unlockedCharacters: { push: characterKey },
        },
        select: SAFE_PLAYER_SELECT,
      });

      return reply.send({ player: updatedPlayer });
    }
  );

  // POST /api/shop/equip-character
  fastify.post<{ Body: { characterKey: string } }>(
    '/equip-character',
    {
      schema: {
        body: {
          type: 'object',
          required: ['characterKey'],
          properties: { characterKey: { type: 'string' } },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const playerId = request.user.playerId;
      const { characterKey } = request.body;

      const validKeys: CharacterKey[] = CHARACTER_CATALOG.map(c => c.key);
      if (!validKeys.includes(characterKey as CharacterKey)) {
        return reply.code(400).send(badRequest('Unknown character'));
      }

      const player = await fastify.prisma.player.findUniqueOrThrow({
        where: { id: playerId },
        select: { unlockedCharacters: true },
      });

      if (!player.unlockedCharacters.includes(characterKey)) {
        return reply.code(400).send(badRequest('Character not unlocked'));
      }

      const updatedPlayer = await fastify.prisma.player.update({
        where: { id: playerId },
        data: { equippedCharacter: characterKey },
        select: SAFE_PLAYER_SELECT,
      });

      return reply.send({ player: updatedPlayer });
    }
  );

  // POST /api/shop/buy-card
  fastify.post<{ Body: { cardGameId: number } }>(
    '/buy-card',
    {
      schema: {
        body: {
          type: 'object',
          required: ['cardGameId'],
          additionalProperties: false,
          properties: { cardGameId: { type: 'integer', minimum: 1 } },
        },
      },
    },
    async (request, reply) => {
      const playerId = request.user.playerId;
      const { cardGameId } = request.body;

      const player = await fastify.prisma.player.findUnique({
        where: { id: playerId },
        select: { id: true, maxXp: true, totalCoins: true },
      });
      if (!player) throw badRequest('Player not found.');

      const card = await fastify.prisma.cardGame.findUnique({ where: { id: cardGameId } });
      if (!card) throw badRequest('Card not found.');

      if (card.cardRarity === 'BASE') throw badRequest('Base cards are already unlocked by default.');
      if (card.cardRarity === 'LEGENDARY') throw badRequest('Legendary cards cannot be bought in the shop.');

      const requiredRank = getRequiredRankForCardRarity(card.cardRarity);
      const playerRank = computeClanRank(player.maxXp);
      if (!hasRankAccessLocal(playerRank, requiredRank)) {
        throw badRequest(`This card requires rank ${requiredRank}.`);
      }

      const cost = CARD_COSTS[card.cardRarity];
      if (!cost) throw badRequest('This card cannot be bought.');
      if (player.totalCoins < cost) throw badRequest('Not enough coins.');

      const existing = await fastify.prisma.playerCard.findFirst({ where: { playerId, cardGameId } });
      if (existing?.isUnlocked && existing.numCardsOwned > 0) throw badRequest('You already own this card.');

      const updatedPlayer = await fastify.prisma.$transaction(async (tx) => {
        await tx.player.update({ where: { id: playerId }, data: { totalCoins: { decrement: cost } } });
        if (existing) {
          await tx.playerCard.update({
            where: { id: existing.id },
            data: { isUnlocked: true, numCardsOwned: Math.max(existing.numCardsOwned, 1) },
          });
        } else {
          await tx.playerCard.create({ data: { playerId, cardGameId, isUnlocked: true, numCardsOwned: 1 } });
        }
        return tx.player.findUnique({ where: { id: playerId }, select: SAFE_PLAYER_SELECT });
      });

      return reply.send({ ok: true, player: updatedPlayer, boughtCardId: cardGameId });
    }
  );
};

export default shopRoutes;
