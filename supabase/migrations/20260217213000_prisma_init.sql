-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "FounderStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "FundingStage" AS ENUM ('BOOTSTRAPPED', 'PRE_SEED', 'SEED', 'SERIES_A', 'SERIES_B', 'SERIES_C', 'SERIES_D', 'SERIES_E', 'SERIES_F', 'IPO', 'ACQUIRED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatar" TEXT,
    "passwordHash" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "founder_profiles" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "bio" TEXT,
    "location" TEXT,
    "linkedinUrl" TEXT,
    "twitterUrl" TEXT,
    "website" TEXT,
    "slug" TEXT NOT NULL,
    "status" "FounderStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "founder_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "startups" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "oneLiner" TEXT,
    "website" TEXT,
    "fundingStage" "FundingStage" NOT NULL DEFAULT 'BOOTSTRAPPED',
    "totalRaised" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "startups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "founder_startups" (
    "founderId" UUID NOT NULL,
    "startupId" UUID NOT NULL,
    "roleTitle" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "founder_startups_pkey" PRIMARY KEY ("founderId","startupId")
);

-- CreateTable
CREATE TABLE "endorsements" (
    "id" UUID NOT NULL,
    "endorserId" UUID NOT NULL,
    "founderId" UUID NOT NULL,
    "skill" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "endorsements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "founder_directory_entries" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "founderName" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "foundedYear" INTEGER,
    "headquarters" TEXT,
    "industry" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "productSummary" TEXT NOT NULL,
    "fundingInfo" TEXT,
    "sourceUrl" TEXT,
    "ycProfileUrl" TEXT,
    "websiteUrl" TEXT,
    "employeeCount" TEXT,
    "techStack" TEXT[],
    "recentNews" TEXT[],
    "linkedinUrl" TEXT,
    "twitterUrl" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT true,
    "avatarUrl" TEXT,
    "claimedByUserId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "founder_directory_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claim_requests" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "founderEntryId" TEXT NOT NULL,
    "message" TEXT,
    "status" "ClaimStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "claim_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aggregator_connections" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "authHeader" TEXT,
    "authValue" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3),
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aggregator_connections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "founder_profiles_userId_key" ON "founder_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "founder_profiles_slug_key" ON "founder_profiles"("slug");

-- CreateIndex
CREATE INDEX "founder_profiles_status_idx" ON "founder_profiles"("status");

-- CreateIndex
CREATE INDEX "founder_profiles_location_idx" ON "founder_profiles"("location");

-- CreateIndex
CREATE INDEX "founder_profiles_status_createdAt_idx" ON "founder_profiles"("status", "createdAt");

-- CreateIndex
CREATE INDEX "startups_name_idx" ON "startups"("name");

-- CreateIndex
CREATE INDEX "startups_fundingStage_idx" ON "startups"("fundingStage");

-- CreateIndex
CREATE INDEX "startups_totalRaised_idx" ON "startups"("totalRaised");

-- CreateIndex
CREATE INDEX "startups_fundingStage_totalRaised_idx" ON "startups"("fundingStage", "totalRaised");

-- CreateIndex
CREATE INDEX "founder_startups_startupId_idx" ON "founder_startups"("startupId");

-- CreateIndex
CREATE INDEX "founder_startups_founderId_isPrimary_idx" ON "founder_startups"("founderId", "isPrimary");

-- CreateIndex
CREATE INDEX "endorsements_founderId_idx" ON "endorsements"("founderId");

-- CreateIndex
CREATE INDEX "endorsements_endorserId_idx" ON "endorsements"("endorserId");

-- CreateIndex
CREATE INDEX "endorsements_skill_idx" ON "endorsements"("skill");

-- CreateIndex
CREATE INDEX "endorsements_founderId_skill_idx" ON "endorsements"("founderId", "skill");

-- CreateIndex
CREATE INDEX "endorsements_createdAt_idx" ON "endorsements"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "endorsements_endorserId_founderId_skill_key" ON "endorsements"("endorserId", "founderId", "skill");

-- CreateIndex
CREATE UNIQUE INDEX "founder_directory_entries_slug_key" ON "founder_directory_entries"("slug");

-- CreateIndex
CREATE INDEX "founder_directory_entries_companyName_idx" ON "founder_directory_entries"("companyName");

-- CreateIndex
CREATE INDEX "founder_directory_entries_industry_idx" ON "founder_directory_entries"("industry");

-- CreateIndex
CREATE INDEX "founder_directory_entries_headquarters_idx" ON "founder_directory_entries"("headquarters");

-- CreateIndex
CREATE INDEX "founder_directory_entries_stage_idx" ON "founder_directory_entries"("stage");

-- CreateIndex
CREATE INDEX "founder_directory_entries_claimedByUserId_idx" ON "founder_directory_entries"("claimedByUserId");

-- CreateIndex
CREATE INDEX "claim_requests_status_idx" ON "claim_requests"("status");

-- CreateIndex
CREATE INDEX "claim_requests_createdAt_idx" ON "claim_requests"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "claim_requests_userId_founderEntryId_key" ON "claim_requests"("userId", "founderEntryId");

-- CreateIndex
CREATE INDEX "aggregator_connections_provider_idx" ON "aggregator_connections"("provider");

-- CreateIndex
CREATE INDEX "aggregator_connections_isActive_idx" ON "aggregator_connections"("isActive");

-- CreateIndex
CREATE INDEX "aggregator_connections_createdById_idx" ON "aggregator_connections"("createdById");

-- AddForeignKey
ALTER TABLE "founder_profiles" ADD CONSTRAINT "founder_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "founder_startups" ADD CONSTRAINT "founder_startups_founderId_fkey" FOREIGN KEY ("founderId") REFERENCES "founder_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "founder_startups" ADD CONSTRAINT "founder_startups_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "startups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "endorsements" ADD CONSTRAINT "endorsements_endorserId_fkey" FOREIGN KEY ("endorserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "endorsements" ADD CONSTRAINT "endorsements_founderId_fkey" FOREIGN KEY ("founderId") REFERENCES "founder_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "founder_directory_entries" ADD CONSTRAINT "founder_directory_entries_claimedByUserId_fkey" FOREIGN KEY ("claimedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_requests" ADD CONSTRAINT "claim_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_requests" ADD CONSTRAINT "claim_requests_founderEntryId_fkey" FOREIGN KEY ("founderEntryId") REFERENCES "founder_directory_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aggregator_connections" ADD CONSTRAINT "aggregator_connections_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

