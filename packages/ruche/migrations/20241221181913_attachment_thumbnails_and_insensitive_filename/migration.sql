-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Attachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "filename" TEXT NOT NULL COLLATE NOCASE,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "textContent" TEXT NOT NULL,
    "thumbnailPath" TEXT NOT NULL DEFAULT '',
    "embedded" BOOLEAN NOT NULL DEFAULT false,
    "emailId" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    CONSTRAINT "Attachment_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Attachment" ("createdAt", "emailId", "embedded", "filename", "id", "mimeType", "size", "storagePath", "textContent", "updatedAt") SELECT "createdAt", "emailId", "embedded", "filename", "id", "mimeType", "size", "storagePath", "textContent", "updatedAt" FROM "Attachment";
DROP TABLE "Attachment";
ALTER TABLE "new_Attachment" RENAME TO "Attachment";
CREATE UNIQUE INDEX "Attachment_emailId_filename_key" ON "Attachment"("emailId", "filename");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
