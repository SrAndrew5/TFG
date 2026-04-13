# 🗓️ Sistema de Reservas Multiplataforma

**Proyecto intermodular 2º DAM — IES Augustóbrigas (2025/2026)**

Sistema de reservas para negocios locales con dos verticales:
- **Coworking**: Mesas, salas de reuniones, despachos, puestos de trabajo
- **Peluquería/Barbería**: Citas con empleados para servicios específicos

## 🏗️ Stack Tecnológico

| Componente | Tecnología |
|-----------|-----------|
| Backend | Node.js + Express + Prisma |
| Base de datos | MySQL |
| Frontend Web | React + Vite + TailwindCSS v4 |
| Frontend Móvil | React Native + Expo |
| Auth | JWT |
| Storage | Almacenamiento local (`/uploads`) |
| Email | SMTP configurado en .env |

## 🚀 Quickstart — Desarrollo Local

### Requisitos previos
- [Node.js 20 LTS](https://nodejs.org/)
- Servidor MySQL local activo
- [Git](https://git-scm.com/)

### 1. Configurar backend
```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

Backend disponible en `http://localhost:3001`

### 2. Configurar frontend web
```bash
cd frontend
npm install
npm run dev
```

Frontend disponible en `http://localhost:5173`

### 3. Configurar mobile
```bash
cd mobile
npm install
npx expo start
```

Escanear QR con Expo Go en el móvil.

## 📁 Estructura del Proyecto

```
ProyectoAntigravity/
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

## 📧 Envío de Correos

Si replicas la configuración SMTP de tu proveedor de correo en el archivo `.env`, los correos de reserva se enviarán a través de este servicio.

## 🗄️ Ver Archivos Subidos

Los archivos e imágenes subidos en el sistema se almacenan de forma local en la carpeta `backend/uploads`.
