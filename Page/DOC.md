# Documentación del Proyecto Backend (Django)

Este documento detalla exclusivamente el desarrollo, estructura y características del backend del proyecto, implementado en Django para una plataforma de comercio electrónico B2B (Business-to-Business). Se omite completamente cualquier referencia a la capa del Frontend.

## 1. ¿Qué se realizó?
Se desarrolló la arquitectura backend, lógica de negocio y base de datos (sistema MVT y bases para API) para un marketplace de tipo B2B. El sistema está diseñado para manejar catálogos de productos, diferentes roles de usuarios corporativos (mayoristas, minoristas, consumidores finales), suscripciones de vendedores, reglas de negocio específicas para ventas al por mayor y la gestión de pedidos y carritos de compras.

## 2. ¿Cómo se hizo?
El desarrollo fue llevado a cabo utilizando **Python** como lenguaje principal y **Django 5.2.15** como framework base, adoptando el patrón de diseño arquitectónico MVT (Modelo-Vista-Template). Se implementaron diversas herramientas y librerías de soporte:
- **Base de Datos:** PostgreSQL, gestionada y conectada de forma segura a través de `dj-database-url` y `psycopg2-binary`.
- **Manejo de Archivos Estáticos:** Integración con `whitenoise` para optimizar, comprimir y servir archivos de forma eficiente en un entorno de producción.
- **Servidor y Despliegue:** Configuración lista para entornos productivos con `gunicorn` y orquestación a través de contenedores mediante `Docker` y `docker-compose`. Las credenciales se gestionan vía variables de entorno (`python-dotenv`).
- **Autenticación y APIs:** Se emplea autenticación basada en sesiones de Django (encriptadas en BD), además de contar con dependencias instaladas (Django Rest Framework) preparadas para futuras integraciones y consumo por clientes externos.

## 3. ¿Con qué fin?
El objetivo principal de esta arquitectura es proveer un núcleo de negocio escalable, seguro e inteligente, capaz de:
- Mostrar y diferenciar precios automáticamente dependiendo del rol de quien consulta el catálogo (precio público vs. precio minorista con descuento).
- Validar y hacer cumplir reglas estrictas del comercio B2B, tales como la Cantidad Mínima de Pedido (MOQ) y compras en múltiplos de un lote o caja.
- Gestionar planes de suscripción para proveedores (mayoristas), controlando automáticamente sus límites de publicación según su plan activo.
- Administrar la seguridad y la verificación de identidades empresariales mediante la solicitud de documentos y aprobación manual de roles, mitigando fraudes.

## 4. Estructura y Organización del Proyecto
El proyecto backend está modularizado, lo que facilita el mantenimiento, la separación de responsabilidades y el trabajo colaborativo. La raíz principal es la carpeta `backend/`, donde reside el entorno Docker y la carpeta `B2B/` que contiene el ecosistema completo de Django.

```text
backend/
├── .env                    # Variables de entorno seguras (claves, configuración BD)
├── Dockerfile              # Instrucciones para la construcción de la imagen de producción
├── docker-compose.yml      # Orquestación de servicios (Django App + PostgreSQL)
└── B2B/                    # Raíz del proyecto y entorno de ejecución Django
    ├── manage.py           # Script principal de comandos de administración
    ├── requirements.txt    # Definición de dependencias exactas
    ├── B2B/                # Carpeta Core y configuración global de Django
    ├── catalog/            # Aplicación de inventario y catálogo de productos
    ├── core/               # Aplicación base y vistas globales
    ├── orders/             # Aplicación de gestión de pedidos
    ├── subscriptions/      # Aplicación de manejo de suscripciones y planes
    ├── users/              # Aplicación de sistema de usuarios extendido (CustomUser)
    ├── media/              # Directorio de archivos subidos por los usuarios (ej. RUC)
    ├── static/             # Archivos estáticos (recolectados para producción)
    └── templates/          # Plantillas globales de renderizado HTML
```

## 5. Funcionalidad de cada carpeta (App) desarrollada

