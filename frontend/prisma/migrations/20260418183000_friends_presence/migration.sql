-- Add a heartbeat timestamp used to compute online presence
ALTER TABLE "User"
ADD COLUMN "lastSeenAt" TIMESTAMP(3);

-- Create directional friendship edges (user -> friend)
CREATE TABLE "Friendship" (
  "userId" TEXT NOT NULL,
  "friendId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Friendship_pkey" PRIMARY KEY ("userId", "friendId")
);

-- Speed up reverse lookups by friendId.
CREATE INDEX "Friendship_friendId_idx" ON "Friendship"("friendId");

-- Keep friendship rows tied to existing users and cascade on user deletion
ALTER TABLE "Friendship"
ADD CONSTRAINT "Friendship_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Enforce friendId integrity against User table with the same cascade behavior
ALTER TABLE "Friendship"
ADD CONSTRAINT "Friendship_friendId_fkey"
FOREIGN KEY ("friendId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
