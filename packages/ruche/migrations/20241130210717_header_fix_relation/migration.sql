/*
  Warnings:

  - Made the column `emailId` on table `Header` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Header" DROP CONSTRAINT "Header_emailId_fkey";

-- AlterTable
ALTER TABLE "Header" ALTER COLUMN "emailId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Header" ADD CONSTRAINT "Header_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
