-- DropForeignKey
ALTER TABLE "Account" DROP CONSTRAINT "Account_draftsboxId_fkey";

-- DropForeignKey
ALTER TABLE "Account" DROP CONSTRAINT "Account_mainboxId_fkey";

-- DropForeignKey
ALTER TABLE "Account" DROP CONSTRAINT "Account_senderServerId_fkey";

-- DropForeignKey
ALTER TABLE "Account" DROP CONSTRAINT "Account_sentboxId_fkey";

-- DropForeignKey
ALTER TABLE "Account" DROP CONSTRAINT "Account_trashboxId_fkey";

-- AlterTable
ALTER TABLE "Account" ALTER COLUMN "mainboxId" DROP NOT NULL,
ALTER COLUMN "trashboxId" DROP NOT NULL,
ALTER COLUMN "sentboxId" DROP NOT NULL,
ALTER COLUMN "senderServerId" DROP NOT NULL,
ALTER COLUMN "draftsboxId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_mainboxId_fkey" FOREIGN KEY ("mainboxId") REFERENCES "Mailbox"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_trashboxId_fkey" FOREIGN KEY ("trashboxId") REFERENCES "Mailbox"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_sentboxId_fkey" FOREIGN KEY ("sentboxId") REFERENCES "Mailbox"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_draftsboxId_fkey" FOREIGN KEY ("draftsboxId") REFERENCES "Mailbox"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_senderServerId_fkey" FOREIGN KEY ("senderServerId") REFERENCES "Server"("id") ON DELETE SET NULL ON UPDATE CASCADE;
