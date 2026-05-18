# CAPÍTULO 1: IDENTIFICACIÓN DEL PROYECTO

## 1.1. Ficha Identificativa del Proyecto

*   **Título del Proyecto:** CoworkPro — Plataforma SaaS Multi-Tenant de Gestión de Reservas y Espacios de Coworking
*   **Autor / Alumno:** Andrei Iordache
*   **Ciclo Formativo:** 2º de Desarrollo de Aplicaciones Multiplataforma (2º DAM)
*   **Módulo:** Proyecto Integrado de Fin de Grado (TFG)
*   **Centro Educativo:** IES Augustóbrigas
*   **Año Académico:** 2025/2026
*   **Fecha de Presentación:** Mayo de 2026

---

## 1.2. Descripción Resumida del Proyecto

**CoworkPro** es una plataforma de software distribuida concebida bajo el modelo de negocio **SaaS (Software as a Service) con arquitectura Multi-Tenant**. Su propósito fundamental es resolver el problema de la gestión y reserva de recursos y personal para pequeñas y medianas empresas (PYMEs), unificando en una sola plataforma dos líneas de negocio tradicionalmente fragmentadas: la gestión de citas de servicios personales y el arriendo temporal de recursos físicos de coworking.

A diferencia de las aplicaciones monousuario o locales tradicionales, **CoworkPro** implementa un esquema de aislamiento lógico multi-negocio. Esto permite que cualquier centro de coworking, peluquería, clínica o gimnasio pueda registrarse de forma independiente en la plataforma, obteniendo un subentorno personalizado aislado (tenant), gestionando sus propios inventarios, calendarios, empleados y clientes bajo una base de datos centralizada de alto rendimiento.

El sistema se compone de tres piezas arquitectónicas principales:
1.  **Frontend Responsivo y Multiplataforma (React + PWA):** Diseñado con un enfoque de interfaz fluida (SPA), empaquetado como aplicación web progresiva (Progressive Web App) instalable en dispositivos Android, iOS y sistemas de escritorio.
2.  **API RESTful Segura (Node.js + Express + Prisma ORM):** El núcleo de procesamiento lógico, dotado de un middleware de seguridad estricto, persistencia transaccional y comunicación bidireccional en tiempo real mediante WebSockets (`Socket.io`) para alertas.
3.  **Base de Datos Relacional y Cloud (AWS RDS MySQL):** Diseñada bajo un riguroso esquema normalizado en Tercera Forma Normal (3FN), garantizando la integridad referencial y aislando lógicamente los datos de cada tenant.

---

## 1.3. Justificación del Proyecto

### Justificación Comercial y Social
En el tejido empresarial actual, la transformación digital es un requisito indispensable para la supervivencia de las PYMEs. Sin embargo, las soluciones de software del mercado actual están muy fragmentadas. Los pequeños empresarios se ven obligados a contratar múltiples herramientas inconexas: una para la facturación, otra para reservar mesas de coworking y una tercera para gestionar los turnos de su personal. Esto genera costes elevados y duplicidad de datos. 

**CoworkPro** nace para democratizar el acceso a software de grado corporativo a bajo coste mediante un modelo SaaS único, reduciendo la fricción tecnológica del administrador y mejorando sustancialmente la experiencia del usuario final al ofrecer un portal de reservas rápido, intuitivo e interactivo con mapas dinámicos.

### Justificación Académica y Técnica (Ámbito DAM)
Desde el punto de vista del perfil profesional de **Desarrollo de Aplicaciones Multiplataforma (DAM)**, este proyecto representa la culminación integradora de todas las competencias curriculares avanzadas del ciclo:

*   **Sistemas de Gestión de Bases de Datos:** Diseño físico y lógico de una base de datos MySQL en 3FN, implementando índices optimizados de rendimiento para consultas concurrentes e integridad referencial sólida.
*   **Programación de Servicios y Procesos:** Desarrollo de un middleware de comunicación en tiempo real vía WebSockets, resolviendo problemas críticos de concurrencia y condiciones de carrera (*race conditions*) en reservas simultáneas mediante **bloqueos pesimistas (`SELECT ... FOR UPDATE`)**.
*   **Desarrollo de Interfaces:** Implementación de una interfaz web reactiva responsiva con tecnologías modernas de renderizado eficiente (React SPA), optimización de carga (Code Splitting) e integración multiplataforma móvil/escritorio (PWA) con geolocalización.
*   **Despliegue e Infraestructura Cloud:** Planificación, securización y despliegue real en producción sobre Amazon Web Services (AWS), configurando redes VPC, instancias de procesamiento EC2, servidores de base de datos distribuidos RDS y proxies inversos Nginx configurados como pasarelas seguras.
