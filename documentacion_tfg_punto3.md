# CAPÍTULO 3: DISEÑO DE LA APLICACIÓN

## 3.1. Prototipo (Capturas de Pantalla de la Aplicación Real)

A continuación se presentan las capturas de pantalla de la interfaz de usuario en producción real de **CoworkPro** (sirviéndose desde el servidor web de AWS en `http://100.51.135.95`). Estos componentes demuestran la fidelidad del diseño responsivo y la consistencia visual de la plataforma.

> [!IMPORTANT]
> **INSTRUCCIONES PARA ANDREI:** 
> Para completar esta sección de tu memoria, abre la URL pública de tu servidor en el navegador, realiza las capturas indicadas en cada cuadro a continuación y reemplaza los placeholders por tus archivos de imagen.

---

### 3.1.1. Vista de Inicio y Mapa Interactivo (Explorer)

> [!NOTE]
> **📸 CAPTURA DE PANTALLA REQUERIDA: VISTA PRINCIPAL DE EXPLORACIÓN**
> *   **Ruta/URL:** Abre **`http://100.51.135.95/`** en tu navegador.
> *   **Credenciales:** No necesitas iniciar sesión.
> *   **Acción:** Haz clic sobre el menú superior en "Explorar Espacios". Desplázate por el mapa de Leaflet y haz clic sobre un marcador de algún coworking (por ejemplo, *Space Madrid Centro* o *WerkHaus Valencia*) para que se abra el popup con la información del negocio sobre el mapa.
> *   **Captura:** Saca una captura de pantalla que abarque toda la ventana del navegador donde se vea el mapa a la derecha y la lista de negocios a la izquierda con un popup del marcador seleccionado abierto.
> *   *Nombre recomendado para guardar la imagen:* `prototipo_01_explorer.png`

`[INSERTAR AQUÍ: prototipo_01_explorer.png]`

---

### 3.1.2. Ficha de Negocio y Formulario de Reserva (Flujo de Checkout)

> [!NOTE]
> **📸 CAPTURA DE PANTALLA REQUERIDA: VISTA DE RESERVA Y PRECIOS**
> *   **Ruta/URL:** Abre **`http://100.51.135.95/`** y pulsa "Iniciar Sesión" con la cuenta de Cliente:
>     *   **Email:** `cliente@reservas.local` | **Contraseña:** `Cliente123!`
> *   **Acción:** En la página principal, haz clic en "Ver Espacio" de *Space Madrid Centro*. Una vez dentro de la ficha de negocio, haz clic en "Reservar" de la mesa o sala de reuniones. Selecciona una fecha, hora de inicio y fin, y escribe el código de descuento **`DESCUENTO10`** en el cajetín de cupón para que se aplique la deducción en directo.
> *   **Captura:** Captura el formulario lateral o modal de reserva donde se vean las horas seleccionadas, el precio original tachado, el descuento aplicado por el cupón y el precio final deducido en directo por el servidor.
> *   *Nombre recomendado para guardar la imagen:* `prototipo_02_reserva.png`

`[INSERTAR AQUÍ: prototipo_02_reserva.png]`

---

### 3.1.3. Dashboard Analítico del Propietario (Business Admin Panel)

> [!NOTE]
> **📸 CAPTURA DE PANTALLA REQUERIDA: PANEL DE CONTROL GERENCIAL**
> *   **Ruta/URL:** Inicia sesión con la cuenta de un Propietario de Negocio demo:
>     *   **Email:** `info@spacemad.com` | **Contraseña:** `password123`
> *   **Acción:** Al acceder al panel, haz clic en la sección "Dashboard" o "Analíticas" del menú lateral. Aquí verás las tarjetas con los ingresos acumulados, ocupación y las gráficas interactivas.
> *   **Captura:** Realiza una captura completa del panel de administración donde se vean las tarjetas de KPIs (ingresos, reservas totales) y las visualizaciones analíticas. Esto demostrará que la plataforma ofrece valor de negocio real para los administradores.
> *   *Nombre recomendado para guardar la imagen:* `prototipo_03_dashboard.png`

`[INSERTAR AQUÍ: prototipo_03_dashboard.png]`

---

### 3.1.4. Panel de Administración Global y Logs de Auditoría (System Admin)

> [!NOTE]
> **📸 CAPTURA DE PANTALLA REQUERIDA: PANEL DE ADMINISTRACIÓN GLOBAL Y AUDITTRAIL**
> *   **Ruta/URL:** Inicia sesión con la cuenta del Administrador Global:
>     *   **Email:** `admin@reservas.local` | **Contraseña:** `Admin123!`
> *   **Acción:** En el menú superior o lateral de administrador, accede al apartado "Logs de Auditoría" (Audit Trail) o "Gestión de Negocios".
> *   **Captura:** Captura la tabla del historial de logs del sistema donde se aprecie el registro ordenado por fecha de las acciones de los usuarios, sus IPs y los detalles JSON de cada operación, lo que valida la rigurosidad de auditoría RGPD requerida por el tribunal.
> *   *Nombre recomendado para guardar la imagen:* `prototipo_04_admin.png`

`[INSERTAR AQUÍ: prototipo_04_admin.png]`

