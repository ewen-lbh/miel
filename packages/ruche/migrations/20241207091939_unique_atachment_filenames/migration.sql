/*
  Warnings:

  - A unique constraint covering the columns `[emailId,filename]` on the table `Attachment` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Attachment_emailId_filename_key" ON "Attachment"("emailId", "filename");
