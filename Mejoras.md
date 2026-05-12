# DESPLIEGUE EN AWS EC2 — CoworkPro
**Stack:** React + Vite / Node.js + Express + Prisma + MySQL / Socket.io

---

## 1. Crear la instancia EC2

En **AWS Console → EC2 → Launch Instance**:
- **AMI:** Ubuntu Server 22.04 LTS (x86_64)
- **Tipo:** t3.micro (~$8/mes) o t2.micro (free tier 1 año)
- **Security Group:** abre los puertos 22 (SSH), 80 (HTTP), 443 (HTTPS)
- Crea o usa un par de claves `.pem` para SSH

---

## 2. Configurar el servidor

```bash
# Conectar
ssh -i tu-clave.pem ubuntu@<IP_PUBLICA_EC2>

# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# MySQL 8, Nginx y PM2
sudo apt install -y mysql-server nginx
sudo npm install -g pm2

# MySQL — crear base de datos y usuario
sudo mysql
  CREATE DATABASE coworkpro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  CREATE USER 'cowork'@'localhost' IDENTIFIED BY 'pon_una_clave_segura';
  GRANT ALL PRIVILEGES ON coworkpro.* TO 'cowork'@'localhost';
  FLUSH PRIVILEGES;
  EXIT;
```

---

## 3. Desplegar el código

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/tu-repo.git /var/www/app
cd /var/www/app

# ── Backend ─────────────────────────────────
cd backend
cp .env.example .env
nano .env          # Rellenar todas las variables (ver tabla abajo)

npm install --omit=dev
npx prisma migrate deploy   # NUNCA usar db push en producción
node prisma/seed.js          # Datos de demostración (opcional)

pm2 start src/index.js --name coworkpro-api --env production
pm2 save
pm2 startup                  # Sigue las instrucciones que imprime

# ── Frontend ────────────────────────────────
cd ../frontend
npm install
npm run build                # Genera dist/

