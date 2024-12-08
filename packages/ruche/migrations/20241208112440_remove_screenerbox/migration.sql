/*
  Warnings:

  - The values [SCREENER] on the enum `MailboxType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `screenerBoxId` on the `Account` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "MailboxType_new" AS ENUM ('INBOX', 'TRASHBOX', 'SENTBOX', 'DRAFTS', 'FEED');
ALTER TABLE "Mailbox" ALTER COLUMN "type" TYPE "MailboxType_new" USING ("type"::text::"MailboxType_new");
ALTER TYPE "MailboxType" RENAME TO "MailboxType_old";
ALTER TYPE "MailboxType_new" RENAME TO "MailboxType";
DROP TYPE "MailboxType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Account" DROP CONSTRAINT "Account_screenerBoxId_fkey";

-- AlterTable
ALTER TABLE "Account" DROP COLUMN "screenerBoxId";
