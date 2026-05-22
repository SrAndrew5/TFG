# 📸 Guía de Capturas de Pantalla — CoworkPro TFG

> **Servidores necesarios:**
> - Backend: `cd backend && npm run dev` → puerto 3001
> - Frontend: `cd frontend && npm run dev` → puerto 5173
>
> **Cuentas de prueba:**
> | Rol | Email | Contraseña |
> |-----|-------|------------|
> | Admin | `admin@reservas.local` | `Admin123!` |
> | Cliente | `cliente@reservas.local` | `Cliente123!` |
> | Business Owner (ACTIVO) | `info@spacemad.com` | `password123` |
> | Business Owner (PENDIENTE) | `info@coworkhub.com` | `password123` |

---

## ✅ Capturas YA HECHAS (diagramas copiados de `diagramas_uml/`)

| # | Imagen | Archivo en `capturas/` |
|---|--------|----------------------|
| 5 | Diagrama Entidad/Relación | `05_diagrama_entidad_relacion.png` ✅ |
| 7 | Diagrama UML de casos de uso | `07_diagrama_uml_casos_de_uso.png` ✅ |
| 8 | Diagrama UML de clases | `08_diagrama_uml_clases.png` ✅ |
| 9 | Diagrama de secuencia de reserva | `09_diagrama_secuencia_reserva.png` ✅ |
| 10 | Diagrama de despliegue AWS | `10_diagrama_despliegue_aws.png` ✅ |

---

## 📸 Capturas PENDIENTES (una por una)

---

### 1. Prototipo en Figma o bocetos iniciales
- **Qué capturar:** Tu diseño en Figma (si lo tienes) o una vista general del diseño inicial
- **Dónde ir:** Abre tu proyecto de Figma en el navegador
- **Alternativa:** Si no tienes Figma, puedes usar la pantalla principal como "resultado final del prototipo"
- **Guardar como:** `capturas/01_prototipo_figma.png`

---

### 2. Pantalla principal de la aplicación web
- **Sesión:** SIN login (cierra sesión si la tienes abierta)
- **URL:** http://localhost:5173/explorar
- **Qué capturar:** La página del explorador de negocios con las tarjetas de coworking visibles
- **Guardar como:** `capturas/02_pantalla_principal.png`

---

### 3. Dashboard del propietario
- **Sesión:** Login como Business Owner → `info@spacemad.com` / `password123`
- **URL:** http://localhost:5173/business/dashboard
- **Qué capturar:** El panel de control completo con estadísticas y KPIs
- **Guardar como:** `capturas/03_dashboard_propietario.png`

---

### 4. Aplicación móvil en dispositivo físico
- **Opción A:** Si tienes la app React Native/Expo en un móvil, haz foto al dispositivo
- **Opción B:** Abre http://localhost:5173/explorar en el navegador, pulsa F12, activa el modo responsive (Ctrl+Shift+M en Chrome), selecciona un dispositivo como "iPhone 14 Pro" y haz la captura
- **Guardar como:** `capturas/04_app_movil.png`

---

### 5. Diagrama Entidad/Relación
- **✅ YA COPIADO** desde `diagramas_uml/06_modelo_entidad_relacion.png`
- **Archivo:** `capturas/05_diagrama_entidad_relacion.png`

---

### 6. Modelo relacional de PostgreSQL o Prisma
- **Opción A (recomendada):** Ejecuta `cd backend && npx prisma studio` → se abre en http://localhost:5555, captura la vista con todas las tablas
- **Opción B:** Abre el archivo `backend/prisma/schema.prisma` en VS Code y haz captura del código
- **Guardar como:** `capturas/06_modelo_relacional_prisma.png`

---

### 7. Diagrama UML de casos de uso
- **✅ YA COPIADO** desde `diagramas_uml/02_casos_de_uso.png`
- **Archivo:** `capturas/07_diagrama_uml_casos_de_uso.png`

---

### 8. Diagrama UML de clases
- **✅ YA COPIADO** desde `diagramas_uml/03_diagrama_clases.png`
- **Archivo:** `capturas/08_diagrama_uml_clases.png`

---

### 9. Diagrama de secuencia de reserva
- **✅ YA COPIADO** desde `diagramas_uml/04_secuencia_reserva.png`
- **Archivo:** `capturas/09_diagrama_secuencia_reserva.png`

---

### 10. Diagrama de despliegue AWS
- **✅ YA COPIADO** desde `diagramas_uml/01_arquitectura_y_medios.png`
- **Archivo:** `capturas/10_diagrama_despliegue_aws.png`

---

### 11. Terminal ejecutando frontend y backend
- **Qué capturar:** Tu terminal/PowerShell mostrando AMBOS servidores corriendo a la vez
- **Consejo:** Abre dos terminales lado a lado, una con el backend (`API servidor arrancado, port: 3001`) y otra con el frontend (`VITE ready, Local: http://localhost:5173/`)
- **Guardar como:** `capturas/11_terminal_servidores.png`

---

### 12. Panel de administración
- **Sesión:** Login como Admin → `admin@reservas.local` / `Admin123!`
- **URL:** http://localhost:5173/admin
- **Qué capturar:** El dashboard principal del admin con estadísticas generales
- **Guardar como:** `capturas/12_panel_administracion.png`

---

