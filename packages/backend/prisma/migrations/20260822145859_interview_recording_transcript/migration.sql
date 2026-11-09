/*
  Warnings:

  - You are about to drop the `agent_sessions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `application_status_history` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `applications` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `job_matches` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `job_postings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `knowledge_base` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "agent_sessions" DROP CONSTRAINT "agent_sessions_userId_fkey";

-- DropForeignKey
ALTER TABLE "application_status_history" DROP CONSTRAINT "application_status_history_applicationId_fkey";

-- DropForeignKey
ALTER TABLE "applications" DROP CONSTRAINT "applications_jobId_fkey";

-- DropForeignKey
ALTER TABLE "job_matches" DROP CONSTRAINT "job_matches_jobId_fkey";

-- DropForeignKey
ALTER TABLE "job_postings" DROP CONSTRAINT "job_postings_userId_fkey";

-- AlterTable
ALTER TABLE "interview_sessions" ADD COLUMN     "recordingDuration" INTEGER,
ADD COLUMN     "recordingUrl" TEXT,
ADD COLUMN     "transcript" TEXT;

-- DropTable
DROP TABLE "agent_sessions";

-- DropTable
DROP TABLE "application_status_history";

-- DropTable
DROP TABLE "applications";

-- DropTable
DROP TABLE "job_matches";

-- DropTable
DROP TABLE "job_postings";

-- DropTable
DROP TABLE "knowledge_base";

-- DropEnum
DROP TYPE "ApplicationStatus";
