import type { FastifyPluginAsync } from 'fastify';

type CharacterGameRow = {
  id: number;
  chName: string;
  chDesc: string | null;
  baseHp: number;
  baseAttack: number;
  baseDefense: number;
  chUltimate: string;
  chUltimateDesc: string | null;
  isDefaultUnlocked: boolean;
};

type CharacterResponse = CharacterGameRow & {
  characterKey: string;
};

function toCharacterKey(chName: string): string {
  return chName.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function mapCharacter(character: CharacterGameRow): CharacterResponse {
  return {
    ...character,
    characterKey: toCharacterKey(character.chName),
  };
}

const characterRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async () => {
    const characters = await fastify.prisma.characterGame.findMany({
      orderBy: { id: 'asc' },
    });

    return characters.map(mapCharacter);
  });

  fastify.get<{ Params: { characterKey: string } }>('/:characterKey', async (request, reply) => {
    const characterKey = request.params.characterKey.toLowerCase();

    const characters = await fastify.prisma.characterGame.findMany({
      orderBy: { id: 'asc' },
    });

    const character = characters.find((entry) => toCharacterKey(entry.chName) === characterKey);

    if (!character) {
      return reply.code(404).send({ message: 'Character not found' });
    }

    return mapCharacter(character);
  });
};

export default characterRoutes;