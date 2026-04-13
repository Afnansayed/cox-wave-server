/*
  Warnings:

  - A unique constraint covering the columns `[stripe_event_id]` on the table `payment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `transaction_id` to the `payment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "payment" ADD COLUMN     "stripe_event_id" TEXT,
DROP COLUMN "transaction_id",
ADD COLUMN     "transaction_id" UUID NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "payment_transaction_id_key" ON "payment"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_stripe_event_id_key" ON "payment"("stripe_event_id");
