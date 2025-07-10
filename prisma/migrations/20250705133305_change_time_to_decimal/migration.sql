/*
  Warnings:

  - The `time` column on the `Submission` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `time` column on the `TestCaseResult` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Submission" DROP COLUMN "time",
ADD COLUMN     "time" DECIMAL(65,30);

-- AlterTable
ALTER TABLE "TestCaseResult" DROP COLUMN "time",
ADD COLUMN     "time" DECIMAL(65,30);
