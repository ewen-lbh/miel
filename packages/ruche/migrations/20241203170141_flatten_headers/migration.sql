/*
  Warnings:

  - You are about to drop the `Header` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Header" DROP CONSTRAINT "Header_emailId_fkey";

-- AlterTable
ALTER TABLE "Email" ADD COLUMN     "headers" TEXT[];

-- DropTable
DROP TABLE "Header";
