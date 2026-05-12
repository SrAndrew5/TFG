# AUDITORÍA COMPLETA — Sistema de Reservas Multiplataforma
**Fecha:** 06/05/2026 | **Versión:** 1.0.0 (backend) / 0.0.0 (frontend) | **Stack:** React 19 + Vite 8 / Node.js + Express 4 + Prisma 6 + MySQL 8

---

## 📊 RESUMEN EJECUTIVO

| Experto | Valoración | Veredicto en una frase |
|---------|-----------|----------------------|
| 🎓 Tribunal TFG 2º DAM | **8.4/10** | Proyecto de notable alto con decisiones técnicas de senior; lo hunde la falta de tests de frontend y el pago simulado |
| 📱 Product Manager | **6.5/10** | Base técnica sólida pero el SaaS no es autónomo: el BUSINESS_OWNER no gestiona sus propios servicios |
| 💻 Senior Developer | **7.8/10** | Arquitectura por encima de la media para un DAM; hay inconsistencias y una bug silenciosa que el tribunal puede encontrar |
| **MEDIA** | **7.6/10** | |

---

## ✅ PUNTOS FUERTES (coinciden los 3 expertos)

- **JWT en httpOnly cookie**: No localStorage. Decisión correcta de seguridad que muy pocos alumnos de DAM hacen. Suma puntos desde los tres ángulos: seguridad (tribunal), confianza del usuario (PM), código profesional (dev).

- **Transacciones Prisma para slot-booking**: La creación de cita verifica conflictos y crea la fila en un único `$transaction`. Dos reservas simultáneas en el mismo slot → solo una gana, la otra recibe 409. Correcto.

- **Módulo SaaS con ciclo de vida real**: PENDIENTE → ACTIVO → SUSPENDIDO / RECHAZADO, con emails automáticos en cada transición y audit log persistente. Para un TFG de DAM, esto es complejidad técnica genuina.

- **React.lazy + Suspense + ErrorBoundary**: Code splitting correcto. El bundle del admin y del panel de negocio no se descarga si no eres admin/owner. Con un ErrorBoundary global encima. Pocas apps de TFG tienen esto.

- **39 tests de integración contra MySQL real**: No mocks. Los tests comprueban que las queries Prisma son sintácticamente válidas y que los constraints de BD se respetan. Esto es más valioso que 200 unit tests con mocks.

- **README de producción**: Documentación tan completa que cualquier dev que clone el repo puede arrancarlo desde cero sin preguntar nada. Incluye decisiones técnicas justificadas, guía de despliegue con PM2 + Nginx y variables de entorno explicadas.

---

## 🔴 CRÍTICO — Arreglar YA

### 1. Bug silenciosa: `dateInput` del Hero nunca llega a la búsqueda

- **Detectado por:** Senior Developer + PM
- **Impacto real:** El campo de fecha en el formulario de búsqueda de la Home es decorativo. El usuario introduce una fecha, hace clic en "Buscar" y la fecha se ignora. El tribunal lo va a probar en la demo.
- **Archivo:** [frontend/src/pages/Home.jsx](frontend/src/pages/Home.jsx) línea 148
- **Fix concreto:**
```jsx
// Actual (línea 148):
to={`/explorar?search=${encodeURIComponent(locationInput.trim())}&tipo=${activeTab === 'coworking' ? 'COWORKING' : 'PELUQUERIA'}`}

// Fix:
to={`/explorar?search=${encodeURIComponent(locationInput.trim())}&tipo=${activeTab === 'coworking' ? 'COWORKING' : 'PELUQUERIA'}${dateInput ? `&fecha=${dateInput}` : ''}`}
```
Y leer `fecha` en ExplorerPage para pre-rellenar el filtro de fecha.
- **Esfuerzo:** 30 minutos

---

### 2. Inconsistencia de formato horario: "está abierto ahora" siempre es `false` para negocios nuevos

