-- CreateEnum
CREATE TYPE "CloseType" AS ENUM ('REJECTED', 'WITHDRAWN', 'NO_RESPONSE', 'CANCELLED', 'OTHER');

-- DropIndex
DROP INDEX "applications_userId_status_idx";

-- AlterTable
ALTER TABLE "applications" DROP COLUMN "status",
ADD COLUMN     "statusId" TEXT NOT NULL;

-- DropEnum
DROP TYPE "ApplicationStatus";

-- CreateTable
CREATE TABLE "application_statuses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER,
    "closeType" "CloseType",
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "application_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "application_statuses_userId_order_idx" ON "application_statuses"("userId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "application_statuses_userId_name_key" ON "application_statuses"("userId", "name");

-- CreateIndex
CREATE INDEX "applications_userId_statusId_idx" ON "applications"("userId", "statusId");

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "application_statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_statuses" ADD CONSTRAINT "application_statuses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
