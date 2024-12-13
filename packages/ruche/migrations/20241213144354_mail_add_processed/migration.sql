-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Email" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "internalUid" INTEGER NOT NULL,
    "messageId" TEXT,
    "receivedAt" DATETIME NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "originalSubject" TEXT NOT NULL,
    "textBody" TEXT NOT NULL,
    "htmlBody" TEXT NOT NULL,
    "rawBody" TEXT NOT NULL,
    "headers" TEXT NOT NULL,
    "inboxId" TEXT NOT NULL,
    "trusted" BOOLEAN NOT NULL,
    "receiverId" TEXT,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Email_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "Address" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Email_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "Address" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Email_inboxId_fkey" FOREIGN KEY ("inboxId") REFERENCES "Mailbox" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Email_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "Server" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Email" ("headers", "htmlBody", "id", "inboxId", "internalUid", "messageId", "originalSubject", "rawBody", "receivedAt", "receiverId", "recipientId", "senderId", "subject", "textBody", "trusted") SELECT "headers", "htmlBody", "id", "inboxId", "internalUid", "messageId", "originalSubject", "rawBody", "receivedAt", "receiverId", "recipientId", "senderId", "subject", "textBody", "trusted" FROM "Email";
DROP TABLE "Email";
ALTER TABLE "new_Email" RENAME TO "Email";
CREATE UNIQUE INDEX "Email_messageId_key" ON "Email"("messageId");
CREATE UNIQUE INDEX "Email_inboxId_internalUid_key" ON "Email"("inboxId", "internalUid");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
