-- CreateTable
CREATE TABLE `reviews` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuario_id` INTEGER NOT NULL,
    `servicio_id` INTEGER NULL,
    `recurso_id` INTEGER NULL,
    `cita_id` INTEGER NULL,
    `reserva_recurso_id` INTEGER NULL,
    `rating` INTEGER NOT NULL,
    `comentario` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `reviews_cita_id_key`(`cita_id`),
    UNIQUE INDEX `reviews_reserva_recurso_id_key`(`reserva_recurso_id`),
    INDEX `reviews_servicio_id_idx`(`servicio_id`),
    INDEX `reviews_recurso_id_idx`(`recurso_id`),
    INDEX `reviews_usuario_id_idx`(`usuario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_servicio_id_fkey` FOREIGN KEY (`servicio_id`) REFERENCES `servicios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_recurso_id_fkey` FOREIGN KEY (`recurso_id`) REFERENCES `recursos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_cita_id_fkey` FOREIGN KEY (`cita_id`) REFERENCES `citas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_reserva_recurso_id_fkey` FOREIGN KEY (`reserva_recurso_id`) REFERENCES `reservas_recursos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
