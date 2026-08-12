/*
  Warnings:

  - The values [PAUSED,STOPPED] on the enum `SessionStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `payload` on the `CaptureEvent` table. All the data in the column will be lost.
  - You are about to drop the `ChangeEvent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ViewEvent` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "AccessType" AS ENUM ('PUBLIC', 'PASSWORD', 'WORKSPACE_ONLY', 'EXPIRING');

-- AlterEnum
BEGIN;
CREATE TYPE "SessionStatus_new" AS ENUM ('CREATED', 'RECORDING', 'STOPPING', 'UPLOADING', 'UPLOADED', 'PROCESSING', 'READY', 'FAILED', 'CANCELLED');
ALTER TABLE "public"."RecordingSession" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "RecordingSession" ALTER COLUMN "status" TYPE "SessionStatus_new" USING ("status"::text::"SessionStatus_new");
ALTER TYPE "SessionStatus" RENAME TO "SessionStatus_old";
ALTER TYPE "SessionStatus_new" RENAME TO "SessionStatus";
DROP TYPE "public"."SessionStatus_old";
ALTER TABLE "RecordingSession" ALTER COLUMN "status" SET DEFAULT 'CREATED';
COMMIT;

-- DropForeignKey
ALTER TABLE "ChangeEvent" DROP CONSTRAINT "ChangeEvent_scanRunId_fkey";

-- DropForeignKey
ALTER TABLE "ChangeEvent" DROP CONSTRAINT "ChangeEvent_segmentId_fkey";

-- AlterTable
ALTER TABLE "CaptureEvent" DROP COLUMN "payload",
ADD COLUMN     "coordinates" JSONB,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "targetIdentity" JSONB,
ADD COLUMN     "url" TEXT,
ADD COLUMN     "viewport" JSONB;

-- AlterTable
ALTER TABLE "RecordingSession" ADD COLUMN     "duration" INTEGER,
ADD COLUMN     "error" TEXT,
ADD COLUMN     "storageKeys" TEXT[],
ALTER COLUMN "status" SET DEFAULT 'CREATED';

-- DropTable
DROP TABLE "ChangeEvent";

-- DropTable
DROP TABLE "ViewEvent";

-- CreateTable
CREATE TABLE "ChangeDetection" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "segmentId" TEXT NOT NULL,
    "baselineVersionId" TEXT NOT NULL,
    "scanRunId" TEXT NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confidence" DOUBLE PRECISION NOT NULL,
    "status" "ChangeStatus" NOT NULL DEFAULT 'OPEN',
    "reason" TEXT,
    "oldEvidence" JSONB,
    "newEvidence" JSONB,
    "visualDiffAssetId" TEXT,
    "domDiff" JSONB,
    "textDiff" JSONB,
    "recommendedAction" TEXT,

    CONSTRAINT "ChangeDetection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StepEvidence" (
    "id" TEXT NOT NULL,
    "segmentId" TEXT NOT NULL,
    "startTime" INTEGER NOT NULL,
    "endTime" INTEGER NOT NULL,
    "screenshotKey" TEXT,
    "targetIdentity" JSONB,
    "actionType" TEXT NOT NULL,
    "transcriptRange" JSONB,
    "confidence" DOUBLE PRECISION NOT NULL,
    "scanRunId" TEXT,

    CONSTRAINT "StepEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessingJob" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'QUEUED',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "attempt" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ProcessingJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Share" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "accessType" "AccessType" NOT NULL DEFAULT 'PUBLIC',
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Share_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "versionId" TEXT,
    "eventType" TEXT NOT NULL,
    "sessionId" TEXT,
    "anonymousViewerId" TEXT,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Share_token_key" ON "Share"("token");

-- AddForeignKey
ALTER TABLE "ChangeDetection" ADD CONSTRAINT "ChangeDetection_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "Segment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeDetection" ADD CONSTRAINT "ChangeDetection_scanRunId_fkey" FOREIGN KEY ("scanRunId") REFERENCES "ScanRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StepEvidence" ADD CONSTRAINT "StepEvidence_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "Segment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StepEvidence" ADD CONSTRAINT "StepEvidence_scanRunId_fkey" FOREIGN KEY ("scanRunId") REFERENCES "ScanRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Share" ADD CONSTRAINT "Share_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
