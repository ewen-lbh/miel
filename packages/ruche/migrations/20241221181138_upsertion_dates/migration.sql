-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mainboxId" TEXT,
    "trashboxId" TEXT,
    "sentboxId" TEXT,
    "draftsboxId" TEXT,
    "senderServerId" TEXT,
    "senderAuthId" TEXT,
    "receiverServerId" TEXT NOT NULL,
    "receiverAuthId" TEXT NOT NULL,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Account_mainboxId_fkey" FOREIGN KEY ("mainboxId") REFERENCES "Mailbox" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Account_trashboxId_fkey" FOREIGN KEY ("trashboxId") REFERENCES "Mailbox" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Account_sentboxId_fkey" FOREIGN KEY ("sentboxId") REFERENCES "Mailbox" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Account_draftsboxId_fkey" FOREIGN KEY ("draftsboxId") REFERENCES "Mailbox" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Account_senderServerId_fkey" FOREIGN KEY ("senderServerId") REFERENCES "Server" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Account_senderAuthId_fkey" FOREIGN KEY ("senderAuthId") REFERENCES "ServerAuth" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Account_receiverServerId_fkey" FOREIGN KEY ("receiverServerId") REFERENCES "Server" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Account_receiverAuthId_fkey" FOREIGN KEY ("receiverAuthId") REFERENCES "ServerAuth" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Account" ("address", "draftsboxId", "id", "mainboxId", "name", "receiverAuthId", "receiverServerId", "senderAuthId", "senderServerId", "sentboxId", "trashboxId", "userId") SELECT "address", "draftsboxId", "id", "mainboxId", "name", "receiverAuthId", "receiverServerId", "senderAuthId", "senderServerId", "sentboxId", "trashboxId", "userId" FROM "Account";
DROP TABLE "Account";
ALTER TABLE "new_Account" RENAME TO "Account";
CREATE UNIQUE INDEX "Account_address_key" ON "Account"("address");
CREATE TABLE "new_Address" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "avatarURL" TEXT,
    "address" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "known" BOOLEAN,
    "verified" BOOLEAN,
    "bundled" BOOLEAN NOT NULL DEFAULT false,
    "defaultInboxId" TEXT,
    "lastEmailSentAt" DATETIME,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Address_defaultInboxId_fkey" FOREIGN KEY ("defaultInboxId") REFERENCES "Mailbox" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Address" ("address", "avatarURL", "bundled", "defaultInboxId", "id", "known", "lastEmailSentAt", "name", "userId", "verified") SELECT "address", "avatarURL", "bundled", "defaultInboxId", "id", "known", "lastEmailSentAt", "name", "userId", "verified" FROM "Address";
DROP TABLE "Address";
ALTER TABLE "new_Address" RENAME TO "Address";
CREATE UNIQUE INDEX "Address_address_userId_key" ON "Address"("address", "userId");
CREATE TABLE "new_Attachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "textContent" TEXT NOT NULL,
    "embedded" BOOLEAN NOT NULL DEFAULT false,
    "emailId" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    CONSTRAINT "Attachment_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Attachment" ("emailId", "embedded", "filename", "id", "mimeType", "size", "storagePath", "textContent") SELECT "emailId", "embedded", "filename", "id", "mimeType", "size", "storagePath", "textContent" FROM "Attachment";
DROP TABLE "Attachment";
ALTER TABLE "new_Attachment" RENAME TO "Attachment";
CREATE UNIQUE INDEX "Attachment_emailId_filename_key" ON "Attachment"("emailId", "filename");
CREATE TABLE "new_Clip" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "text" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emailId" TEXT NOT NULL,
    CONSTRAINT "Clip_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Clip" ("emailId", "id", "text") SELECT "emailId", "id", "text" FROM "Clip";
DROP TABLE "Clip";
ALTER TABLE "new_Clip" RENAME TO "Clip";
CREATE TABLE "new_Device" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notificationsToken" TEXT NOT NULL,
    CONSTRAINT "Device_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Device" ("id", "notificationsToken", "userId") SELECT "id", "notificationsToken", "userId" FROM "Device";
DROP TABLE "Device";
ALTER TABLE "new_Device" RENAME TO "Device";
CREATE TABLE "new_Email" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
INSERT INTO "new_Email" ("headers", "htmlBody", "id", "inboxId", "internalUid", "messageId", "originalSubject", "processed", "rawBody", "receivedAt", "receiverId", "recipientId", "senderId", "subject", "textBody", "trusted") SELECT "headers", "htmlBody", "id", "inboxId", "internalUid", "messageId", "originalSubject", "processed", "rawBody", "receivedAt", "receiverId", "recipientId", "senderId", "subject", "textBody", "trusted" FROM "Email";
DROP TABLE "Email";
ALTER TABLE "new_Email" RENAME TO "Email";
CREATE UNIQUE INDEX "Email_messageId_key" ON "Email"("messageId");
CREATE UNIQUE INDEX "Email_inboxId_internalUid_key" ON "Email"("inboxId", "internalUid");
CREATE TABLE "new_Label" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "key" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Label_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Label" ("color", "id", "key", "text", "userId") SELECT "color", "id", "key", "text", "userId" FROM "Label";
DROP TABLE "Label";
ALTER TABLE "new_Label" RENAME TO "Label";
CREATE TABLE "new_Mailbox" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "internalUidValidity" INTEGER NOT NULL,
    "accountId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "main" BOOLEAN,
    CONSTRAINT "Mailbox_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Mailbox" ("accountId", "id", "internalUidValidity", "main", "name", "type") SELECT "accountId", "id", "internalUidValidity", "main", "name", "type" FROM "Mailbox";
DROP TABLE "Mailbox";
ALTER TABLE "new_Mailbox" RENAME TO "Mailbox";
CREATE UNIQUE INDEX "Mailbox_accountId_name_internalUidValidity_key" ON "Mailbox"("accountId", "name", "internalUidValidity");
CREATE TABLE "new_Server" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL,
    "secure" BOOLEAN NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT,
    "token" TEXT,
    "type" TEXT NOT NULL
);
INSERT INTO "new_Server" ("host", "id", "password", "port", "secure", "token", "type", "username") SELECT "host", "id", "password", "port", "secure", "token", "type", "username" FROM "Server";
DROP TABLE "Server";
ALTER TABLE "new_Server" RENAME TO "Server";
CREATE TABLE "new_ServerAuth" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "username" TEXT NOT NULL,
    "password" TEXT,
    "token" TEXT
);
INSERT INTO "new_ServerAuth" ("id", "password", "token", "username") SELECT "id", "password", "token", "username" FROM "ServerAuth";
DROP TABLE "ServerAuth";
ALTER TABLE "new_ServerAuth" RENAME TO "ServerAuth";
CREATE TABLE "new_Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Session" ("expiresAt", "id", "userId") SELECT "expiresAt", "id", "userId" FROM "Session";
DROP TABLE "Session";
ALTER TABLE "new_Session" RENAME TO "Session";
CREATE TABLE "new_Signature" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "staticParts" TEXT NOT NULL,
    "dynamicPartsKeys" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    CONSTRAINT "Signature_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Signature" ("accountId", "dynamicPartsKeys", "id", "name", "staticParts") SELECT "accountId", "dynamicPartsKeys", "id", "name", "staticParts" FROM "Signature";
DROP TABLE "Signature";
ALTER TABLE "new_Signature" RENAME TO "Signature";
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("email", "id", "passwordHash") SELECT "email", "id", "passwordHash" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
