/*
  Warnings:

  - A unique constraint covering the columns `[accountId,name]` on the table `Mailbox` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Mailbox_accountId_name_key" ON "Mailbox"("accountId", "name");
