-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "company" TEXT,
ADD COLUMN     "department" TEXT,
ADD COLUMN     "phone" TEXT;
