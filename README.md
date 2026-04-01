# 🗓️ Sistema de Reservas Multiplataforma

**Proyecto intermodular 2º DAM — IES Augustóbrigas (2025/2026)**

Sistema de reservas para negocios locales con dos verticales:
- **Coworking**: Mesas, salas de reuniones, despachos, puestos de trabajo
- **Peluquería/Barbería**: Citas con empleados para servicios específicos

## 🏗️ Stack Tecnológico

| Componente | Tecnología |
|-----------|-----------|
| Backend | Node.js + Express + Prisma |
| Base de datos | PostgreSQL 16 |
| Frontend Web | React + Vite + TailwindCSS v4 |
| Frontend Móvil | React Native + Expo |
| Auth | JWT |
| Storage | MinIO (S3-compatible) |
| Email | Mailpit (dev) / AWS SES (prod) |

## 🚀 Quickstart — Desarrollo Local

### Requisitos previos
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Node.js 20 LTS](https://nodejs.org/)
- [Git](https://git-scm.com/)

### 1. Levantar infraestructura
```bash
docker compose up -d
```

Esto arranca:
- **PostgreSQL** en `localhost:5432`
- **MinIO** en `localhost:9000` (consola: `http://localhost:9001`)
- **Mailpit** en `localhost:1025` (UI: `http://localhost:8025`)

### 2. Configurar backend
```bash
cd backend
cp ../.env.local .env
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

Backend disponible en `http://localhost:3001`

### 3. Configurar frontend web
```bash
cd frontend
npm install
npm run dev
```

Frontend disponible en `http://localhost:5173`

### 4. Configurar mobile
```bash
cd mobile
npm install
npx expo start
```

Escanear QR con Expo Go en el móvil.

## 📁 Estructura del Proyecto

```
ProyectoAntigravity/
├── docker-compose.yml      # Infraestructura local
├── backend/                # API REST (Node.js + Express)
├── frontend/               # Web app (React + Vite)
├── mobile/                 # App móvil (React Native + Expo)
└── docs/                   # Documentación
```

## 👥 Cuentas de Prueba (después del seed)

| Email | Contraseña | Rol |
|-------|-----------|-----|
| admin@reservas.local | Admin123! | Administrador |
| cliente@reservas.local | Cliente123! | Cliente |

## 📧 Ver Emails de Prueba

Abre `http://localhost:8025` para ver los emails enviados por la aplicación.

## 🗄️ Ver Archivos Subidos

Abre `http://localhost:9001` (usuario: `minioadmin`, contraseña: `minioadmin123`) para ver los archivos almacenados.
