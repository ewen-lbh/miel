/*
  Warnings:

  - You are about to drop the column `emailId` on the `Label` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Label" DROP CONSTRAINT "Label_emailId_fkey";

-- AlterTable
ALTER TABLE "Label" DROP COLUMN "emailId";

-- CreateTable
CREATE TABLE "_EmailToLabel" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_EmailToLabel_AB_unique" ON "_EmailToLabel"("A", "B");

-- CreateIndex
CREATE INDEX "_EmailToLabel_B_index" ON "_EmailToLabel"("B");

-- AddForeignKey
ALTER TABLE "_EmailToLabel" ADD CONSTRAINT "_EmailToLabel_A_fkey" FOREIGN KEY ("A") REFERENCES "Email"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EmailToLabel" ADD CONSTRAINT "_EmailToLabel_B_fkey" FOREIGN KEY ("B") REFERENCES "Label"("id") ON DELETE CASCADE ON UPDATE CASCADE;
