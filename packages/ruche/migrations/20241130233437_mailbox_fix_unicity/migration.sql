/*
  Warnings:

  - A unique constraint covering the columns `[accountId,name,internalUidValidity]` on the table `Mailbox` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Mailbox_accountId_internalUidValidity_key";

-- DropIndex
DROP INDEX "Mailbox_accountId_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "Mailbox_accountId_name_internalUidValidity_key" ON "Mailbox"("accountId", "name", "internalUidValidity");