---

## 3.2. Diseño de la Base de Datos

La persistencia del sistema se ha modelado utilizando el paradigma relacional en **MySQL 8.0**, garantizando que el esquema cumpla con la **Tercera Forma Normal (3FN)** para evitar la redundancia de datos y las anomalías de actualización.

### 3.2.1. Diagrama Entidad-Relación (E/R)
Este diagrama conceptual representa las cardinalidades de negocio, entidades fuertes y débiles y restricciones referenciales:

```
[INSERTAR AQUÍ: diagramas_uml/06_modelo_entidad_relacion.png]
```
*(Puedes encontrar la versión de imagen pre-renderizada en el archivo local `diagramas_uml/06_modelo_entidad_relacion.png`)*

### 3.2.2. Modelo Relacional Normalizado
*   **usuarios** (<u>id</u>, nombre, apellidos, email [u], password, telefono, rol, avatar_url, activo, motivo_suspension, email_verificado, created_at, updated_at)
*   **businesses** (<u>id</u>, nombre, slug [u], tipo, cif_nif [u], descripcion, direccion, ciudad, codigo_postal, lat, lng, telefono, web, logo_url, fotos_urls, horario, festivos, estado, motivo_rechazo, *owner_id* [u])
    *   *owner_id* referencia a **usuarios**(id)
*   **empleados** (<u>id</u>, nombre, apellidos, email [u], telefono, especialidad, avatar_url, activo, *business_id*)
    *   *business_id* referencia a **businesses**(id)
*   **servicios** (<u>id</u>, nombre, descripcion, duracion_min, precio, categoria, imagen_url, activo, *business_id*)
    *   *business_id* referencia a **businesses**(id)
*   **servicios_empleados** (<u>id</u>, *servicio_id*, *empleado_id*) [u: (servicio_id, empleado_id)]
    *   *servicio_id* referencia a **servicios**(id)
    *   *empleado_id* referencia a **empleados**(id)
*   **disponibilidades** (<u>id</u>, *empleado_id*, dia_semana, hora_inicio, hora_fin)
    *   *empleado_id* referencia a **empleados**(id)
*   **citas** (<u>id</u>, *usuario_id*, *empleado_id*, *servicio_id*, fecha, hora_inicio, hora_fin, estado, notas, precio_pagado, codigo_descuento, review_request_sent_at, *business_id*)
    *   *usuario_id* referencia a **usuarios**(id)
    *   *empleado_id* referencia a **empleados**(id)
    *   *servicio_id* referencia a **servicios**(id)
    *   *business_id* referencia a **businesses**(id)
*   **recursos** (<u>id</u>, nombre, tipo, descripcion, capacidad, ubicacion, precio_hora, imagen_url, equipamiento, activo, horario_apertura, horario_cierre, latitud, longitud, *business_id*)
    *   *business_id* referencia a **businesses**(id)
*   **reservas_recursos** (<u>id</u>, *usuario_id*, *recurso_id*, fecha, hora_inicio, hora_fin, estado, notas, precio_pagado, codigo_descuento, review_request_sent_at, *business_id*)
    *   *usuario_id* referencia a **usuarios**(id)
    *   *recurso_id* referencia a **recursos**(id)
    *   *business_id* referencia a **businesses**(id)
*   **reviews** (<u>id</u>, *usuario_id*, *servicio_id*, *recurso_id*, *cita_id* [u], *reserva_recurso_id* [u], rating, comentario)
    *   *usuario_id* referencia a **usuarios**(id)
    *   *servicio_id*, *recurso_id*, *cita_id*, *reserva_recurso_id* referencian a sus respectivas tablas.
*   **audit_logs** (<u>id</u>, usuario_id, accion, entidad, entidad_id, datos, ip, created_at)
*   **refresh_tokens** (<u>id</u>, *usuario_id*, token_hash [u], expires_at, created_at, revoked_at)
    *   *usuario_id* referencia a **usuarios**(id)

---

## 3.3. Diseño de la Aplicación (Diagramas UML)

El comportamiento lógico y los flujos transaccionales críticos del sistema se modelan mediante diagramas estándar **UML**.

### 3.3.1. Casos de Uso del Sistema
Representa todos los límites del sistema por rol:
*   `[INSERTAR AQUÍ: diagramas_uml/02_casos_de_uso.png]`

### 3.3.2. Diagrama de Clases
Modelado estructural bajo Prisma ORM para MySQL:
*   `[INSERTAR AQUÍ: diagramas_uml/03_diagrama_clases.png]`

### 3.3.3. Diagrama de Secuencia: Flujo Transaccional de Reserva con Bloqueo Pesimista
Detalla la sincronización temporal y el bloqueo de base de datos para evitar la concurrencia destructiva (dobles reservas):
*   `[INSERTAR AQUÍ: diagramas_uml/04_secuencia_reserva.png]`

### 3.3.4. Diagrama de Secuencia: Flujo en Cascada al Suspender Negocio
Muestra el envío asíncrono de emails y WebSockets durante el control administrativo:
*   `[INSERTAR AQUÍ: diagramas_uml/05_secuencia_suspension.png]`
