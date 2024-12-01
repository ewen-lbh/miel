/*
  Warnings:

  - A unique constraint covering the columns `[accountId,internalUidValidity]` on the table `Mailbox` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Mailbox_accountId_internalUidValidity_key" ON "Mailbox"("accountId", "internalUidValidity");