sudo cp -r dist/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html/
```

---

## 4. Variables de entorno de producción

| Variable | Valor de ejemplo |
|----------|-----------------|
| `DATABASE_URL` | `mysql://cowork:clave@localhost:3306/coworkpro` |
| `JWT_SECRET` | `openssl rand -base64 64` (generar en terminal) |
| `JWT_EXPIRATION` | `24h` |
| `PORT` | `3001` |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `https://tu-dominio.com` |
| `CLOUDINARY_CLOUD_NAME` | Los mismos que en desarrollo |
| `CLOUDINARY_API_KEY` | Los mismos que en desarrollo |
| `CLOUDINARY_API_SECRET` | Los mismos que en desarrollo |
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASSWORD` | Tu proveedor SMTP |
| `TZ` | `Europe/Madrid` |

---

## 5. Configurar Nginx

```bash
sudo nano /etc/nginx/sites-available/coworkpro
```

```nginx
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;

    # Frontend — React SPA (código estático)
    root /var/www/html;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;   # Crítico para React Router
    }

    # API REST → backend Node.js
    location /api/ {
        proxy_pass         http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }

    # WebSockets (Socket.io) — requiere upgrade de conexión
    location /socket.io/ {
        proxy_pass         http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_set_header   Host $host;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/coworkpro /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## 6. SSL gratuito con Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com
# Certbot modifica el nginx.conf automáticamente y renueva el cert cada 90 días
```

---

## 7. Actualizar el proyecto (deploy continuo)

```bash
cd /var/www/app && git pull

# Backend (si cambió):
cd backend && npm install --omit=dev && npx prisma migrate deploy
pm2 restart coworkpro-api

# Frontend (si cambió):
cd ../frontend && npm run build
sudo cp -r dist/* /var/www/html/
```

---

---

# PREGUNTAS DEL TRIBUNAL — Respuestas preparadas

## Seguridad y autenticación

**¿Por qué guardas el JWT en cookie y no en localStorage?**
> El `localStorage` es accesible por cualquier script JavaScript de la página, haciéndolo vulnerable a ataques XSS. Al usar una cookie `httpOnly`, el navegador impide que el JS del cliente la lea, eliminando el vector de robo de credenciales más común. El envío al backend es automático en cada request.

**¿Cómo proteges contra ataques de fuerza bruta?**
> Con `express-rate-limit`: máximo 10 intentos de login cada 15 minutos por IP. El endpoint de recuperación de contraseña tiene límite de 5 intentos por hora. Los tokens de reset se almacenan como hash SHA-256 en la base de datos y expiran a las 2 horas.

**¿Qué pasaría si alguien intercepta el token JWT?**
> El token tiene expiración de 24 horas. Las cookies tienen `sameSite: 'strict'` en producción, lo que previene ataques CSRF. Para invalidación activa se podría implementar una lista negra en Redis (mejora futura), pero el corto tiempo de vida mitiga el impacto.

---

## Multi-tenant y aislamiento de datos

**¿Cómo garantizas que un BUSINESS_OWNER no vea datos de otro negocio?**
> Todas las queries del panel de negocio filtran implícitamente por `owner_id: req.user.id`. El negocio nunca se lee del body de la petición — siempre se deduce de quién está autenticado. El middleware `authorize('BUSINESS_OWNER')` valida el rol antes de llegar al controlador.

**¿Qué diferencia hay entre rechazar y suspender un negocio?**
> Un negocio `RECHAZADO` es uno cuya solicitud inicial no pasó la revisión del admin (nunca estuvo activo). Un negocio `SUSPENDIDO` estaba activo y fue deshabilitado por infracción o motivo operativo. Solo un negocio `ACTIVO` puede suspenderse, y solo uno `SUSPENDIDO` puede reactivarse.

---

## Flujo de suspensión / reactivación de negocios

**¿Qué pasa con las reservas activas cuando el admin suspende un negocio?**
> Se cancelan automáticamente en cascada todas las reservas futuras (fecha ≥ hoy) con estado `PENDIENTE` o `CONFIRMADA`. Cada usuario afectado recibe un email con el detalle de qué reserva y por qué, y una notificación in-app en tiempo real vía WebSocket.

**¿Los espacios del negocio suspendido siguen apareciendo en el explorador?**
> No. El endpoint `GET /api/resources` filtra con `OR: [{ business_id: null }, { business: { estado: 'ACTIVO' } }]`. Los espacios de negocios suspendidos desaparecen del explorador automáticamente. Los recursos sin negocio (de la plataforma) siempre se muestran.

**¿Puede el propietario seguir accediendo a su panel cuando está suspendido?**
> Puede autenticarse (el login no está bloqueado), pero el componente `BusinessRoute` comprueba que `business.estado === 'ACTIVO'` antes de renderizar el panel. Si está `SUSPENDIDO` le redirige a una página informativa con el motivo.

**¿Qué pasa con los empleados al suspender un negocio?**
> Se desactivan automáticamente (`activo: false`) en una operación `updateMany`. Cada empleado recibe un email informativo indicando que el negocio ha sido suspendido. En este sistema los empleados son registros gestionados por el propietario, no cuentas independientes, por lo que la desactivación es una flag en BD.

**¿Y al reactivar el negocio?**
> Los empleados se reactivan en cascada (`activo: true`). Cada uno recibe un email indicando que el negocio vuelve a estar operativo y que contacten con el responsable. El propietario recibe una notificación in-app diferenciada (no dice "aprobado", sino "reactivado") ya que son flujos distintos.

**¿Qué pasa con el dinero de las reservas canceladas por suspensión?**
> El pago actual es simulado (modal de confirmación sin cobro real). En producción con Stripe, el flujo correcto sería llamar a `stripe.refunds.create({ charge: id })` desde el webhook de cancelación. La arquitectura está preparada: el campo `precio_pagado` en `ReservaRecurso` almacena el importe cobrado para usarlo en el reembolso.

**¿Puede el propietario reactivarse a sí mismo?**
> No. El endpoint `PATCH /api/admin/businesses/:id/reactivate` requiere rol `ADMIN`. El propietario puede ver el estado de su negocio en su panel pero no tiene permisos para modificar su propio `estado`. Esto está controlado por el middleware `authorize('ADMIN')`.

---

## Reservas y disponibilidad

**¿Cómo garantizas que no haya solapamiento de reservas?**
> En el controlador de creación de reserva se comprueba si existe otra reserva en el mismo recurso, misma fecha y horas solapadas con estado `PENDIENTE` o `CONFIRMADA`. Si existe, se devuelve 409. El frontend también lo bloquea visualmente, pero la validación real está en el backend.

**¿Qué pasa si dos usuarios intentan reservar el mismo slot a la vez?**
> La creación de reserva está envuelta en una transacción Prisma que ejecuta primero `SELECT ... FOR UPDATE` sobre el registro del recurso. Este bloqueo pesimista (pessimistic locking) hace que el segundo request quede bloqueado en BD hasta que el primero confirme o revierta, garantizando que nunca se insertan dos reservas solapadas aunque lleguen simultáneamente.

**¿Puede un usuario reservar un espacio de un negocio suspendido si conoce el ID?**
> No. La lista pública (`GET /api/resources`) ya filtra los recursos de negocios suspendidos, pero además el endpoint de creación de reserva (`POST /api/resource-bookings`) re-verifica en base de datos que `recurso.business.estado === 'ACTIVO'`. Aunque el usuario tenga el ID cacheado de antes de la suspensión, la validación backend devuelve 409. La defensa está en el servidor, no solo en la UI.

---

## Arquitectura y rendimiento

**¿Por qué usas Code Splitting con `React.lazy`?**
> Para reducir el bundle inicial. Un usuario que solo reserva un espacio no descarga el código del panel de administración ni del panel de negocio. El chunk principal pesa ~96 KB gzipped; los paneles de admin/negocio se cargan bajo demanda.

**¿Por qué usas WebSockets para notificaciones en lugar de polling?**
> El polling consume recursos en servidor aunque no haya datos nuevos. Con Socket.io, el servidor solo empuja datos cuando hay un evento real (nueva notificación). La latencia baja de ~60 segundos (polling) a prácticamente instantáneo. Se mantiene un polling de respaldo cada 5 minutos por si el socket pierde la conexión.

**¿Por qué Prisma en lugar de queries SQL directas?**
> Type-safety en tiempo de compilación, migraciones versionadas, y prevención automática de SQL injection (queries parametrizadas). Las relaciones entre entidades son expresivas y el código resultante es más mantenible.

**¿Qué es un PWA y por qué lo añadiste?**
> Progressive Web App: la app puede instalarse en el móvil/escritorio desde el navegador sin pasar por una App Store. El service worker precachea todos los assets estáticos, por lo que la interfaz carga instantáneamente en visitas repetidas y funciona offline. Vite PWA genera el `manifest.webmanifest` y el service worker automáticamente en el build.

---

---

## Validación de entradas

**¿Cómo validas las entradas del usuario?**
> Con schemas Joi en middleware `validate()` aplicado antes de cada controlador. Los campos desconocidos se descartan con `stripUnknown: true` (evita mass-assignment), se reportan todos los errores de una vez con `abortEarly: false`, y los valores saneados reemplazan `req.body` antes de llegar al controlador. Hay schema dedicado para cada endpoint: registro, login, crear cita, crear reserva de recurso, etc.

**¿Por qué el precio no se acepta desde el cliente?**
> El campo `precio_pagado` está explícitamente excluido del schema Joi de creación de reserva (`// precio_pagado eliminado a propósito`). El servidor recalcula siempre el precio en `pricing.service.js` con el `precio_hora` del recurso y el código de descuento validado en BD. Un cliente no puede manipular el precio enviando un `precio_pagado: 0` en el body.

---

## Autorización por roles

**¿Puede un usuario cancelar la reserva de otro usuario?**
> No. El endpoint `PUT /api/resource-bookings/:id/status` comprueba que `reserva.usuario_id === req.user.id` para usuarios no-admin. Si no coincide devuelve 403 antes de ejecutar ningún cambio en BD.

**¿Puede un usuario confirmar o completar su propia reserva?**
> No. Aunque el usuario sea el dueño de la reserva, solo los ADMIN pueden cambiar el estado a `CONFIRMADA` o `COMPLETADA`. Los usuarios no-admin únicamente pueden cancelar (`CANCELADA`). Esto impide que alguien se auto-confirme una reserva saltándose el flujo de aprobación.

**¿Qué pasa si llaman a `GET /api/resources/:id` sin autenticar?**
> El endpoint usa `optionalAuthenticate`, que deja pasar al usuario como *guest*. El controlador devuelve el recurso por su ID sin necesitar sesión, lo que permite al frontend mostrar el detalle de un espacio a cualquier visitante. La edición y borrado requieren rol `ADMIN` por rutas distintas.

---

## Arquitectura y rendimiento

**¿Por qué usas Code Splitting con `React.lazy`?**
> Para reducir el bundle inicial. Un usuario que solo reserva un espacio no descarga el código del panel de administración ni del panel de negocio. El chunk principal pesa ~96 KB gzipped; los paneles de admin/negocio se cargan bajo demanda.

**¿Por qué usas WebSockets para notificaciones en lugar de polling?**
> El polling consume recursos en servidor aunque no haya datos nuevos. Con Socket.io, el servidor solo empuja datos cuando hay un evento real (nueva notificación). La latencia baja de ~60 segundos (polling) a prácticamente instantáneo. Se mantiene un polling de respaldo cada 5 minutos por si el socket pierde la conexión.

**¿Por qué Prisma en lugar de queries SQL directas?**
> Type-safety en tiempo de compilación, migraciones versionadas, y prevención automática de SQL injection (queries parametrizadas). Las relaciones entre entidades son expresivas y el código resultante es más mantenible.

**¿Qué es un PWA y por qué lo añadiste?**
> Progressive Web App: la app puede instalarse en el móvil/escritorio desde el navegador sin pasar por una App Store. El service worker precachea todos los assets estáticos, por lo que la interfaz carga instantáneamente en visitas repetidas y funciona offline. Vite PWA genera el `manifest.webmanifest` y el service worker automáticamente en el build.

---

## Extras valorables para mencionar

- **Logging estructurado** con `pino` + `pino-http`: cada request genera un log JSON con request-id, método, URL, status y duración. En producción se puede redirigir a Datadog, Logtail o Loki sin cambiar código.
- **Audit trail**: cada acción crítica (crear negocio, aprobar, suspender, etc.) queda registrada en la tabla `AuditLog` con el userId, IP y timestamp.
- **OpenAPI / Swagger**: documentación interactiva en `/api/docs` disponible en desarrollo.
- **Dark mode**: toggle persistido en `localStorage`, con FOUC prevention (el tema se aplica antes del primer render de React para evitar parpadeo).
- **Cloudinary**: las imágenes se sirven desde CDN global con transformación automática a WebP/AVIF según el navegador del cliente.
- **Bloqueo pesimista en reservas**: `SELECT ... FOR UPDATE` dentro de transacción Prisma garantiza que dos requests concurrentes para el mismo slot no pasan el check de solapamiento a la vez.
- **Precio recalculado server-side**: el campo `precio_pagado` está excluido del schema Joi; el servidor siempre recalcula con `precio_hora * horas - descuento`. Imposible manipular el precio desde el cliente.
