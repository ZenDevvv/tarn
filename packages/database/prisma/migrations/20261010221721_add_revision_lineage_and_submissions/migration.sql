-- AlterTable
ALTER TABLE "applications" ADD COLUMN     "submittedAt" TIMESTAMP(3),
ADD COLUMN     "submittedCoverLetterId" TEXT,
ADD COLUMN     "submittedResumeId" TEXT;

-- AlterTable
ALTER TABLE "cover_letters" ADD COLUMN     "isCanonical" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "parentCoverLetterId" TEXT,
ADD COLUMN     "revision" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "resumes" DROP COLUMN "version",
ADD COLUMN     "applicationId" TEXT,
ADD COLUMN     "isCanonical" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "parentResumeId" TEXT,
ADD COLUMN     "revision" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE INDEX "cover_letters_userId_applicationId_revision_idx" ON "cover_letters"("userId", "applicationId", "revision");

-- CreateIndex
CREATE INDEX "resumes_userId_applicationId_revision_idx" ON "resumes"("userId", "applicationId", "revision");

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_submittedResumeId_fkey" FOREIGN KEY ("submittedResumeId") REFERENCES "resumes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_submittedCoverLetterId_fkey" FOREIGN KEY ("submittedCoverLetterId") REFERENCES "cover_letters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_parentResumeId_fkey" FOREIGN KEY ("parentResumeId") REFERENCES "resumes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cover_letters" ADD CONSTRAINT "cover_letters_parentCoverLetterId_fkey" FOREIGN KEY ("parentCoverLetterId") REFERENCES "cover_letters"("id") ON DELETE SET NULL ON UPDATE CASCADE;
