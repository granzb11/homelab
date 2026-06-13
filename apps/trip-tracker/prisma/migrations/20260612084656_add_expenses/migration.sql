-- CreateTable Expense
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "date" TIMESTAMP(3),
    "category" TEXT NOT NULL DEFAULT 'OTHER',
    "notes" TEXT,
    "splitMode" TEXT NOT NULL DEFAULT 'EVEN',
    "paidBy" TEXT NOT NULL DEFAULT '__you__',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable ExpenseParticipant
CREATE TABLE "ExpenseParticipant" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "friendId" TEXT NOT NULL,
    "inSplit" BOOLEAN NOT NULL DEFAULT true,
    "splitValue" DECIMAL(10,2),

    CONSTRAINT "ExpenseParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseParticipant_expenseId_friendId_key" ON "ExpenseParticipant"("expenseId", "friendId");

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseParticipant" ADD CONSTRAINT "ExpenseParticipant_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE CASCADE ON UPDATE CASCADE;
