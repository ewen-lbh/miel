-- DropForeignKey
ALTER TABLE "Address" DROP CONSTRAINT "Address_defaultInboxId_fkey";

-- AlterTable
ALTER TABLE "Address" ALTER COLUMN "defaultInboxId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_defaultInboxId_fkey" FOREIGN KEY ("defaultInboxId") REFERENCES "Mailbox"("id") ON DELETE SET NULL ON UPDATE CASCADE;