- **Detectado por:** Senior Developer
- **Impacto real:** El explorador de negocios muestra el badge "Abierto ahora" usando `hoy.abre && hoy.cierra` (formato legacy). El wizard de registro guarda `franjas: [{abre, cierra}]` (formato nuevo del `BusinessScheduleForm`). Resultado: todos los negocios creados con el nuevo wizard aparecen como "Cerrado" aunque no lo estén. La demo lo puede exponer.
- **Archivo:** [backend/src/controllers/business.controller.js](backend/src/controllers/business.controller.js) línea 706
- **Fix concreto:**
```js
// Actual (línea 706):
const esta_abierto = hoy && !hoy.cerrado && hoy.abre && hoy.cierra
  ? currentTime >= hoy.abre && currentTime <= hoy.cierra
  : false;

// Fix: soportar ambos formatos
const esta_abierto = (() => {
  if (!hoy || hoy.cerrado) return false;
  // Formato nuevo: franjas array
  if (Array.isArray(hoy.franjas)) {
    return hoy.franjas.some(f => f.abre && f.cierra && currentTime >= f.abre && currentTime <= f.cierra);
  }
  // Formato legacy: {abre, cierra} directo
  return hoy.abre && hoy.cierra ? currentTime >= hoy.abre && currentTime <= hoy.cierra : false;
})();
```
- **Esfuerzo:** 20 minutos

---

### 3. `console.error` olvidado en lugar de `logger.error`

- **Detectado por:** Senior Developer
- **Impacto real:** El logging de producción usa pino. Este `console.error` no aparecerá en los logs JSON estructurados. En la defensa, si el tribunal pregunta "¿cómo monitorizas la app en producción?", y muestra el código, esto queda mal.
- **Archivo:** [backend/src/controllers/appointments.controller.js](backend/src/controllers/appointments.controller.js) línea 287
- **Fix concreto:**
```js
// Actual:
.catch((err) => console.error('Error enviando email de cancelación:', err));

// Fix:
.catch((err) => logger.error({ err }, 'Error enviando email de cancelación de cita'));
```
- **Esfuerzo:** 2 minutos

---

### 4. `require` dentro de función (antipatrón Node.js)

- **Detectado por:** Senior Developer
- **Impacto real:** No es un error en runtime (Node cachea los módulos), pero cualquier developer senior que revise el código lo marcará inmediatamente. En la defensa puede ser una pregunta.
- **Archivo:** [backend/src/controllers/business.controller.js](backend/src/controllers/business.controller.js) línea 907
- **Fix concreto:** Mover `const { getAvailableSlots } = require('../services/availability.service');` a la línea 1 del archivo, con los demás requires.
- **Esfuerzo:** 2 minutos

---

### 5. Middleware de rol duplicado

- **Detectado por:** Senior Developer
- **Impacto real:** `business.routes.js` define su propio `requireRol()` (línea 12) que es funcionalmente idéntico a `authorize()` de `middleware/roles.js`. Dos implementaciones del mismo patrón en el mismo proyecto = deuda técnica visible.
- **Archivo:** [backend/src/routes/business.routes.js](backend/src/routes/business.routes.js) línea 12
- **Fix concreto:**
```js
// Eliminar requireRol local y usar:
const { authorize } = require('../middleware/roles');
// Reemplazar requireRol('BUSINESS_OWNER') por authorize('BUSINESS_OWNER')
```
- **Esfuerzo:** 10 minutos

---

## 🟠 IMPORTANTE — Mejoras que elevan el nivel

### 6. BUSINESS_OWNER no puede gestionar sus propios servicios ni empleados

- **Por qué importa:** El PM lo ve como el blocker más crítico para product-market fit. El tribunal puede preguntar "¿cómo añade un negocio nuevo sus servicios?". La respuesta correcta es "lo hace el admin", lo que convierte el SaaS en un CMS-as-a-service sin autonomía para el negocio.
- **Cómo implementarlo:** Añadir endpoints `POST/PUT/DELETE /api/businesses/services` y `/api/businesses/employees` con `authorize('BUSINESS_OWNER')` y filtro por `business_id = req.user.business.id`. En frontend, añadir páginas en `/business/servicios` y `/business/empleados`.
- **Esfuerzo:** 4-6 horas (es la feature que más valor aporta de todas)

---

### 7. Race condition documentada en códigos de descuento

