-- AlterTable
ALTER TABLE "Match" ALTER COLUMN "id" SET DEFAULT lower(replace(gen_random_uuid()::text, '-'::text, ''::text));

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "activeGameId" TEXT,
ADD COLUMN     "activeGameSeatIndex" INTEGER;
