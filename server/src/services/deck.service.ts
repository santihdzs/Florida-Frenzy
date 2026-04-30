/*
* Deck service for Florida Frenzy game server
* This module provides functions to manage player decks, including fetching deck data for the client, 
* saving deck configurations, and setting active decks.
* It interacts with the database using Prisma to perform necessary queries and updates 
* related to player decks and their associated cards.
*/

import type { PrismaClient, CardRarity } from '@prisma/client';
import { computeClanRank, type ClanRank } from './user.service.js';

const DECK_SLOT_LIMIT: Record<ClanRank, number> = {
  ROOKIE: 12,
  VETERAN: 15,
  ELITE: 19,
  LEGEND: 21,
};

function getDeckSlotLimit(rank: ClanRank): number {
  return DECK_SLOT_LIMIT[rank];
}

function getUnlockRankForRarity(rarity: CardRarity): ClanRank {
  if (rarity === 'BASE') return 'ROOKIE';
  if (rarity === 'EFFECT') return 'VETERAN';
  if (rarity === 'RARE') return 'ELITE';
  return 'LEGENDARY' === rarity ? 'LEGEND' : 'LEGEND';
}

function hasRankAccess(playerRank: ClanRank, requiredRank: ClanRank): boolean {
  const order: Record<ClanRank, number> = {
    ROOKIE: 0,
    VETERAN: 1,
    ELITE: 2,
    LEGEND: 3,
  };

  return order[playerRank] >= order[requiredRank];
}

export async function getDeckBootstrap(prisma: PrismaClient, playerId: number) {
  const player = await prisma.player.findUnique({
    where: { id: playerId },
    include: {
      playerCards: {
        include: { cardGame: true },
      },
      decks: {
        include: {
          deckCards: {
            include: { cardGame: true },
            orderBy: { id: 'asc' },
          },
          characterGame: true,
        },
        orderBy: { id: 'asc' },
      },
    },
  }); // fetch the player data along with their owned cards and decks, including the details of each card and character associated with the decks

  if (!player) {
    throw new Error('Player not found.');
  }

  const allCards = await prisma.cardGame.findMany({
    orderBy: { id: 'asc' },
  });

  const clanRank = computeClanRank(player.maxXp);
  const slotLimit = getDeckSlotLimit(clanRank);

  return {
    player: {
      id: player.id,
      username: player.username,
      maxXp: player.maxXp,
      clanRank,
      slotLimit,
    },
    ownedCards: player.playerCards.map(pc => ({
      cardGameId: pc.cardGameId,
      isUnlocked: pc.isUnlocked,
      numCardsOwned: pc.numCardsOwned,
      cardRarity: pc.cardGame.cardRarity,
    })),
    decks: player.decks.map(deck => ({
      id: deck.id,
      deckName: deck.deckName,
      isActive: deck.isActive,
      characterGameId: deck.characterGameId,
      cards: deck.deckCards.map(dc => ({
        id: dc.id,
        cardGameId: dc.cardGameId,
        cardsIncluded: dc.cardsIncluded,
      })),
    })),
    allCards,
  }; // return the structured data needed for the client to display the player's decks, owned cards, etc.
}

