/*
  Warnings:

  - You are about to drop the column `seqNum` on the `Email` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[inboxId,internalUid]` on the table `Email` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `internalUid` to the `Email` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Email_inboxId_seqNum_key";

-- AlterTable
ALTER TABLE "Email" DROP COLUMN "seqNum",
ADD COLUMN     "internalUid" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Email_inboxId_internalUid_key" ON "Email"("inboxId", "internalUid");
