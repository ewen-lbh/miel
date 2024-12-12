/*
  Warnings:

  - Added the required column `userId` to the `Account` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Label` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_EmailUsers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_EmailUsers_A_fkey" FOREIGN KEY ("A") REFERENCES "Email" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_EmailUsers_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_AddressUsers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_AddressUsers_A_fkey" FOREIGN KEY ("A") REFERENCES "Address" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_AddressUsers_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mainboxId" TEXT,
    "trashboxId" TEXT,
    "sentboxId" TEXT,
    "draftsboxId" TEXT,
    "senderServerId" TEXT,
    "senderAuthId" TEXT,
    "receiverServerId" TEXT NOT NULL,
    "receiverAuthId" TEXT NOT NULL,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Account_mainboxId_fkey" FOREIGN KEY ("mainboxId") REFERENCES "Mailbox" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Account_trashboxId_fkey" FOREIGN KEY ("trashboxId") REFERENCES "Mailbox" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Account_sentboxId_fkey" FOREIGN KEY ("sentboxId") REFERENCES "Mailbox" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Account_draftsboxId_fkey" FOREIGN KEY ("draftsboxId") REFERENCES "Mailbox" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Account_senderServerId_fkey" FOREIGN KEY ("senderServerId") REFERENCES "Server" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Account_senderAuthId_fkey" FOREIGN KEY ("senderAuthId") REFERENCES "ServerAuth" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Account_receiverServerId_fkey" FOREIGN KEY ("receiverServerId") REFERENCES "Server" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Account_receiverAuthId_fkey" FOREIGN KEY ("receiverAuthId") REFERENCES "ServerAuth" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Account" ("address", "draftsboxId", "id", "mainboxId", "name", "receiverAuthId", "receiverServerId", "senderAuthId", "senderServerId", "sentboxId", "trashboxId") SELECT "address", "draftsboxId", "id", "mainboxId", "name", "receiverAuthId", "receiverServerId", "senderAuthId", "senderServerId", "sentboxId", "trashboxId" FROM "Account";
DROP TABLE "Account";
ALTER TABLE "new_Account" RENAME TO "Account";
CREATE UNIQUE INDEX "Account_address_key" ON "Account"("address");
CREATE TABLE "new_Label" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Label_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Label" ("color", "id", "key", "text") SELECT "color", "id", "key", "text" FROM "Label";
DROP TABLE "Label";
ALTER TABLE "new_Label" RENAME TO "Label";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "_EmailUsers_AB_unique" ON "_EmailUsers"("A", "B");

-- CreateIndex
CREATE INDEX "_EmailUsers_B_index" ON "_EmailUsers"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_AddressUsers_AB_unique" ON "_AddressUsers"("A", "B");

-- CreateIndex
CREATE INDEX "_AddressUsers_B_index" ON "_AddressUsers"("B");