- **`B2B/B2B/` (Configuración Principal):** Contiene las configuraciones globales (`settings.py`), el enrutador principal (`urls.py`) y las configuraciones WSGI para el despliegue. Aquí se centraliza la seguridad, middleware, base de datos y comportamiento global de Django.
- **`B2B/catalog/`:** Administra la lógica de los productos y categorías. Posee un motor de precios avanzado que diferencia tipos de clientes, controla las cantidades mínimas de pedido (MOQ) y valida que las publicaciones respeten los límites de las suscripciones del proveedor.
- **`B2B/users/`:** Reemplaza y extiende el sistema de usuarios de Django para soportar requerimientos B2B. Añade campos para información fiscal (RUC, razón social), control de documentos de verificación y maneja un sistema de Roles estricto (`VISITANTE`, `CONSUMIDOR`, `MINORISTA`, `MAYORISTA`, `ADMIN`).
- **`B2B/core/`:** Actúa como la columna vertebral transversal. Contiene lógica común como *context processors* (útiles para mantener el estado global del carrito en toda la página), controladores de flujo general y renderizado principal que no pertenece a una sola entidad.
- **`B2B/orders/`:** Centraliza y procesa el flujo del carrito de compras. Gestiona el cálculo de totales, la conversión de carritos a pedidos en firme, y mantiene el historial y estado logístico de cada transacción.
- **`B2B/subscriptions/`:** Automatiza el servicio de membresías para mayoristas. Verifica constantemente si un vendedor tiene una suscripción activa y válida, bloqueando sus privilegios o publicaciones en caso de impago o vencimiento.

## 6. Cumplimiento con Estándares de Seguridad, Buenas Prácticas e ISOs

### Seguridad Informática y OWASP
El proyecto respeta firmemente los estándares de seguridad web internacionales:
- **Prevención de Ataques Comunes:** Empleo activo de middleware nativo para mitigar Cross-Site Request Forgery (`CsrfViewMiddleware`), inyección SQL (mitigada por la abstracción y limpieza del ORM de Django), Clickjacking (`XFrameOptionsMiddleware`) y control estricto de los Host permitidos.
- **Gestión Segura de Secretos:** Absoluta separación de la configuración y el código. Variables críticas como `SECRET_KEY` o URL de base de datos no están en el código fuente, sino controladas en archivos `.env`.
- **Políticas de Autenticación:** Empleo de `AUTH_PASSWORD_VALIDATORS` para evitar contraseñas débiles, políticas restrictivas en la expiración de las sesiones (`SESSION_COOKIE_AGE`) y configuración CORS.

### Buenas Prácticas de Programación (Clean Code)
- **Principios SOLID y "Fat Models, Skinny Views":** El código delega correctamente las reglas de negocio a los Modelos. Por ejemplo, la validación de cantidad B2B y límites de suscripción ocurren en el modelo `Producto` (método `clean` y métodos de instancia), dejando a los controladores (vistas) simples y legibles.
- **Integridad de los Datos:** Uso extensivo de clases `TextChoices` para enums, y validadores nativos (ej. `MinValueValidator`) previniendo el ingreso de información corrupta antes de llegar a la base de datos.
- **Despliegue Estandarizado y Escalable:** Adopción de contenedores (Docker) garantizando paridad entre el entorno de desarrollo y producción.

### Alineación con Normativas ISO
Sin ser una plataforma formalmente auditada, la arquitectura y diseño sientan las bases para el cumplimiento de normativas:
- **ISO 27001 (Seguridad de la Información):** Cumple mediante la implementación de Control de Acceso Basado en Roles (RBAC), segmentando la información. Cuenta además con un flujo de "Verificación de Empresa", lo que asegura que solo entidades manual y documentalmente validadas acceden a información sensible (precios de mayorista).
- **ISO/IEC 25010 (Calidad del Producto de Software):** 
  - *Adecuación Funcional:* Satisface completamente los escenarios complejos del e-commerce B2B (Múltiplos de lotes, precios diferenciados).
  - *Mantenibilidad:* Lograda a través de alta modularidad (Aplicaciones independientes), uso de docstrings formales y nomenclaturas claras y descriptivas a nivel general del código.
