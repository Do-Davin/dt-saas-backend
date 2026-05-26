-- AlterTable
ALTER TABLE "CustomerRequestItem" ADD COLUMN     "pricingTypeSnapshot" "PricingType",
ADD COLUMN     "salesPriceSnapshot" DECIMAL(10,2);
