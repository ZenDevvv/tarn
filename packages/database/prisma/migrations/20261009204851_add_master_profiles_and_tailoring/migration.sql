-- AlterTable
ALTER TABLE "resumes" ADD COLUMN     "content" JSONB,
ADD COLUMN     "isTailored" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "matchScore" INTEGER;

-- CreateTable
CREATE TABLE "master_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "basics" JSONB NOT NULL,
    "positioningRules" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "factBank" JSONB NOT NULL,
    "summaryCandidates" JSONB DEFAULT '[]',
    "workExperience" JSONB NOT NULL,
    "projectExperience" JSONB NOT NULL,
    "skills" JSONB NOT NULL,
    "education" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "master_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cover_letters" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "applicationId" TEXT,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "company" TEXT,
    "content" TEXT NOT NULL,
    "htmlContent" TEXT,
    "fileUrl" TEXT,
    "matchScore" INTEGER,
    "echoedPhrases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cover_letters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generation_usages" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "generation_usages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "master_profiles_userId_key" ON "master_profiles"("userId");

-- CreateIndex
CREATE INDEX "cover_letters_userId_idx" ON "cover_letters"("userId");

-- CreateIndex
CREATE INDEX "cover_letters_applicationId_idx" ON "cover_letters"("applicationId");

-- CreateIndex
CREATE INDEX "generation_usages_userId_date_idx" ON "generation_usages"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "generation_usages_userId_date_key" ON "generation_usages"("userId", "date");

-- AddForeignKey
ALTER TABLE "master_profiles" ADD CONSTRAINT "master_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cover_letters" ADD CONSTRAINT "cover_letters_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cover_letters" ADD CONSTRAINT "cover_letters_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generation_usages" ADD CONSTRAINT "generation_usages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
