-- Add explicit approval state so requests can be pending before becoming friends
ALTER TABLE "Friendship"
ADD COLUMN "accepted" BOOLEAN NOT NULL DEFAULT false;
