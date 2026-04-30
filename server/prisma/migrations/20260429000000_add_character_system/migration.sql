ALTER TABLE "Player" ADD COLUMN "equippedCharacter" TEXT NOT NULL DEFAULT 'christian';
ALTER TABLE "Player" ADD COLUMN "unlockedCharacters" TEXT[] NOT NULL DEFAULT ARRAY['christian']::TEXT[];