export async function saveDeck(
  prisma: PrismaClient,
  input: {
    playerId: number;
    slotIndex: number;
    characterGameId: number;
    cardGameIds: number[];
    makeActive?: boolean;
  }
) {
  const { playerId, slotIndex, characterGameId, cardGameIds, makeActive = false } = input;

  if (slotIndex < 0 || slotIndex > 2) {
    throw new Error('slotIndex must be 0, 1 or 2.');
  } // validate that the slot index is within the allowed range of 0 to 2, since players can only have 3 decks

  const player = await prisma.player.findUnique({
    where: { id: playerId },
    include: {
      playerCards: {
        include: { cardGame: true },
      },
    },
  });

  if (!player) {
    throw new Error('Player not found.');
  }

  const clanRank = computeClanRank(player.maxXp);
  const slotLimit = getDeckSlotLimit(clanRank);

  if (cardGameIds.length !== slotLimit) {
    throw new Error(`Deck must contain exactly ${slotLimit} cards.`);
  }

  const uniqueCardIds = [...new Set(cardGameIds)];
  if (uniqueCardIds.length !== cardGameIds.length) {
    throw new Error('Duplicate cards are not allowed in this deck.');
  }

  const ownedMap = new Map(
    player.playerCards.map(pc => [pc.cardGameId, pc])
  );

  const allCardsById = new Map(
    (await prisma.cardGame.findMany()).map(card => [card.id, card])
  );

  for (const cardGameId of cardGameIds) {
    const dbCard = allCardsById.get(cardGameId);

    if (!dbCard) {
      throw new Error(`Card with game ID ${cardGameId} not found.`);
    }

    const requiredRank = getUnlockRankForRarity(dbCard.cardRarity);
    if (!hasRankAccess(clanRank, requiredRank)) {
      throw new Error(`Card ${cardGameId} requires rank ${requiredRank}.`);
    }

    if (dbCard.cardRarity === 'BASE') {
      continue; // base cards are always available and don't require ownership checks
    }

    const owned = ownedMap.get(cardGameId);
    if (!owned || !owned.isUnlocked || owned.numCardsOwned < 1)  {
      throw new Error(`Card ${cardGameId} is not unlocked for this player.`);
    }
  }

  const deckName = `Deck ${slotIndex + 1}`;

  const existingDeck = await prisma.deck.findFirst({
    where: {
      playerId,
      deckName,
    },
    include: {
      deckCards: true,
    },
  });

  const savedDeck = await prisma.$transaction(async (tx) => {
    if (makeActive) {
      await tx.deck.updateMany({
        where: { playerId },
        data: { isActive: false },
      }); // if the new deck is being set as active, first set all of the player's existing decks to inactive
    }

    let deckId: number;

    if (existingDeck) {
      await tx.deck.update({
        where: { id: existingDeck.id },
        data: {
          characterGameId,
          isActive: makeActive ? true : existingDeck.isActive,
        },
      }); // if a deck already exists for the given slot, update its character and active status

      await tx.deckCard.deleteMany({
        where: { deckId: existingDeck.id },
      }); // delete all existing card associations for the deck so they can be replaced with the new set of cards

      deckId = existingDeck.id;
    } 
    
    else {
      const created = await tx.deck.create({
        data: {
          playerId,
          deckName,
          characterGameId,
          isActive: makeActive,
        },
      }); // if no deck exists for the given slot, create a new one with the specified character and active status

      deckId = created.id;
    }

    for (const cardGameId of cardGameIds) {
      await tx.deckCard.create({
        data: {
          deckId,
          cardGameId,
          cardsIncluded: 1,
        },
      }); // create a new association between the deck and each card included in the deck
    }

    return tx.deck.findUnique({
      where: { id: deckId },
      include: {
        deckCards: {
          include: { cardGame: true },
          orderBy: { id: 'asc' },
        },
        characterGame: true,
      },
    }); // after all updates are made, fetch and return the complete deck data including its cards and character for the client to use as needed
  });

  return savedDeck;
}

export async function setActiveDeck(
  prisma: PrismaClient,
  input: {
    playerId: number;
    deckId: number;
  }
) {
  const { playerId, deckId } = input;

  const deck = await prisma.deck.findFirst({
    where: {
      id: deckId,
      playerId,
    },
  }); // fetch the specified deck to ensure it belongs to the player and exists before attempting to set it as active

  if (!deck) {
    throw new Error('Deck not found for this player.');
  }

  await prisma.$transaction([
    prisma.deck.updateMany({
      where: { playerId },
      data: { isActive: false },
    }),
    prisma.deck.update({
      where: { id: deckId },
      data: { isActive: true },
    }),
  ]); // perform a transaction to first set all of the player's decks to inactive, then set the specified deck to active, ensuring that only one deck is active at a time

  return { ok: true, deckId };
}

export async function getActiveDeck(
  prisma: PrismaClient,
  playerId: number
) {
  const player = await prisma.player.findUnique({
    where: { id: playerId },
  }); // fetch the player data to compute their clan rank and determine the deck slot limit

  if (!player) {
    throw new Error('Player not found.');
  }

  const clanRank = computeClanRank(player.maxXp);
  const slotLimit = getDeckSlotLimit(clanRank);

  const activeDeck = await prisma.deck.findFirst({
    where: {
      playerId,
      isActive: true,
    },
    include: {
      deckCards: {
        include: {
          cardGame: true,
        },
        orderBy: { id: 'asc' },
      },
      characterGame: true,
    },
  }); // get the active deck for the player along with its associated cards and character

  if (!activeDeck) {
    throw new Error('No active deck found.');
  }

  if (activeDeck.deckCards.length !== slotLimit) {
    throw new Error(`Active deck is incomplete. Expected ${slotLimit} cards, found ${activeDeck.deckCards.length}.`);
  }

  return {
    deck: {
      id: activeDeck.id,
      deckName: activeDeck.deckName,
      isActive: activeDeck.isActive,
      characterGameId: activeDeck.characterGameId,
      characterName: activeDeck.characterGame.chName,
      slotLimit,
      cards: activeDeck.deckCards.map(dc => ({
        id: dc.id,
        cardGameId: dc.cardGameId,
        cardsIncluded: dc.cardsIncluded,
        card: dc.cardGame,
      })), // return the active deck data including its cards and character information, along with the slot limit based on the player's clan rank for client-side validation and display purposes
    },
  };
}