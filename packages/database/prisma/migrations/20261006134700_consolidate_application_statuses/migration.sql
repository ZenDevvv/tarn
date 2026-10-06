-- AlterEnum
CREATE TYPE "ApplicationStatus_new" AS ENUM ('SAVED', 'APPLIED', 'INTERVIEWING', 'OFFER', 'ACCEPTED', 'REJECTED', 'WITHDRAWN', 'NO_RESPONSE');
ALTER TABLE "applications" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "applications" ALTER COLUMN "status" TYPE text;
UPDATE "applications" SET "status" = 'INTERVIEWING' WHERE "status" IN ('RECRUITER_CONTACTED', 'HR_INTERVIEW', 'TECHNICAL_INTERVIEW', 'FINAL_INTERVIEW');
UPDATE "applications" SET "status" = 'APPLIED' WHERE "status" = 'APPLICATION_VIEWED';
ALTER TABLE "applications" ALTER COLUMN "status" TYPE "ApplicationStatus_new" USING ("status"::"ApplicationStatus_new");
DROP TYPE "ApplicationStatus";
ALTER TYPE "ApplicationStatus_new" RENAME TO "ApplicationStatus";
ALTER TABLE "applications" ALTER COLUMN "status" SET DEFAULT 'SAVED';
