/*
  Warnings:

  - Added the required column `internalUidValidity` to the `Mailbox` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Mailbox" ADD COLUMN     "internalUidValidity" INTEGER NOT NULL;
