/*
  Warnings:

  - You are about to drop the column `favorite` on the `File` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'DELETE', 'UPDATE');

-- CreateEnum
CREATE TYPE "AuditEntity" AS ENUM ('FOLDER', 'FILE');

-- AlterTable
ALTER TABLE "File" DROP COLUMN "favorite";

-- CreateTable
CREATE TABLE "FavoriteFile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "FavoriteFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entity" "AuditEntity" NOT NULL,
    "action" "AuditAction" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "details" TEXT,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FavoriteFile_userId_fileId_key" ON "FavoriteFile"("userId", "fileId");

-- AddForeignKey
ALTER TABLE "FavoriteFile" ADD CONSTRAINT "FavoriteFile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteFile" ADD CONSTRAINT "FavoriteFile_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
