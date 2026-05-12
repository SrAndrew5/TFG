-- AlterTable
ALTER TABLE `citas` ADD COLUMN `codigo_descuento` VARCHAR(50) NULL,
    ADD COLUMN `precio_pagado` DECIMAL(10, 2) NULL;

-- AlterTable
ALTER TABLE `reservas_recursos` ADD COLUMN `codigo_descuento` VARCHAR(50) NULL,
    ADD COLUMN `precio_pagado` DECIMAL(10, 2) NULL;

-- CreateTable
CREATE TABLE `password_reset_tokens` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuario_id` INTEGER NOT NULL,
    `token` VARCHAR(255) NOT NULL,
    `expira_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `password_reset_tokens_usuario_id_key`(`usuario_id`),
    UNIQUE INDEX `password_reset_tokens_token_key`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuario_id` INTEGER NULL,
    `accion` VARCHAR(100) NOT NULL,
    `entidad` VARCHAR(50) NOT NULL,
    `entidad_id` INTEGER NULL,
    `datos` JSON NULL,
    `ip` VARCHAR(45) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_usuario_id_idx`(`usuario_id`),
    INDEX `audit_logs_entidad_entidad_id_idx`(`entidad`, `entidad_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `password_reset_tokens` ADD CONSTRAINT `password_reset_tokens_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
