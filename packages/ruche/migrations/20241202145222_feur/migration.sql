/*
  Warnings:

  - Added the required column `receiverAuthId` to the `Account` table without a default value. This is not possible if the table is not empty.
  - Added the required column `defaultInboxId` to the `Address` table without a default value. This is not possible if the table is not empty.
  - Added the required column `originalSubject` to the `Email` table without a default value. This is not possible if the table is not empty.
  - Added the required column `receivedAt` to the `Email` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MailboxType" ADD VALUE 'SCREENER';
ALTER TYPE "MailboxType" ADD VALUE 'FEED';

-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "receiverAuthId" TEXT NOT NULL,
ADD COLUMN     "screenerBoxId" TEXT,
ADD COLUMN     "senderAuthId" TEXT;

-- AlterTable
ALTER TABLE "Address" ADD COLUMN     "bundled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "defaultInboxId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Email" ADD COLUMN     "originalSubject" TEXT NOT NULL,
ADD COLUMN     "receivedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "textContent" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Clip" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,

    CONSTRAINT "Clip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Signature" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "staticParts" TEXT[],
    "dynamicPartsKeys" TEXT[],
    "accountId" TEXT NOT NULL,

    CONSTRAINT "Signature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServerAuth" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT,
    "token" TEXT,

    CONSTRAINT "ServerAuth_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_screenerBoxId_fkey" FOREIGN KEY ("screenerBoxId") REFERENCES "Mailbox"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_senderAuthId_fkey" FOREIGN KEY ("senderAuthId") REFERENCES "ServerAuth"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_receiverAuthId_fkey" FOREIGN KEY ("receiverAuthId") REFERENCES "ServerAuth"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Clip" ADD CONSTRAINT "Clip_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_defaultInboxId_fkey" FOREIGN KEY ("defaultInboxId") REFERENCES "Mailbox"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Signature" ADD CONSTRAINT "Signature_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
