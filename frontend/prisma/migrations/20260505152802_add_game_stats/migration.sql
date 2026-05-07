-- AlterTable
ALTER TABLE "Match" ALTER COLUMN "id" SET DEFAULT lower(replace(gen_random_uuid()::text, '-'::text, ''::text));

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "handsPlayed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "losses" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "wins" INTEGER NOT NULL DEFAULT 0;
