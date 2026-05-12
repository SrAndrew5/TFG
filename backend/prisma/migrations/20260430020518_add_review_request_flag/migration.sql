-- AlterTable
ALTER TABLE `citas` ADD COLUMN `review_request_sent_at` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `reservas_recursos` ADD COLUMN `review_request_sent_at` DATETIME(3) NULL;