- **Por qué importa:** El propio comentario en `pricing.service.js` lo admite ("La race condition existe en teoría"). Si el tribunal pregunta "¿cómo garantizas la atomicidad del descuento?", la respuesta de que "puede permitir 1 uso extra" no es satisfactoria para nota 10.
- **Cómo implementarlo:**
```js
// Fix real: usar WHERE en el update para garantizar atomicidad
const updated = await tx.codigoDescuento.updateMany({
  where: {
    codigo,
    activo: true,
    OR: [{ max_usos: null }, { usos_actuales: { lt: cd.max_usos } }],
  },
  data: { usos_actuales: { increment: 1 } },
});
if (updated.count === 0) throw httpError(400, 'Código de descuento agotado');
```
- **Esfuerzo:** 30 minutos

---

### 8. Datos de tarjeta en localStorage

- **Por qué importa:** El proyecto habla de seguridad JWT/httpOnly, pero las "tarjetas guardadas" se almacenan en `localStorage` (aunque solo metadatos: last4, expiry, titular, brand). Es una inconsistencia que un profesor de seguridad notará. En producción con Stripe, las tarjetas estarían en Stripe Vault, no en localStorage.
- **Cómo implementarlo:** Para la demo/TFG, añadir un comentario explícito explicando por qué es aceptable en demo. Para producción real: usar Stripe PaymentMethods API.
- **Esfuerzo:** 5 minutos (comentario) / 8 horas (Stripe real)

---

### 9. Optimistic update en NotificationsContext sin revertir correctamente en error

- **Por qué importa:** En `markRead`, se actualiza la UI optimistamente y si falla se llama `refresh()`. Pero `refresh()` recarga **todas** las notificaciones, lo que puede causar un flash de contenido. El patrón correcto es revertir solo la notificación afectada.
- **Archivo:** [frontend/src/context/NotificationsContext.jsx](frontend/src/context/NotificationsContext.jsx) línea 57-64
- **Esfuerzo:** 20 minutos

---

### 10. `getPublicBusinessBySlug` hace 2 queries para reseñas innecesariamente

- **Por qué importa:** Hace `prisma.review.findMany` (últimas 10) y luego otra `prisma.review.findMany` (todas para calcular media y distribución). Se pueden combinar en una sola query.
- **Archivo:** [backend/src/controllers/business.controller.js](backend/src/controllers/business.controller.js) líneas 783-808
- **Esfuerzo:** 30 minutos

---

## 🟡 FEATURES QUE FALTAN PARA SER COMPETITIVO

> Lo que tiene Fresha/Treatwell que esta plataforma no tiene aún

| Feature | Módulo | Impacto | Esfuerzo | Prioridad |
|---------|--------|---------|---------|-----------|
| CRUD servicios/empleados para BUSINESS_OWNER | SaaS | **Alto** | 6h | 1 |
| Pasarela de pago real (Stripe) | Reservas | **Alto** | 12h | 2 |
| BUSINESS_OWNER puede añadir fotos al perfil desde su panel | SaaS | Alto | 3h | 3 |
| Recordatorio SMS (Twilio) | Peluquería | Alto | 4h | 4 |
| Lista de espera cuando no hay slots | Peluquería | Medio | 5h | 5 |
| Reservas recurrentes (cada lunes) | Coworking | Medio | 6h | 6 |
| Dashboard con gráficos (Recharts) para BUSINESS_OWNER | SaaS | Medio | 5h | 7 |
| Facturación PDF | Coworking | Medio | 4h | 8 |
| Gestión vacaciones/festivos del empleado (individual) | Peluquería | Medio | 3h | 9 |
| Panel de métricas globales avanzado para ADMIN | Admin | Bajo | 4h | 10 |
| PWA + manifest.json | UX | Bajo | 2h | 11 |
| Dark mode | UX | Bajo | 3h | 12 |
| Google Calendar sync | Peluquería | Bajo | 5h | 13 |
| Sistema de planes free/pro para negocios | SaaS monetización | Bajo | 15h | 14 |

---

## 💡 CAMBIOS QUE IMPLEMENTARÍA CON 2 SEMANAS MÁS

> En orden de prioridad, realistas para un dev solo

