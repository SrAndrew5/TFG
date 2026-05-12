-- AlterTable
ALTER TABLE `recursos` ADD COLUMN `horario_apertura` VARCHAR(5) NOT NULL DEFAULT '08:00',
    ADD COLUMN `horario_cierre` VARCHAR(5) NOT NULL DEFAULT '20:00',
    ADD COLUMN `latitud` DECIMAL(10, 7) NULL,
    ADD COLUMN `longitud` DECIMAL(10, 7) NULL;
