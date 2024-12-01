/*
  Warnings:

  - Made the column `name` on table `Mailbox` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Mailbox" ALTER COLUMN "name" SET NOT NULL;
