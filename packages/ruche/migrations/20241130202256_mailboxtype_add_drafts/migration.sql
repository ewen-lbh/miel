/*
  Warnings:

  - The primary key for the `_EmailCc` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[A,B]` on the table `_EmailCc` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "_EmailCc" DROP CONSTRAINT "_EmailCc_AB_pkey";

-- CreateIndex
CREATE UNIQUE INDEX "_EmailCc_AB_unique" ON "_EmailCc"("A", "B");
