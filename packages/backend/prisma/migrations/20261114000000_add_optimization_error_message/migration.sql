-- AlterTable: surface optimization generation failures to the client
ALTER TABLE "optimizations" ADD COLUMN "errorMessage" TEXT;