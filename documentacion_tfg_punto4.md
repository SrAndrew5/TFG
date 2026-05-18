# CAPÍTULO 4: MANUALES

Este capítulo constituye la guía operativa integral de **CoworkPro**, proporcionando las especificaciones de despliegue y el manual de usuario para cada uno de los roles autorizados.

---

## 4.1. Manual de Instalación y Despliegue

### 4.1.1. Requisitos Previos del Sistema
Para la ejecución local o en servidor, se requiere:
*   **Node.js:** Versión 18.x, 20.x o 22.x (Recomendado 22.x LTS).
*   **NPM:** Versión 9.x o superior.
*   **Base de Datos:** MySQL Server 8.0 o superior (Local o en AWS RDS).
*   **Servidor Web (Solo Producción):** Nginx y PM2 instalado globalmente.

---

### 4.1.2. Despliegue en Entorno de Desarrollo (Localhost)

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/SrAndrew5/TFG.git coworkpro-local
    cd coworkpro-local
    ```
2.  **Configuración del Backend:**
    *   Entra en `backend/` e instala dependencias: `npm install`
    *   Crea un archivo `.env` tomando como plantilla el `.env.example` y configura tus credenciales de base de datos MySQL local:
        ```ini
        DATABASE_URL="mysql://usuario:contraseña@localhost:3306/reservas_db"
        JWT_SECRET="mi_clave_secreta_desarrollo"
        PORT=3001
        NODE_ENV=development
        ```
    *   Ejecuta las migraciones de Prisma para crear las tablas físicas en local: `npx prisma migrate dev`
    *   Levanta el servidor en modo desarrollo: `npm run dev`
3.  **Configuración del Frontend:**
    *   Entra en `frontend/` e instala dependencias: `npm install`
    *   Inicia el servidor local de Vite: `npm run dev`
    *   Abre tu navegador en `http://localhost:5173` para probar la aplicación.

---

