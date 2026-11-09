-- AlterTable
ALTER TABLE "interview_sessions" ALTER COLUMN "optimizationId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "optimizations" ALTER COLUMN "jobId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "resumes" ADD COLUMN     "currentVersionId" TEXT;

-- CreateTable
CREATE TABLE "resume_versions" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "personalInfo" JSONB NOT NULL,
    "summary" JSONB,
    "education" JSONB,
    "experience" JSONB,
    "skills" JSONB,
    "projects" JSONB,
    "certifications" JSONB,
    "languages" JSONB,
    "markdown" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resume_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "resume_versions_resumeId_version_idx" ON "resume_versions"("resumeId", "version");

-- AddForeignKey
ALTER TABLE "resume_versions" ADD CONSTRAINT "resume_versions_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
