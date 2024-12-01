/*
  Warnings:

  - A unique constraint covering the columns `[inboxId,seqNum]` on the table `Email` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `seqNum` to the `Email` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Email" ADD COLUMN     "seqNum" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Email_inboxId_seqNum_key" ON "Email"("inboxId", "seqNum");
