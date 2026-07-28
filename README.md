# 🛒 Bazar B2B: Plataforma Transaccional Mayorista

> **Estado del Proyecto:** Desarrollo de MVP (Producto Mínimo Viable) para presentación de Agosto. Todo el sistema (Frontend y Backend) ha sido consolidado exitosamente utilizando **Django** (Arquitectura MVT).

## 🔗 Recursos y Enlaces del Proyecto
* 🚀 **Prototipo Interactivo (Replit):** [Ver Aplicación en Vivo ](https://code-assistant--jscueva5.replit.app/) *(Simulación funcional con Mock Data)*
* 📋 **Espacio de Trabajo (Notion):** [Acceder al Tablero de Notion](https://www.notion.so/Bazar-B2B-D2C-368f1460c6af804994deebf3e2505409?source=copy_link) *(Gestión de tareas, requerimientos y backlog)*
* 📂 **Repositorio de Documentos (OneDrive):** [Abrir Carpeta de OneDrive](https://1drv.ms/f/c/f8eae564f6fb628e/IgCSiSOXw_r4QYW1xECX9052AQcpdDXc9iVqswX8ijBBHB4?e=3u7kIY) *(Anexos, actas de reuniones y documentación formal)*

---

## 📖 Acerca del Proyecto
**Bazar B2B** es una plataforma digital transaccional que centraliza y digitaliza el canal de ventas al por mayor. Operamos bajo un modelo híbrido **B2B + D2C por volumen**, actuando de manera similar a un club de precios digital. 
La plataforma conecta a proveedores y mayoristas con minoristas (tiendas) y consumidores finales por volumen, funcionando como un intermediario digital que elimina las fricciones del canal tradicional.

## 🎯 Declaración del Problema
* El canal de ventas al por mayor tradicional depende de vendedores de ruta (preventistas) y procesos analógicos que generan altos costos operativos.
* La falta de una plataforma centralizada limita la expansión de mercado de los proveedores.
* Existe un riesgo de pérdida de margen de ganancias si no se controlan estrictamente las reglas de volumen y lotes de venta.

## 👥 Roles y Segmentación de Usuarios
El sistema diferencia a los usuarios para aplicar precios dinámicos y facturación inteligente:
1. **Visitante / Consumidor Final:** Acceso al catálogo público y precios estándar, pudiendo comprar con la condición de cumplir las cantidades mínimas (D2C por volumen).
2. **Minorista B2B (Tienda):** Usuario verificado comercialmente que accede a precios reducidos, descuentos por rol y requiere facturación inteligente.
3. **Mayorista (Proveedor):** Encargado de publicar mercancía masivamente, establecer los lotes y gestionar pedidos.
4. **Super Administrador (Backoffice):** Personal interno de la plataforma que valida usuarios, aprueba tiendas minoristas y gestiona las suscripciones de los proveedores.

## ⚙️ Módulos Principales
1. **Agregación de Oferta:** Herramientas para que los mayoristas configuren su catálogo, definiendo precios escalonados y configurando las cantidades mínimas de pedido (MOQ).
2. **Descubrimiento y Exhibición:** Interfaz principal con cuadrícula de productos, motor de búsqueda y filtros. El sistema muestra precios dinámicamente según el rol.
3. **Transacción (Carrito Inteligente):** Carrito multicesta capaz de dividir órdenes de diferentes proveedores. Incluye un estricto **Motor de Reglas de Compra** (control de MOQ y lotes cerrados).
4. **Gestión Operativa y Fulfillment:** Panel de control (Dashboard) para mayoristas y bandeja de validación para el Súper Administrador.
5. **Suscripciones B2B:** Gestión de membresías automatizada para proveedores (control de límites de publicación).

---

## 💻 Stack Tecnológico (Monolito en Django)
Todo el ecosistema ha sido unificado utilizando el framework **Django** bajo el patrón **MVT (Modelo-Vista-Template)**:
* **Backend Core:** Python 3.11+, Django 5.2.15, Django Rest Framework (preparado para futuras APIs).
* **Frontend (Integrado):** Templates de Django (HTML5), estilizados con Tailwind CSS y componentes base. Integración de Whitenoise para el servicio de archivos estáticos.
* **Base de Datos:** PostgreSQL (gestionada con `dj-database-url` y `psycopg2-binary`).
* **Despliegue y Orquestación:** Docker y Docker Compose, Gunicorn, gestión de variables mediante `python-dotenv`.

---

## 📂 Estructura del Proyecto

A continuación, se detalla la arquitectura de carpetas profesional del repositorio, destacando la separación de aplicaciones (Apps) dentro de Django:

```text
ProyectoWeb/
├── .git/                       # Control de versiones
├── .gitignore                  # Archivos ignorados por Git
├── PRESENTACION-1BIM/          # Material de presentación y recursos adicionales
├── Page/                       # Contenedor principal
│   └── backend/                # Raíz del ecosistema del proyecto (Docker & Django)
│       ├── .env                # Variables de entorno seguras (claves, configuración BD)
│       ├── Dockerfile          # Construcción de la imagen de producción
│       ├── docker-compose.yml  # Orquestación de servicios (Django App + PostgreSQL)
│       └── B2B/                # Raíz del proyecto Django
│           ├── manage.py       # Script principal de comandos de administración
│           ├── requirements.txt# Dependencias de Python
│           ├── B2B/            # Configuración global de Django (Settings, URLs, WSGI)
│           ├── catalog/        # App: Inventario, catálogo, precios dinámicos y MOQ
│           ├── core/           # App: Vistas globales, context processors y templates base
│           ├── orders/         # App: Gestión de carritos multicesta y logística
│           ├── subscriptions/  # App: Control de membresías y límites para mayoristas
│           ├── users/          # App: Autenticación, RBAC y roles personalizados
│           ├── media/          # Archivos subidos por usuarios (ej. RUC, imágenes)
│           ├── static/         # Archivos estáticos recolectados para producción
│           └── templates/      # Plantillas globales de renderizado HTML (Frontend)
└── README.md                   # Documentación principal consolidada (este archivo)
```

---

## 🚀 Guía de Clonación y Configuración

### 🛠️ Requisitos Previos
* **Git**: [Descargar Git](https://git-scm.com/)
* **Docker y Docker Compose** (Recomendado): [Descargar Docker](https://www.docker.com/)
* **Python (v3.11+)**: Requerido si se ejecuta de forma nativa (sin usar contenedores para la app web).

### Paso 1: Clonar el Repositorio
```bash
git clone <URL_DEL_REPOSITORIO>
cd ProyectoWeb
```

### Paso 2: Ejecución (Entorno Local Independiente)
Si prefieres ejecutar el servidor Django localmente y usar Docker solo para levantar la base de datos PostgreSQL:

**1. Levantar la Base de Datos:**
```bash
cd Page/backend
docker compose up -d db
```

**2. Configurar el Entorno Django:**
```bash
cd B2B
python -m venv venv

# Activar entorno (Linux/macOS):
source venv/bin/activate
# Activar entorno (Windows - PowerShell):
.\venv\Scripts\Activate.ps1
# Activar entorno (Windows - CMD):
.\venv\Scripts\activate.bat

# Instalar dependencias:
pip install -r requirements.txt
```

**3. Configurar `.env` (Opcional):**
Crea un archivo `.env` en la carpeta `Page/backend/B2B/` si deseas sobrescribir variables de entorno (por defecto intenta conectarse a `localhost:5434`):
```env
DATABASE_URL=postgres://bazar_admin:bazar_password@localhost:5434/bazar_db
SECRET_KEY=clave_secreta_super_segura_para_desarrollo
```

**4. Migraciones y Ejecución:**
```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```
El sitio estará disponible en [http://localhost:8000](http://localhost:8000).

---

## 🛡️ Estándares y Seguridad (ISO y OWASP)

El proyecto respeta firmemente estándares de seguridad y de calidad de software internacionales:

* **Prevención de Ataques (OWASP):** Empleo de middlewares nativos para mitigar CSRF (`CsrfViewMiddleware`), inyección SQL (mediante la abstracción del ORM de Django), y Clickjacking (`XFrameOptionsMiddleware`).
* **Gestión Segura de Secretos:** Absoluta separación de la configuración y el código a través de archivos `.env`.
* **Buenas Prácticas (Clean Code):** Principio *"Fat Models, Skinny Views"*, delegando la lógica compleja (validación de MOQ, límites de suscripción, etc.) a los Modelos.
* **ISO 27001 (Seguridad de la Información):** Implementación estricta de Control de Acceso Basado en Roles (RBAC) y flujos de "Verificación de Empresa" (solicitud y validación de RUC).
* **ISO/IEC 25010 (Calidad del Producto):** Adecuación funcional perfecta para escenarios complejos B2B y alta mantenibilidad lograda mediante modularidad (Apps independientes).
