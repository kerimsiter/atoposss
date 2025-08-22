/*
  Warnings:

  - A unique constraint covering the columns `[companyId,name]` on the table `Category` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."CourierLocation" ALTER COLUMN "expiresAt" SET DEFAULT NOW() + INTERVAL '7 days';

-- CreateIndex
CREATE UNIQUE INDEX "Category_companyId_name_key" ON "public"."Category"("companyId", "name");
