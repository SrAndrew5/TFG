-- AlterTable
ALTER TABLE `citas` ADD COLUMN `business_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `empleados` ADD COLUMN `business_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `recursos` ADD COLUMN `business_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `reservas_recursos` ADD COLUMN `business_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `servicios` ADD COLUMN `business_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `usuarios` MODIFY `rol` ENUM('CLIENTE', 'ADMIN', 'BUSINESS_OWNER') NOT NULL DEFAULT 'CLIENTE';

-- CreateTable
CREATE TABLE `businesses` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(150) NOT NULL,
    `slug` VARCHAR(180) NOT NULL,
    `tipo` VARCHAR(40) NOT NULL,
    `cif_nif` VARCHAR(20) NOT NULL,
    `descripcion` TEXT NULL,
    `direccion` VARCHAR(255) NOT NULL,
    `ciudad` VARCHAR(100) NOT NULL,
    `codigo_postal` VARCHAR(10) NOT NULL,
    `lat` DOUBLE NULL,
    `lng` DOUBLE NULL,
    `telefono` VARCHAR(20) NOT NULL,
    `web` VARCHAR(255) NULL,
    `logo_url` VARCHAR(500) NULL,
    `fotos_urls` JSON NULL,
    `horario` JSON NULL,
    `estado` ENUM('PENDIENTE', 'ACTIVO', 'SUSPENDIDO', 'RECHAZADO') NOT NULL DEFAULT 'PENDIENTE',
    `motivo_rechazo` VARCHAR(500) NULL,
    `owner_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `businesses_slug_key`(`slug`),
    UNIQUE INDEX `businesses_cif_nif_key`(`cif_nif`),
    UNIQUE INDEX `businesses_owner_id_key`(`owner_id`),
    INDEX `businesses_estado_idx`(`estado`),
    INDEX `businesses_ciudad_idx`(`ciudad`),
    INDEX `businesses_lat_lng_idx`(`lat`, `lng`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `citas_business_id_idx` ON `citas`(`business_id`);

-- CreateIndex
CREATE INDEX `empleados_business_id_idx` ON `empleados`(`business_id`);

-- CreateIndex
CREATE INDEX `recursos_business_id_idx` ON `recursos`(`business_id`);

-- CreateIndex
CREATE INDEX `reservas_recursos_business_id_idx` ON `reservas_recursos`(`business_id`);

-- CreateIndex
CREATE INDEX `servicios_business_id_idx` ON `servicios`(`business_id`);

-- AddForeignKey
ALTER TABLE `empleados` ADD CONSTRAINT `empleados_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `servicios` ADD CONSTRAINT `servicios_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `citas` ADD CONSTRAINT `citas_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recursos` ADD CONSTRAINT `recursos_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reservas_recursos` ADD CONSTRAINT `reservas_recursos_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `businesses` ADD CONSTRAINT `businesses_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
