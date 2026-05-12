# 🗓️ Sistema de Reservas Multiplataforma

> Plataforma SaaS de reservas que permite a negocios locales (peluquerías, barberías, coworkings, spas) recibir y gestionar reservas online, y a clientes finales descubrir y reservar servicios o espacios.

![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?logo=mysql&logoColor=white)
![Tailwind](https://img.shields.io/badge/TailwindCSS-4-38B2AC?logo=tailwind-css&logoColor=white)

**Proyecto Intermodular — 2º DAM · IES Augustóbrigas (curso 2025/2026)**

---

## 📋 Tabla de contenidos

1. [Stack tecnológico](#-stack-tecnológico)
2. [Requisitos previos](#-requisitos-previos)
3. [Instalación y arranque local](#-instalación-y-arranque-local)
4. [Variables de entorno](#-variables-de-entorno)
5. [Cuentas de prueba](#-cuentas-de-prueba)
6. [Estructura del proyecto](#-estructura-del-proyecto)
7. [Funcionalidades principales](#-funcionalidades-principales)
8. [Documentación API](#-documentación-api)
9. [Tests](#-tests)
10. [Despliegue en VPS](#-despliegue-en-vps)
11. [Decisiones técnicas destacadas](#-decisiones-técnicas-destacadas)
12. [Trabajo futuro](#-trabajo-futuro)

---

## 🏗️ Stack tecnológico

| Capa | Tecnología | Versión | Por qué se eligió |
|------|------------|---------|-------------------|
| **Frontend** | React + Vite | React 19 / Vite 8 | DX rápido, HMR instantáneo, code splitting nativo |
| **UI** | TailwindCSS + react-icons | 4.2 | Tokens CSS-first, sin CSS externo, design system propio |
| **Mapas** | react-leaflet + OpenStreetMap | 5.0 | Sin API key, gratuito, open source |
| **Backend** | Node.js + Express | Node 20+ / Express 4 | Estándar de la industria, ecosistema maduro |
| **ORM** | Prisma | 6.5 | Tipado fuerte, migraciones declarativas, transacciones limpias |
| **Base de datos** | MySQL | 8 | Relacional, ACID, soporte JSON columns para horarios |
| **Auth** | JWT en cookie httpOnly | jsonwebtoken 9 | Inmune a XSS, sameSite strict mitiga CSRF |
| **Hashing** | bcrypt | bcryptjs 2.4 | Estándar de facto, salt rounds 12 |
| **Validación** | Joi | 17 | Esquemas declarativos, `stripUnknown` para defensa en profundidad |
| **Email** | Nodemailer | 6 | SMTP genérico, plantillas HTML con escape XSS |
| **Storage** | Cloudinary | 2.10 | CDN + optimización automática de imágenes |
| **Logs** | pino + pino-http | 10 / 11 | JSON estructurado, request id correlation |
| **Cron** | node-cron | 4.2 | Recordatorios, limpieza tokens, solicitudes de reseña |
| **Rate limit** | express-rate-limit | 8 | Brute-force protection en login y forgot-password |
| **Testing** | Jest + Supertest | 29 / 7 | 39+ tests de integración contra MySQL real |
| **Docs API** | Swagger UI | 5 | OpenAPI auto-generado desde JSDoc en dev |

---

## ⚙️ Requisitos previos

- **Node.js 20 LTS** o superior — [nodejs.org](https://nodejs.org/)
- **MySQL 8** o superior corriendo localmente o accesible por red
- **Git** para clonar el repositorio
- **Cuenta Cloudinary gratuita** — [cloudinary.com](https://cloudinary.com/) (25 GB / mes free tier)
- **Cuenta SMTP** para envío de emails:
  - Desarrollo: [Mailtrap](https://mailtrap.io/) o [Mailpit](https://mailpit.axllent.org/) (local)
  - Producción: SendGrid, Resend, Mailgun, etc.

---

## 🚀 Instalación y arranque local

### 1. Clonar el repositorio

```bash
git clone https://github.com/<tu-usuario>/ProyectoTFG.git
cd ProyectoTFG
```

### 2. Configurar y arrancar el backend

```bash
cd backend

# Instalar dependencias
npm install

# Crear el archivo .env a partir del ejemplo
cp .env.example .env
# Editar .env con los valores reales (ver tabla en §5)

# Crear la base de datos en MySQL
mysql -u root -p -e "CREATE DATABASE reservas_db CHARACTER SET utf8mb4;"

# Aplicar migraciones (genera el cliente de Prisma)
npx prisma migrate dev

# Cargar datos de demo
npm run seed

# Arrancar en modo desarrollo (con auto-reload)
npm run dev
```

API disponible en `http://localhost:3001` · Swagger en `http://localhost:3001/api/docs`

### 3. Configurar y arrancar el frontend

```bash
cd ../frontend
npm install
cp .env.example .env   # Por defecto usa proxy a localhost:3001, no requiere edición
npm run dev
```

Frontend disponible en `http://localhost:5173`

---

## 🔐 Variables de entorno

### Backend (`backend/.env`)

| Variable | Descripción | Ejemplo | Obligatoria |
|----------|-------------|---------|-------------|
| `DATABASE_URL` | Cadena de conexión a MySQL | `mysql://root:root@localhost:3306/reservas_db` | ✅ |
| `JWT_SECRET` | Secreto HS256 para firmar tokens (genera con `openssl rand -hex 64`) | `e3b0c44...` | ✅ |
| `JWT_EXPIRATION` | Tiempo de vida del JWT | `24h` | ❌ (default 24h) |
| `NODE_ENV` | Entorno de ejecución | `development` / `production` | ✅ |
| `PORT` | Puerto del servidor Express | `3001` | ❌ (default 3001) |
| `FRONTEND_URL` | Origen permitido por CORS y base de URLs en emails | `http://localhost:5173` | ✅ |
| `TZ` | Zona horaria para cron jobs y `new Date()` | `Europe/Madrid` | ✅ en producción |
| `ADMIN_EMAIL` | Destinatario de avisos de nuevas empresas | `admin@tudominio.com` | ❌ |
| `CLOUDINARY_CLOUD_NAME` | Nombre del cloud (panel Cloudinary) | `dxxx` | ✅ |
| `CLOUDINARY_API_KEY` | API Key | `123456789` | ✅ |
| `CLOUDINARY_API_SECRET` | API Secret | `abcdefg...` | ✅ |
| `CLOUDINARY_FOLDER` | Carpeta raíz dentro de Cloudinary | `reservas-tfg` | ❌ |
| `SMTP_HOST` | Servidor SMTP | `smtp.mailtrap.io` | ✅ |
| `SMTP_PORT` | Puerto SMTP | `587` | ✅ |
| `SMTP_USER` | Usuario SMTP | `apikey` | ✅ |
| `SMTP_PASSWORD` | Contraseña SMTP | `xxxxx` | ✅ |
| `SMTP_FROM` | Dirección remitente de los emails | `noreply@tudominio.com` | ✅ |

### Frontend (`frontend/.env`)

| Variable | Descripción | Ejemplo | Obligatoria |
|----------|-------------|---------|-------------|
| `VITE_API_URL` | URL del backend en producción. En dev se omite y se usa el proxy de Vite | `https://api.tudominio.com/api` | Solo en producción |

---

## 👥 Cuentas de prueba

Disponibles tras `npm run seed`:

| Rol | Email | Password | Acceso |
|-----|-------|----------|--------|
| **ADMIN** | `admin@reservas.local` | `Admin123!` | Panel `/admin/*`: usuarios, servicios, empresas, reservas |
| CLIENTE | `cliente@reservas.local` | `Cliente123!` | Reservar servicios, dejar reseñas, ver historial |
| CLIENTE | `carlos@reservas.local` | `Cliente123!` | (Idéntico al anterior, para probar conflictos de slot) |
| **BUSINESS_OWNER** | `ana@peluqueria.com` | `password123` | Panel `/business/*` — Peluquería Ana (ACTIVO, Madrid) |
| BUSINESS_OWNER | `maestro@barberia.com` | `password123` | Barbería El Maestro (ACTIVO, Barcelona) |
| BUSINESS_OWNER | `info@coworkhub.com` | `password123` | CoWork Hub Sevilla (PENDIENTE — para demostrar flujo de aprobación admin) |

> ⚠️ Estas credenciales son solo para demo. **Cámbialas antes de un despliegue público.**

---

## 📁 Estructura del proyecto

```
ProyectoTFG/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma            # 14 modelos: Usuario, Cita, Recurso, Business, Review…
│   │   ├── migrations/              # Historial de migraciones SQL versionadas
│   │   └── seed.js                  # Datos de demo (usuarios, servicios, citas, negocios)
│   └── src/
│       ├── controllers/             # Lógica HTTP de cada recurso
│       ├── routes/                  # Mapeo de URLs a controllers + middleware
│       ├── middleware/              # auth (JWT), audit, validation (Joi), errorHandler
│       ├── services/                # email, scheduler (cron), pricing, availability
│       ├── validations/             # Schemas Joi específicos del módulo SaaS
│       ├── config/                  # database, logger, storage (Cloudinary), swagger, auth
│       ├── utils/                   # hash (bcrypt), jwt
│       └── __tests__/               # Tests Jest + Supertest
│
└── frontend/
    └── src/
        ├── pages/                   # Una página por ruta (Login, Services, MyAppointments…)
        │   ├── admin/               # Panel de administración (ManageUsers, AdminBusinessList…)
        │   └── business/            # Panel BUSINESS_OWNER (Dashboard, Appointments, Profile)
        ├── layouts/                 # AdminLayout, BusinessLayout (sidebar + header)
        ├── components/
        │   ├── layout/              # Navbar, Layout, AdminLayout
        │   ├── shared/              # ErrorBoundary, ConfirmModal, StarRating, ReviewModal…
        │   ├── services/            # ServiceCard, ServiceGrid, ServiceCardSkeleton
        │   ├── spaces/              # SpaceCard, SpaceGrid (coworking)
        │   └── business/            # BusinessScheduleForm…
        ├── context/                 # AuthContext, NotificationsContext
        ├── hooks/                   # useServices, useResources, usePageTitle, useScrollLock
        ├── services/                # businessService (capa Axios)
        ├── api/                     # client.js (instancia Axios con cookies httpOnly)
        └── App.jsx                  # Router principal con rutas protegidas por rol
```

---

## ⭐ Funcionalidades principales

### Cliente
- ✅ Registro con verificación de email obligatoria (token SHA-256, expira 24 h)
- ✅ Login con cookie httpOnly + sameSite strict
- ✅ Recuperación de contraseña por email (token expira 1 h)
- ✅ Reserva de servicios de peluquería con elección de profesional, fecha y slot
- ✅ Reserva de espacios coworking con validación de solapes (transacción atómica)
- ✅ Historial de reservas con cancelación, ver detalles y dejar reseña
- ✅ Sistema de reseñas con rating 1-5 + comentario opcional (1 review por cita completada)
- ✅ Notificaciones in-app con campana, badge de no leídas y dropdown
- ✅ Códigos de descuento con expiración y límite de usos atómico
- ✅ Exportación RGPD de datos personales del usuario

### Módulo Peluquería / Coworking
- ✅ Catálogo con filtros (categoría, capacidad, tipo, precio, valoración)
- ✅ Búsqueda y ordenación cliente-side con paginación
- ✅ Cards con foto, rating real, badge de disponibilidad
- ✅ Explorador con mapa Leaflet + listado lateral (negocios geolocalizados)
- ✅ Ficha pública del negocio con servicios, horarios y reseñas

### Panel BUSINESS_OWNER (`/business/*`)
- ✅ Dashboard con KPIs reales (citas hoy, citas mes, ingresos, valoración media)
- ✅ Listado de citas con filtros temporales (hoy/semana/mes) + estado + búsqueda
- ✅ Acciones inline: confirmar / cancelar (con motivo) / completar
- ✅ Cancelación notifica al cliente vía campana e in-app
- ✅ Edición del perfil del negocio: nombre, descripción, contacto, horario semanal, festivos

### Panel ADMIN (`/admin/*`)
- ✅ Dashboard de métricas globales (usuarios, ingresos, reservas)
- ✅ Gestión de usuarios (paginada, búsqueda, toggle activo)
- ✅ Gestión de servicios, empleados, recursos y reservas
- ✅ **Gestión de empresas SaaS**: lista paginada con badge de pendientes, detalle, aprobar/rechazar/suspender/reactivar
- ✅ Cada acción dispara email automático al BUSINESS_OWNER
- ✅ Audit log persistente de todas las acciones administrativas

### Sistema SaaS
- ✅ Wizard registro de empresa en 3 pasos con validación inline
- ✅ Estados PENDIENTE / ACTIVO / SUSPENDIDO / RECHAZADO con flujo completo
- ✅ Multi-tenancy parcial vía `business_id` NULLABLE en Servicio/Empleado/Recurso/Cita
- ✅ Pantalla de espera contextualizada (PENDIENTE muestra reloj, RECHAZADO muestra motivo)
- ✅ Generación automática de slug único url-friendly

### Operación
- ✅ Cron diario 09:00 — recordatorios de citas del día siguiente por email
- ✅ Cron diario 03:00 — limpieza de tokens caducados (reset password + verificación)
- ✅ Cron horario X:30 — solicitudes de reseña post-servicio (idempotente con flag en BD)

---

## 📚 Documentación API

La API REST está documentada con Swagger / OpenAPI 3.0.

**Acceso en desarrollo:** http://localhost:3001/api/docs *(deshabilitado en producción por seguridad)*

### Endpoints principales

| Módulo | Endpoints |
|--------|-----------|
| **Auth** | `POST /api/auth/register`, `POST /login`, `POST /logout`, `GET /me`, `PUT /profile`, `POST /forgot-password`, `POST /reset-password`, `GET /verify-email`, `POST /resend-verification` |
| **Servicios** | `GET /api/services`, `POST/PUT/DELETE` (admin), `GET /categories` |
| **Recursos** | `GET /api/resources`, CRUD admin |
| **Citas** | `GET /api/appointments`, `POST`, `PUT /:id/status`, `DELETE` |
| **Reservas recursos** | `GET /api/resource-bookings`, `POST`, `PUT /:id/status` |
| **Reseñas** | `GET /api/reviews?servicio_id=X`, `POST` |
| **Notificaciones** | `GET /api/notifications`, `POST`, `PATCH /:id/read`, `PATCH /read-all`, `DELETE /:id` |
| **Códigos descuento** | `GET /api/discount-codes/validate?code=X` |
| **Empresas (público)** | `POST /api/businesses/register`, `GET /me`, `PUT /me`, `GET /appointments`, `PATCH /appointments/:id/status`, `GET /stats` |
| **Empresas (admin)** | `GET /api/admin/businesses`, `GET /:id`, `PATCH /:id/{approve,reject,suspend,reactivate}` |
| **Admin** | `GET /api/admin/stats`, `/users`, `PUT /:id/toggle` |

---

## 🧪 Tests

```bash
cd backend
npm test
```

**Cobertura actual: 39 tests en 5 suites verdes.**

| Suite | Cubre |
|-------|-------|
| `auth.test.js` | Registro, login con cookie httpOnly, bloqueo `EMAIL_NOT_VERIFIED`, `/me` con cookie, logout, forgot-password (no enumera usuarios) |
| `appointments.test.js` | Listado paginado con cap a 100, autorización por rol, rechazo de fecha pasada, ignorar `precio_pagado` del cliente |
| `scheduler.test.js` | Limpieza de tokens expirados, conserva vigentes, idempotencia |
| `reviewRequest.test.js` | Cron post-servicio: 4 casos (elegible, demasiado reciente, ya enviado, cancelada) + idempotencia |
| `admin.test.js` | Acciones administrativas con autorización |

Tests son de **integración real contra MySQL** (no mocks), garantizando que las queries Prisma son sintácticamente correctas y los constraints de BD se respetan.

---

## 🚢 Despliegue en VPS

### Backend con PM2

```bash
# En el servidor (Ubuntu 22.04 + Node 20)
cd /var/www/reservas/backend
npm ci --production
cp .env.example .env
# Editar .env con valores de PRODUCCIÓN

# Aplicar migraciones — usar deploy, NUNCA dev en producción
npx prisma migrate deploy

# (Opcional) cargar datos demo
npm run seed

# Arrancar como proceso supervisado
npm install -g pm2
pm2 start src/index.js --name reservas-api
pm2 save
pm2 startup   # para que arranque solo al rebootear
```

### Frontend con Nginx

```bash
cd /var/www/reservas/frontend
npm ci
echo "VITE_API_URL=https://api.tudominio.com/api" > .env.production
npm run build
# Sube dist/ al servidor (o construye directamente en él)
```

Configuración Nginx mínima:

```nginx
server {
    listen 443 ssl http2;
    server_name tudominio.com;

    root /var/www/reservas/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;   # SPA fallback
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 10M;          # uploads
    }
}
```

### Variables de entorno **obligatorias** en producción

`NODE_ENV=production`, `JWT_SECRET` (rotado), `DATABASE_URL`, `FRONTEND_URL`, `TZ=Europe/Madrid`, las 4 de Cloudinary, las 5 de SMTP.

### Recursos auxiliares

- SSL con `certbot --nginx -d tudominio.com`
- Firewall: `ufw allow 22,80,443/tcp && ufw enable`
- Backups MySQL: cron diario con `mysqldump`

---

## 🎯 Decisiones técnicas destacadas

1. **JWT en cookie httpOnly + sameSite strict, no localStorage.** Inmune a XSS (un script malicioso no puede leer la cookie). El sameSite strict mitiga CSRF en navegadores modernos. La cookie se firma con HS256 y caduca a las 24 h.

2. **Pricing centralizado server-side.** El cliente nunca envía `precio_pagado`: el backend lo recalcula dentro de la transacción que crea la cita, consultando `servicio.precio` y aplicando el descuento si lo hay. Cierra el agujero clásico de "modifico el body para reservar a 0,01 €".

3. **Códigos de descuento con consumo atómico.** Cada uso incrementa `usos_actuales` con `update increment` en BD dentro de la misma transacción que valida `max_usos` y `fecha_expiry`. Sin race conditions.

4. **Multi-tenancy SaaS aditiva con `business_id` NULLABLE.** Permite introducir el modelo `Business` sin migración destructiva: los datos legacy quedan con `business_id = NULL` y la app sigue funcionando. Los nuevos registros se asocian automáticamente. Diseño preparado para evolucionar a multi-tenancy completa cambiando NULLABLE → NOT NULL tras backfill.

5. **Transacciones Prisma para integridad de slot.** Crear una cita comprueba conflictos (`empleado_id`, `fecha`, rangos horarios solapados) y crea la fila en una sola transacción. Dos clientes pulsando "reservar" simultáneamente en el mismo slot: solo uno gana, el otro recibe 409.

6. **stripUnknown en Joi.** El middleware de validación descarta silenciosamente cualquier campo no contemplado en el schema. Defensa en profundidad: aunque un atacante envíe `precio_pagado: 0.01` o `rol: 'ADMIN'`, llega vacío al controller.

---

## 🔮 Trabajo futuro

- **App móvil nativa** (React Native o Flutter) — descartada en favor de PWA responsive por restricciones de tiempo
- **Multi-tenancy completa**: migrar `business_id` de NULLABLE a NOT NULL, separar `SUPER_ADMIN` de `ADMIN`, scoping en todos los endpoints
- **Gestión de servicios y empleados desde el panel BUSINESS_OWNER** (CRUD propio del owner, hoy es global)
- **Subida de logo y galería del negocio** desde el wizard de registro y el perfil
- **Dashboard de estadísticas con gráficos Recharts** para el owner (ingresos por mes, top servicios, heatmap de horas pico)
- **Pasarela de pago real** (Stripe) — actualmente la pasarela es simulada
- **Refresh tokens** + invalidación server-side del JWT en logout
- **WebSockets** (Socket.IO) para notificaciones en tiempo real, en lugar del polling cada 60 s
- **CSP con Helmet** finamente afinada para Cloudinary + tiles OSM
- **Tests E2E** con Playwright cubriendo el flujo completo cliente → owner → admin
- **PWA** con service worker para instalación offline en móvil

---

**Autor:** Andrei Iordache · **Tutor:** [Profesor TFG] · **Curso:** 2º DAM 2025/2026
