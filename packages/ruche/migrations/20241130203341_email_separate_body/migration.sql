/*
  Warnings:

  - You are about to drop the column `body` on the `Email` table. All the data in the column will be lost.
  - Added the required column `htmlBody` to the `Email` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rawBody` to the `Email` table without a default value. This is not possible if the table is not empty.
  - Added the required column `textBody` to the `Email` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Email" DROP COLUMN "body",
ADD COLUMN     "htmlBody" TEXT NOT NULL,
ADD COLUMN     "rawBody" TEXT NOT NULL,
ADD COLUMN     "textBody" TEXT NOT NULL;