### 4.1.3. Despliegue en Entorno de Producción (AWS Cloud)
El despliegue en producción real se realiza sobre la infraestructura aprovisionada en AWS (EC2 + RDS) configurando Nginx y PM2 de acuerdo al manual técnico adjunto en tu archivo local [ec2.md](file:///c:/Users/SrAndrew/Desktop/TrabajoTFG/ProyectoTFG/ec2.md) y la arquitectura de seguridad detallada en [infraestructura_aws.md](file:///C:/Users/SrAndrew/.gemini/antigravity/brain/bbf1716b-3580-4075-b0b0-7eb5ddd56d98/infraestructura_aws.md).

---

## 4.2. Manual de Administración del Sistema (System Admin)

Este manual está dirigido a los administradores de la plataforma global SaaS para la moderación del sistema y auditoría de la plataforma.

### 4.2.1. Iniciar Sesión como Administrador
1.  Entra en **`http://100.51.135.95/`** y haz clic en "Iniciar Sesión".
2.  Escribe el correo `admin@reservas.local` y la contraseña `Admin123!`.

---

### 4.2.2. Moderación y Aprobación de Negocios
Los negocios registrados entran en estado `PENDIENTE` y no aparecen en el mapa público de clientes hasta ser aprobados:
1.  Navega a la sección **"Aprobación de Negocios"** en tu panel superior.
2.  Verás la lista de negocios pendientes. Haz clic en "Ver Detalles" para inspeccionar sus datos fiscales (CIF) y su información de contacto.
3.  Haz clic en el botón verde **"Aprobar Negocio"** para darlo de alta en producción, o en el botón rojo **"Rechazar"** (escribiendo el motivo del rechazo).

> [!NOTE]
> **📸 CAPTURA DE PANTALLA REQUERIDA: PANEL DE APROBACIÓN DE NEGOCIOS**
> *   **Acción:** Estando en el panel de administrador, ve al módulo de negocios pendientes y pulsa en ver detalles de algún negocio demo.
> *   **Captura:** Captura el panel con la lista de negocios pendientes y el modal de aprobación/rechazo abierto.
> *   *Nombre recomendado:* `manual_admin_aprobacion.png`

`[INSERTAR AQUÍ: manual_admin_aprobacion.png]`

---

### 4.2.3. Control de Cumplimiento: Suspensión de Negocios en Cascada
Si un negocio viola las políticas de uso, puede ser suspendido temporal o definitivamente:
1.  Busca el negocio activo en la lista de negocios del panel de administrador.
2.  Haz clic en **"Suspender Negocio"**. El sistema abrirá un diálogo solicitando el motivo.
3.  Al confirmar, el sistema ejecuta una transacción ACID que:
    *   Pasa el estado del negocio a `SUSPENDIDO`.
    *   Desactiva a todos sus empleados y recursos de coworking.
    *   **Cancela en cascada todas las citas e independientes futuras** y dispara un correo electrónico informativo de cancelación a todos los clientes afectados de forma asíncrona.

---

### 4.2.4. Consulta de Logs de Auditoría (Audit Trail)
Para la trazabilidad e inspección legal, todas las acciones quedan registradas en un log inmutable:
1.  Ve al apartado **"Logs de Auditoría"** en el menú.
2.  Podrás filtrar por usuario, tipo de acción (creación, modificación, eliminación) o fecha para ver los registros del sistema.

---

## 4.3. Manual de Usuario (Cliente y Business Owner)

### 4.3.1. Portal del Cliente (Flujo de Reserva de Servicios y Espacios)

#### A. Registro y Login
Cualquier persona puede registrarse en la plataforma completando el formulario de registro en `/register`. Una vez dentro, podrá rellenar sus datos en su panel de perfil.

> [!NOTE]
> **📸 CAPTURA DE PANTALLA REQUERIDA: FORMULARIO DE REGISTRO DE CLIENTES**
> *   **Acción:** Ve a la URL **`http://100.51.135.95/register`** y captura el formulario de registro responsivo.
> *   *Nombre recomendado:* `manual_usuario_registro.png`

`[INSERTAR AQUÍ: manual_usuario_registro.png]`

#### B. Reservar un Servicio
1.  Ve al mapa, busca y selecciona un centro (ej. Peluquería o Centro de Estética).
2.  Elige el servicio (ej. "Corte de Pelo") y el profesional de tu preferencia.
3.  El sistema bloqueará temporalmente la agenda del empleado mediante un bloqueo transaccional mientras completas el checkout, evitando solapamientos simultáneos.
4.  Introduce un cupón de descuento válido (ej. `DESCUENTO10`) y confirma tu cita.

> [!NOTE]
> **📸 CAPTURA DE PANTALLA REQUERIDA: MIS RESERVAS ACTIVAS (PORTAL CLIENTE)**
> *   **Acción:** Con la sesión iniciada como cliente (`cliente@reservas.local` / `Cliente123!`), ve a tu panel de perfil y selecciona la pestaña "Mis Reservas".
> *   **Captura:** Captura el historial donde se vean tus citas agendadas con su estado (Confirmada, Pendiente, Completada) y el precio pagado con el descuento.
> *   *Nombre recomendado:* `manual_usuario_mis_reservas.png`

`[INSERTAR AQUÍ: manual_usuario_mis_reservas.png]`

#### C. Descarga de Datos de Privacidad (RGPD)
De conformidad con el Reglamento General de Protección de Datos:
1.  Ve a tu perfil de usuario.
2.  En la sección "Seguridad y Privacidad", haz clic en el botón **"Descargar mis datos en JSON"**.
3.  El navegador descargará automáticamente un archivo estructurado conteniendo todo tu historial de citas, reseñas, perfil y logs asociados.

---

### 4.3.2. Manual del Propietario de Negocio (Gestión Comercial)

#### A. Configurar Espacios y Calendarios de Empleados
Como propietario de coworking o salón de servicios, puedes autogestionar tus recursos:
1.  Inicia sesión como propietario (ej. `info@spacemad.com` / `password123`).
2.  Ve al menú **"Gestionar Recursos"** o **"Gestionar Servicios"** para dar de alta mesas de coworking o servicios de citas.
3.  En la sección **"Calendarios de Empleados"**, selecciona un empleado y pulsa en "Configurar Horarios" para definir sus jornadas laborables recurrentes de lunes a domingo.

> [!NOTE]
> **📸 CAPTURA DE PANTALLA REQUERIDA: GESTIÓN DE RECURSOS DEL COWORKING**
> *   **Acción:** Con sesión iniciada como propietario del coworking, ve al menú lateral y entra en "Gestionar Recursos".
> *   **Captura:** Captura la tabla o tarjetas que listan el inventario de recursos de tu coworking (mesas, oficinas, salas) con sus capacidades y precios por hora.
> *   *Nombre recomendado:* `manual_owner_recursos.png`

`[INSERTAR AQUÍ: manual_owner_recursos.png]`