1. **Fix bug dateInput Home.jsx** — porque el tribunal lo va a clicar — 30min
2. **Fix horario format inconsistency** — porque rompe "está abierto ahora" para negocios nuevos — 20min
3. **Fix console.error → logger.error** — porque el tribunal puede ver el código — 2min
4. **CRUD servicios/empleados para BUSINESS_OWNER** — el SaaS no es autónomo sin esto — 6h
5. **Fix race condition descuentos** — justificación técnica correcta ante el tribunal — 30min
6. **Añadir 5-8 tests de componentes React** (BookAppointment, Login, MyAppointments) con Vitest — 4h
7. **Stripe Checkout** (aunque sea solo el flujo básico, sin webhooks) — 8h
8. **PWA manifest.json** — efecto "wow" con el tribunal en móvil — 2h
9. **Dashboard con Recharts** para BUSINESS_OWNER — citas por día/semana — 4h
10. **Unificar requireRol y authorize** — limpieza de código — 10min

---

## 🎓 NOTA DEL TRIBUNAL DAM

| Criterio | Peso | Nota | Comentario |
|----------|------|------|------------|
| Funcionalidad | 25% | **8.5/10** | CRUDs completos, flujo end-to-end funcional, integraciones reales (email, Cloudinary, cron). Resta: pago simulado, BUSINESS_OWNER sin CRUD propio, dateInput decorativo |
| Arquitectura | 20% | **8.0/10** | Separación correcta routes→controllers→services, code splitting, custom hooks, middleware propios. Resta: console.error olvidado, require dentro de función, formato horario inconsistente, middleware duplicado |
| Seguridad | 15% | **9.0/10** | JWT httpOnly, SHA-256 token hashing, no user enumeration, rate limiting, Helmet CSP, RBAC, stripUnknown Joi, select explícito en Prisma. Resta: race condition descuentos, localStorage tarjetas |
| UX/UI | 15% | **8.5/10** | Design system coherente, loading states completos, paso a paso intuitivo en reserva, PaymentModal con flip 3D de tarjeta, toasts, ErrorBoundary. Resta: dateInput no funciona, sin dark mode, búsqueda navbar decorativa |
| Testing | 10% | **7.0/10** | 39 tests integración contra MySQL real (excelente calidad). Resta: cero tests frontend, cero E2E, sin cobertura resourceBookings, panel Business sin tests propios |
| Documentación | 10% | **9.0/10** | README completo y profesional, decisiones técnicas justificadas, Swagger en desarrollo, Mejoras.md con autoevaluación honesta, comentarios de código precisos |
| Complejidad técnica | 5% | **9.5/10** | SaaS multi-tenant con lifecycle states completo, cron jobs con idempotencia, transacciones Prisma, middleware propio stack, Cloudinary, Leaflet/OSM, pricing server-side |
| **NOTA FINAL** | 100% | **8.4/10** | Notable alto. Un par de fixes de 30 minutos y la nota sube a 8.7+ |

---

## 🎯 PREGUNTAS DEL TRIBUNAL — CON RESPUESTAS PREPARADAS

**1. "El pago está simulado. ¿Cómo se integraría Stripe real y qué riesgos de seguridad conlleva?"**

> Respuesta recomendada: "Para integrar Stripe real, el frontend usaría Stripe.js con `createPaymentIntent` en el backend para que la tarjeta nunca pase por nuestros servidores — Stripe gestiona el PCI DSS. El backend crearía un PaymentIntent con el importe calculado server-side, Stripe confirmaría el cobro, y un webhook POST `/api/payments/webhook` (con firma HMAC verificada) marcaría la cita como pagada en BD. El flujo actual ya está preparado para esto: el precio lo calcula el servidor, no el cliente. El mock de pago fue una decisión de scope para el TFG dado el tiempo disponible."

---

**2. "¿Cómo evitas que un negocio vea las citas de otro negocio?"**

