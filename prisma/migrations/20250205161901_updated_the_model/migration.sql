/*
  Warnings:

  - You are about to drop the column `organizationId` on the `Folder` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Folder" DROP CONSTRAINT "Folder_organizationId_fkey";

-- AlterTable
ALTER TABLE "Folder" DROP COLUMN "organizationId";
