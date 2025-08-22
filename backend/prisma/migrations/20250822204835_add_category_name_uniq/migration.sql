-- AlterTable
ALTER TABLE "public"."CourierLocation" ALTER COLUMN "expiresAt" SET DEFAULT NOW() + INTERVAL '7 days';