> Respuesta recomendada: "El aislamiento es por `business_id`. Cuando un BUSINESS_OWNER llama a `/api/businesses/appointments`, el backend ejecuta `loadActiveBusinessForOwner()` que busca el negocio asociado al `req.user.id` del JWT. Esa función devuelve el negocio o corta con 403/404. Luego el `findMany` filtra explícitamente por `where: { business_id: business.id }`. El `business_id` viene del JWT y la BD, nunca del cuerpo de la petición, así que un atacante no puede falsificarlo."

---

**3. "Veo que en `getPublicBusinesses` calculas la valoración en memoria después de traer hasta 200 negocios con todas sus citas y reseñas. ¿No es eso un problema de rendimiento?"**

> Respuesta recomendada: "Es una limitación conocida del diseño actual. Con 200 negocios y pocas reseñas por negocio, el impacto es asumible. La alternativa correcta sería una query con agregación en BD: un `groupBy` con `_avg(rating)` en la tabla reviews. Lo evité porque Prisma no soporta joins complejos de forma tan directa en una sola query. Es un trade-off documentado: rapidez de desarrollo vs. eficiencia en escala. En producción con muchos negocios, lo migraría a una vista SQL materializada que se recalcule por cron, o añadiría una columna `valoracion_media` desnormalizada en la tabla `businesses` que se actualice en cada nueva review mediante un trigger o evento en el servicio de reviews."

---

**4. "¿Por qué tienes cero tests en el frontend?"**

> Respuesta recomendada: "Es el punto débil que más me pesa. Los 39 tests de integración del backend cubren todos los flujos críticos de negocio y son contra MySQL real, lo cual es más valioso que unit tests con mocks. En el frontend, la decisión fue priorizar funcionalidad y UX completa sobre tests de componentes dado el tiempo del proyecto. Si tuviera más tiempo, añadiría Vitest + Testing Library cubriendo el flujo completo de reserva: renderizar `BookAppointment`, seleccionar empleado/fecha/slot, y verificar que la llamada API se realiza con los parámetros correctos. También añadiría tests E2E con Playwright para el flujo crítico cliente → BUSINESS_OWNER."

---

**5. "¿Qué es el aislamiento multi-tenant y cómo lo has implementado? ¿Es completo?"**

> Respuesta recomendada: "Multi-tenancy significa que múltiples negocios comparten la misma instancia de BD pero solo ven sus propios datos. Lo implementé de forma 'aditiva': añadí `business_id` como campo NULLABLE en Servicio, Empleado, Recurso, Cita y ReservaRecurso. Los datos históricos (creados antes del módulo SaaS) tienen `business_id = NULL` y siguen funcionando. Los nuevos registros se asocian automáticamente. El aislamiento no es completo aún: un ADMIN global puede ver y modificar datos de cualquier negocio, lo cual es correcto en el modelo de plataforma. Pero el BUSINESS_OWNER tiene scope real — sus queries siempre filtran por su `business_id`. Para multi-tenancy completa, el siguiente paso sería hacer `business_id` NOT NULL tras un backfill, y crear un rol `SUPER_ADMIN` separado del `ADMIN` de negocio."

---

**6. [PREGUNTA INCÓMODA] "En `pricing.service.js` comentas que existe una race condition con los códigos de descuento. ¿No invalida eso tu afirmación de 'consumo atómico'?"**

> Respuesta recomendada: "Tienes razón en señalarlo — y lo tengo documentado en el propio código como limitación conocida. El comentario dice explícitamente que el TOCTOU teórico existe: dos requests simultáneos que llegan cuando `usos_actuales = max_usos - 1` podrían ambos pasar el check y ambos consumir. La solución correcta sería reemplazar el `findUnique + update` por un `updateMany` con condición `WHERE usos_actuales < max_usos`, de modo que solo una de las dos queries tendría éxito. No lo implementé así porque MySQL garantiza que la operación de escritura en el `update` es atómica, pero el check previo no está dentro de ese lock. En producción añadiría ese `updateMany` que resuelve el TOCTOU sin necesidad de FOR UPDATE."

---

## 💻 HALLAZGOS DE CÓDIGO (Top 10)

