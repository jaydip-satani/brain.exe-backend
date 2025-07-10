-- CreateTable
CREATE TABLE "ProblemSheet" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProblemSheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProblemInSheet" (
    "id" TEXT NOT NULL,
    "problemSheetId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProblemInSheet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProblemSheet_name_userId_key" ON "ProblemSheet"("name", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProblemInSheet_problemSheetId_problemId_key" ON "ProblemInSheet"("problemSheetId", "problemId");

-- AddForeignKey
ALTER TABLE "ProblemSheet" ADD CONSTRAINT "ProblemSheet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemInSheet" ADD CONSTRAINT "ProblemInSheet_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemInSheet" ADD CONSTRAINT "ProblemInSheet_problemSheetId_fkey" FOREIGN KEY ("problemSheetId") REFERENCES "ProblemSheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
