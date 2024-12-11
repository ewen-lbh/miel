-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "Account_mainboxId_fkey" FOREIGN KEY ("mainboxId") REFERENCES "Mailbox" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Account_trashboxId_fkey" FOREIGN KEY ("trashboxId") REFERENCES "Mailbox" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Account_sentboxId_fkey" FOREIGN KEY ("sentboxId") REFERENCES "Mailbox" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Account_draftsboxId_fkey" FOREIGN KEY ("draftsboxId") REFERENCES "Mailbox" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Account_senderServerId_fkey" FOREIGN KEY ("senderServerId") REFERENCES "Server" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Account_senderAuthId_fkey" FOREIGN KEY ("senderAuthId") REFERENCES "ServerAuth" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Account_receiverServerId_fkey" FOREIGN KEY ("receiverServerId") REFERENCES "Server" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Account_receiverAuthId_fkey" FOREIGN KEY ("receiverAuthId") REFERENCES "ServerAuth" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Mailbox" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "internalUidValidity" INTEGER NOT NULL,
    "accountId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "main" BOOLEAN,
    CONSTRAINT "Mailbox_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Email" (
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
    CONSTRAINT "Email_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "Address" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Email_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "Address" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Email_inboxId_fkey" FOREIGN KEY ("inboxId") REFERENCES "Mailbox" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "textContent" TEXT NOT NULL,
    "embedded" BOOLEAN NOT NULL DEFAULT false,
    "emailId" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    CONSTRAINT "Attachment_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Clip" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "text" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    CONSTRAINT "Clip_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "avatarURL" TEXT,
    "address" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "known" BOOLEAN,
    "verified" BOOLEAN,
    "bundled" BOOLEAN NOT NULL DEFAULT false,
    "defaultInboxId" TEXT,
    "lastEmailSentAt" DATETIME,
    CONSTRAINT "Address_defaultInboxId_fkey" FOREIGN KEY ("defaultInboxId") REFERENCES "Mailbox" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Signature" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "staticParts" TEXT NOT NULL,
    "dynamicPartsKeys" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    CONSTRAINT "Signature_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Label" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "color" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ServerAuth" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT,
    "token" TEXT
);

-- CreateTable
CREATE TABLE "Server" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL,
    "secure" BOOLEAN NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT,
    "token" TEXT,
    "type" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_EmailToLabel" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_EmailToLabel_A_fkey" FOREIGN KEY ("A") REFERENCES "Email" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_EmailToLabel_B_fkey" FOREIGN KEY ("B") REFERENCES "Label" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ThreadEmails" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ThreadEmails_A_fkey" FOREIGN KEY ("A") REFERENCES "Email" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ThreadEmails_B_fkey" FOREIGN KEY ("B") REFERENCES "Email" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_EmailCc" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_EmailCc_A_fkey" FOREIGN KEY ("A") REFERENCES "Address" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_EmailCc_B_fkey" FOREIGN KEY ("B") REFERENCES "Email" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_address_key" ON "Account"("address");

-- CreateIndex
CREATE UNIQUE INDEX "Mailbox_accountId_name_internalUidValidity_key" ON "Mailbox"("accountId", "name", "internalUidValidity");

-- CreateIndex
CREATE UNIQUE INDEX "Email_messageId_key" ON "Email"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "Email_inboxId_internalUid_key" ON "Email"("inboxId", "internalUid");

-- CreateIndex
CREATE UNIQUE INDEX "Attachment_emailId_filename_key" ON "Attachment"("emailId", "filename");

-- CreateIndex
CREATE UNIQUE INDEX "Address_address_key" ON "Address"("address");

-- CreateIndex
CREATE UNIQUE INDEX "_EmailToLabel_AB_unique" ON "_EmailToLabel"("A", "B");

-- CreateIndex
CREATE INDEX "_EmailToLabel_B_index" ON "_EmailToLabel"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ThreadEmails_AB_unique" ON "_ThreadEmails"("A", "B");

-- CreateIndex
CREATE INDEX "_ThreadEmails_B_index" ON "_ThreadEmails"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_EmailCc_AB_unique" ON "_EmailCc"("A", "B");

-- CreateIndex
CREATE INDEX "_EmailCc_B_index" ON "_EmailCc"("B");