| # | Archivo | Línea | Severidad | Problema | Fix |
|---|---------|-------|-----------|---------|-----|
| 1 | [appointments.controller.js](backend/src/controllers/appointments.controller.js) | 287 | 🟠 | `console.error` en lugar de `logger.error` — ruptura del sistema de logging | Reemplazar por `logger.error({ err }, '...')` |
| 2 | [business.controller.js](backend/src/controllers/business.controller.js) | 706 | 🔴 | `hoy.abre && hoy.cierra` no coincide con el formato `franjas: [{abre, cierra}]` del nuevo wizard — badge "abierto" siempre `false` para negocios nuevos | Añadir soporte para ambos formatos |
| 3 | [Home.jsx](frontend/src/pages/Home.jsx) | 18 + 148 | 🔴 | `dateInput` captura estado pero no se pasa al Link de búsqueda — campo de fecha decorativo | Añadir `&fecha=${dateInput}` a la URL de búsqueda |
| 4 | [business.controller.js](backend/src/controllers/business.controller.js) | 907 | 🟡 | `require()` dentro de una función (`getBusinessAvailability`) — antipatrón Node.js | Mover el require al top del archivo |
| 5 | [business.routes.js](backend/src/routes/business.routes.js) | 12-18 | 🟡 | `requireRol()` definido localmente, duplicado con `authorize()` de `middleware/roles.js` | Usar el middleware centralizado |
| 6 | [business.controller.js](backend/src/controllers/business.controller.js) | 420 | 🟡 | `data: req.body` pasa el body completo de Joi a Prisma sin destructuring explícito — oculta qué campos son actualizables | Destructurar los campos permitidos explícitamente |
| 7 | [pricing.service.js](backend/src/services/pricing.service.js) | 44-46 | 🟠 | TOCTOU en consumo de código de descuento — el check y el update no están en el mismo lock de BD | Usar `updateMany` con condición `WHERE usos < max_usos` |
| 8 | [business.controller.js](backend/src/controllers/business.controller.js) | 783 + 797 | 🟡 | Dos queries separadas a `review` para el mismo negocio (`findMany` × 2) — N+1 innecesario | Combinar en una sola query y calcular stats en JS |
| 9 | [BookAppointment.jsx](frontend/src/pages/BookAppointment.jsx) | 57 | 🟡 | `loadSlots` sin `useCallback` referenciada desde `useEffect` — causa re-render innecesario si el linter de hooks está activo | Envolver en `useCallback` con deps `[selectedEmployee, selectedDate, serviceId]` |
| 10 | [usePaymentMethods.js](frontend/src/hooks/usePaymentMethods.js) | 3 | 🟠 | Metadatos de tarjeta (`last4`, `expiry`, `titular`, `brand`) en `localStorage` — inconsistente con la apuesta por seguridad de la app (aunque sean solo metadatos, un XSS los expondría) | En producción con Stripe, usar Stripe PaymentMethods API. Para TFG, añadir comentario explicativo |

---

## 🚀 ROADMAP POST-TFG

### Si quisieras lanzarlo como producto real:

**Semana 1-2 (MVP mejorado — fixes críticos):**
- [x] Fix bug dateInput en búsqueda del Hero — no costar nada y da mucha mejor UX
- [x] CRUD de servicios y empleados desde el panel BUSINESS_OWNER — sin esto el SaaS no es autónomo
- [x] Fix race condition en códigos de descuento — corrección técnica correcta
- [x] Añadir 8-10 tests de componentes React con Vitest — cubrir BookAppointment y flujo de login
- [x] Fix formato horario (`esta_abierto` para negocios con nuevo wizard)

**Mes 1-3 (v1.1 — producto lanzable):**
- [ ] Stripe Checkout real — sin pago real, ningún negocio pagará por la plataforma
- [ ] Galería de fotos del negocio subible desde el panel BUSINESS_OWNER (Cloudinary ya está configurado)
- [ ] Dashboard con gráficos (Recharts) en `/business/dashboard` — citas por día/semana, ingresos por mes
- [ ] PWA con `manifest.json` + Vite PWA plugin — instalar en móvil en 5 minutos de implementación
- [ ] Recordatorio SMS (Twilio) — reduce no-shows un 30-40% en negocios reales
- [ ] Lista de espera para slots llenos — feature que diferencia de la competencia simple

