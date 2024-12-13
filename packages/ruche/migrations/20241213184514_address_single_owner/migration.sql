/*
  Warnings:

  - You are about to drop the `_AddressUsers` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `userId` to the `Address` table without a default value. This is not possible if the table is not empty.

*/


-- DropIndex
DROP INDEX "_AddressUsers_B_index";

-- DropIndex
DROP INDEX "_AddressUsers_AB_unique";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_AddressUsers";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Address" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "avatarURL" TEXT,
    "address" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "known" BOOLEAN,
    "verified" BOOLEAN,
    "bundled" BOOLEAN NOT NULL DEFAULT false,
    "defaultInboxId" TEXT,
    "lastEmailSentAt" DATETIME,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Address_defaultInboxId_fkey" FOREIGN KEY ("defaultInboxId") REFERENCES "Mailbox" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Address" ("address", "avatarURL", "bundled", "defaultInboxId", "id", "known", "lastEmailSentAt", "name", "verified") SELECT "address", "avatarURL", "bundled", "defaultInboxId", "id", "known", "lastEmailSentAt", "name", "verified" FROM "Address";
DROP TABLE "Address";
ALTER TABLE "new_Address" RENAME TO "Address";
CREATE UNIQUE INDEX "Address_address_userId_key" ON "Address"("address", "userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