### 13. Moderación de negocios
- **Sesión:** Seguir como Admin (misma sesión que la captura 12)
- **URL:** http://localhost:5173/admin/businesses
- **Qué capturar:** La lista de negocios con sus estados (ACTIVO, PENDIENTE, etc.) y botones de gestión
- **Guardar como:** `capturas/13_moderacion_negocios.png`

---

### 14. Tabla de auditoría
- **Sesión:** Seguir como Admin
- **URL:** http://localhost:5173/admin → busca la sección/pestaña de auditoría o logs
- **Alternativa:** Si no hay vista de auditoría en el frontend, puedes capturar la tabla `audit_logs` desde Prisma Studio (`npx prisma studio` → click en AuditLog)
- **Guardar como:** `capturas/14_tabla_auditoria.png`

---

### 15. CRUD de recursos (espacios)
- **Sesión:** Login como Business Owner → `info@spacemad.com` / `password123`
- **URL:** http://localhost:5173/business/resources
- **Qué capturar:** La vista con la lista de recursos/espacios del negocio con opciones de crear, editar, eliminar
- **Guardar como:** `capturas/15_crud_recursos.png`

---

### 16. Dashboard con KPIs
- **Sesión:** Seguir como Business Owner (misma sesión que captura 15)
- **URL:** http://localhost:5173/business/dashboard
- **Qué capturar:** Las tarjetas de KPIs (reservas, ingresos, clientes, etc.)
- **Nota:** Es la misma URL que captura 3, pero puedes enfocar más en los KPIs/métricas
- **Guardar como:** `capturas/16_dashboard_kpis.png`

---

### 17. Pantalla de login
- **Sesión:** Cierra sesión primero (logout)
- **URL:** http://localhost:5173/login
- **Qué capturar:** El formulario de inicio de sesión completo
- **Guardar como:** `capturas/17_pantalla_login.png`

---

### 18. Pantalla de registro
- **Sesión:** Sin login
- **URL:** http://localhost:5173/register
- **Qué capturar:** El formulario de registro de nuevo usuario completo
- **Guardar como:** `capturas/18_pantalla_registro.png`

---

### 19. Mapa Leaflet
- **Sesión:** Sin login (o con login, da igual)
- **URL:** http://localhost:5173/explorar
- **Qué capturar:** Enfócate en la parte del MAPA interactivo con los marcadores de los negocios. Si el mapa tiene zoom, haz zoom para que se vean los pins de los coworkings
- **Guardar como:** `capturas/19_mapa_leaflet.png`

---

### 20. Historial de reservas
- **Sesión:** Login como Cliente → `cliente@reservas.local` / `Cliente123!`
- **URL:** http://localhost:5173/my-bookings
- **Qué capturar:** La lista de reservas del usuario (pasadas y futuras)
- **Guardar como:** `capturas/20_historial_reservas.png`

---

### 21. Captura final de la plataforma funcionando
- **Sesión:** Sin login o con login de cliente
- **URL:** http://localhost:5173/explorar o http://localhost:5173/home
- **Qué capturar:** Una vista general bonita de la plataforma funcionando — la mejor vista que tengas. Puede ser la página principal con negocios cargados y el mapa visible
- **Guardar como:** `capturas/21_plataforma_final.png`

---

## 📋 Checklist Final

| # | Captura | Archivo | Estado |
|---|---------|---------|--------|
| 1 | Prototipo Figma | `01_prototipo_figma.png` | ⬜ |
| 2 | Pantalla principal | `02_pantalla_principal.png` | ⬜ |
| 3 | Dashboard propietario | `03_dashboard_propietario.png` | ⬜ |
| 4 | App móvil | `04_app_movil.png` | ⬜ |
| 5 | Diagrama E/R | `05_diagrama_entidad_relacion.png` | ✅ |
| 6 | Modelo Prisma | `06_modelo_relacional_prisma.png` | ⬜ |
| 7 | UML casos de uso | `07_diagrama_uml_casos_de_uso.png` | ✅ |
| 8 | UML clases | `08_diagrama_uml_clases.png` | ✅ |
| 9 | Secuencia reserva | `09_diagrama_secuencia_reserva.png` | ✅ |
| 10 | Despliegue AWS | `10_diagrama_despliegue_aws.png` | ✅ |
| 11 | Terminal servidores | `11_terminal_servidores.png` | ⬜ |
| 12 | Panel admin | `12_panel_administracion.png` | ⬜ |
| 13 | Moderación negocios | `13_moderacion_negocios.png` | ⬜ |
| 14 | Tabla auditoría | `14_tabla_auditoria.png` | ⬜ |
| 15 | CRUD recursos | `15_crud_recursos.png` | ⬜ |
| 16 | Dashboard KPIs | `16_dashboard_kpis.png` | ⬜ |
| 17 | Pantalla login | `17_pantalla_login.png` | ⬜ |
| 18 | Pantalla registro | `18_pantalla_registro.png` | ⬜ |
| 19 | Mapa Leaflet | `19_mapa_leaflet.png` | ⬜ |
| 20 | Historial reservas | `20_historial_reservas.png` | ⬜ |
| 21 | Plataforma final | `21_plataforma_final.png` | ⬜ |

> **Total:** 5 ya hechas ✅ | 16 pendientes ⬜
