/*
  Warnings:

  - A unique constraint covering the columns `[messageId]` on the table `Email` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Email" ADD COLUMN     "messageId" TEXT;

-- CreateTable
CREATE TABLE "_ThreadEmails" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_ThreadEmails_AB_unique" ON "_ThreadEmails"("A", "B");

-- CreateIndex
CREATE INDEX "_ThreadEmails_B_index" ON "_ThreadEmails"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Email_messageId_key" ON "Email"("messageId");

-- AddForeignKey
ALTER TABLE "_ThreadEmails" ADD CONSTRAINT "_ThreadEmails_A_fkey" FOREIGN KEY ("A") REFERENCES "Email"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ThreadEmails" ADD CONSTRAINT "_ThreadEmails_B_fkey" FOREIGN KEY ("B") REFERENCES "Email"("id") ON DELETE CASCADE ON UPDATE CASCADE;
