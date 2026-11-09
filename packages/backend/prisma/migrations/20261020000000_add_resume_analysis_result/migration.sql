-- AlterTable: persist resume deep-diagnosis results
ALTER TABLE "resumes" ADD COLUMN "analysisResult" JSONB;
ALTER TABLE "resumes" ADD COLUMN "analyzedAt" TIMESTAMP(3);