**Mes 3-6 (v2.0 — monetización):**
- [ ] Sistema de planes (Gratis / Pro 29€/mes) con Stripe Subscriptions — modelo de negocio real
- [ ] WebSockets (Socket.IO) para notificaciones en tiempo real — eliminar el polling de 60 segundos
- [ ] Reservas recurrentes para coworking (cada lunes, cada semana) — feature demandada
- [ ] Facturación PDF para coworking (librería PDFKit o puppeteer)
- [ ] App móvil (React Native o Expo) usando la misma API REST
- [ ] Multi-tenancy completa: `business_id NOT NULL`, separar `SUPER_ADMIN` de `ADMIN`

---

## 💬 VEREDICTO FINAL DE CADA EXPERTO

### 🎓 El Tribunal dice:

Este proyecto merece un **8.4/10** sin dudarlo. En 15 años evaluando TFGs de DAM, he visto pocas veces un alumno que implemente correctamente JWT en httpOnly cookie, SHA-256 en tokens temporales, y transacciones de BD para reservas concurrentes. La documentación es de nivel profesional. El módulo SaaS con PENDIENTE/ACTIVO/SUSPENDIDO/RECHAZADO y emails automáticos en cada transición demuestra comprensión del dominio más allá de hacer CRUDs. Lo que impide el 9+ es la ausencia total de tests de frontend (es la única pata que cojea fuerte), un pago que es 100% teatro, y tres o cuatro inconsistencias de código que en la defensa oral el alumno tendrá que defender. Con dos días de trabajo sobre los fixes críticos marcados en 🔴, la nota podría llegar a 8.8.

---

### 📱 El Product Manager dice:

La arquitectura técnica está muy por encima de lo que necesita un MVP, pero el producto tiene un problema estructural: **el SaaS no es autónomo**. Un BUSINESS_OWNER que se registra, pasa la revisión del admin, y entra a su panel... no puede añadir ni un solo servicio ni un solo empleado sin que el admin global lo haga por él. Eso lo convierte en un sistema de gestión donde el admin lo hace todo, no en un SaaS donde el negocio es autónomo. Para Fresha o Treatwell, el primer flujo post-onboarding es "añade tus servicios". Aquí ese flujo no existe. El explorador con mapa Leaflet es un diferenciador genuino respecto a competidores más básicos. El sistema de reseñas está bien pensado. Pero sin Stripe real y sin autonomía del BUSINESS_OWNER, no hay modelo de negocio. **Potencial claro, pero necesita 2 semanas de trabajo sobre las features correctas para ser lanzable.**

---

### 💻 El Senior Developer dice:

**Contrataría al developer para Junior-Mid Backend con potencial Frontend.** El stack de seguridad (JWT cookie, SHA-256, no user enumeration, rate limit, Helmet CSP afinada) demuestra que ha leído las cosas bien, algo que no es común. Los tests de integración contra MySQL real son una decisión madura — la mayoría de juniors mockean Prisma y no ven los errores de SQL hasta producción. El errorHandler que mapea códigos Prisma (P2002 → 409) a respuestas HTTP correctas es una señal de arquitectura pensada. Lo que me preocupa: el `require()` dentro de función (señal de que algo se copió y pegó), la inconsistencia del formato horario (señal de que el código creció sin un contrato de datos definido), y el `console.error` olvidado (señal de poca atención al detalle en el commit final). Son detalles, pero en un code review de empresa cualquier senior los marcaría. El frontend tiene un buen nivel de UX y el design system es coherente. Con 6-12 meses más de experiencia, este dev estaría listo para un rol Mid.

---

## ⚖️ VEREDICTO DEFINITIVO

> **Un TFG de sobresaliente frustrado: la ambición técnica es real y el resultado es sólido, pero tres decisiones de scope (pago simulado, sin CRUD propio para el BUSINESS_OWNER, sin tests de frontend) le impiden el 9 que su arquitectura merece.**

---

*Auditoría generada mediante análisis exhaustivo de 65+ archivos del repositorio — frontend (páginas, componentes, contextos, hooks, servicios, utilidades) y backend (controladores, rutas, servicios, middleware, validaciones, tests, schema Prisma, seed, documentación).*
