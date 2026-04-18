ALTER TABLE "User"
ADD COLUMN "lastSeenAt" TIMESTAMP(3);

CREATE TABLE "Friendship" (
  "userId" TEXT NOT NULL,
  "friendId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Friendship_pkey" PRIMARY KEY ("userId", "friendId")
);

CREATE INDEX "Friendship_friendId_idx" ON "Friendship"("friendId");

ALTER TABLE "Friendship"
ADD CONSTRAINT "Friendship_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Friendship"
ADD CONSTRAINT "Friendship_friendId_fkey"
FOREIGN KEY ("friendId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
