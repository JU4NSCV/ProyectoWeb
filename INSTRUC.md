# 📋 Guía de Clonación y Configuración del Proyecto (Bazar B2B)

Esta guía detalla los pasos necesarios para clonar y ejecutar este proyecto en cualquier computadora.

---

## 🛠️ Requisitos Previos

Asegúrate de tener instalados los siguientes programas en tu computadora:

- **Git**: Para clonar el repositorio. [Descargar Git](https://git-scm.com/)
- **Docker y Docker Compose**: (Recomendado) Para levantar todo el sistema con un solo comando. [Descargar Docker](https://www.docker.com/)
- **Python (v3.11 o superior)**: Requerido si deseas ejecutar el Backend localmente sin Docker. [Descargar Python](https://www.python.org/)

---

## 🚀 Paso 1: Clonar el Repositorio

Abre una terminal y ejecuta el siguiente comando para clonar el repositorio en tu máquina:

```bash
git clone <URL_DEL_REPOSITORIO>
cd ProyectoWeb
```

---

## 🐋 Método A: Ejecución Rápida con Docker (Recomendado)

Este método levantará automáticamente la base de datos PostgreSQL y el servidor Backend en Django.

### 1. Configurar las Variables de Entorno

Copia el archivo de plantilla a un archivo `.env` real dentro de la carpeta del backend.

```bash
# Desde la raíz del proyecto
cp Page/backend/.env.template Page/backend/.env
# Si no existe .env.template, simplemente crea el archivo .env manualmente
```

**Ejemplo de archivo `.env` (Backend / Docker):**
Crea un archivo llamado `.env` en la carpeta `Page/backend/` (o copia el template) con el siguiente contenido:

```env
# Ejemplo de configuración para el entorno
POSTGRES_DB=bazar_db
POSTGRES_USER=bazar_admin
POSTGRES_PASSWORD=bazar_password
DB_HOST=db
DB_PORT=5432

# Configuraciones de Django
SECRET_KEY=clave_secreta_super_segura_para_desarrollo
DEBUG=True
```

_(El archivo `.env` resultante está protegido y no se subirá a Git, ya que está configurado en `.gitignore`)_.

### 2. Iniciar el Proyecto con Docker Compose

Navega a la carpeta `Page` y levanta los contenedores:

```bash
cd Page
docker compose up --build
```

Este comando construirá la imagen necesaria para el Backend, migrará la base de datos y expondrá los servicios en los siguientes puertos:

- ⚙️ **Backend (Django)**: [http://localhost:8000](http://localhost:8000)
- 🐘 **Base de Datos (Postgres)**: `localhost:5432`

Para detener el proyecto, presiona `Ctrl + C` o ejecuta:

```bash
docker compose down
```

---

## 💻 Método B: Ejecución Local Independiente (Desarrollo Tradicional)

Si prefieres ejecutar cada servicio localmente en tu sistema operativo:

### 1. Configurar la Base de Datos (PostgreSQL)

Tienes dos opciones para la base de datos:

- **Opción D1:** Tener PostgreSQL instalado localmente y crear una base de datos llamada `bazar_db` con el usuario `bazar_admin` y contraseña `bazar_password`.
- **Opción D2 (Recomendada):** Usar el Docker Compose ligero del backend para levantar únicamente la base de datos en un contenedor:
  ```bash
  cd Page/backend
  docker compose up -d
  ```

---

### 2. Configurar el Backend (Django)

1. Ve a la carpeta del backend:
   ```bash
   cd Page/backend
   ```
2. Crea un entorno virtual de Python:
   ```bash
   python -m venv entorno
   ```
3. Activa el entorno virtual:
   - **En Linux/macOS:**
     ```bash
     source entorno/bin/activate
     ```
   - **En Windows (PowerShell):**
     ```powershell
     .\entorno\Scripts\Activate.ps1
     ```
   - **En Windows (CMD):**
     ```cmd
     .\entorno\Scripts\activate.bat
     ```
4. Instala las dependencias necesarias:
   ```bash
   pip install -r requirements.txt
   ```
5. Crea tu archivo de configuración local:
   ```bash
   cp .env.template .env
   # Si no existe, crea un archivo llamado .env con el siguiente ejemplo
   ```
   **Ejemplo de archivo `.env` local:**
   ```env
   POSTGRES_DB=bazar_db
   POSTGRES_USER=bazar_admin
   POSTGRES_PASSWORD=bazar_password
   DB_HOST=127.0.0.1
   DB_PORT=5432
   SECRET_KEY=clave_secreta_super_segura_para_desarrollo
   DEBUG=True
   ```
   _(Abre el archivo `.env` y ajusta las credenciales si utilizaste credenciales personalizadas para tu base de datos local)._
6. Ejecuta las migraciones de la base de datos:
   ```bash
   cd B2B
   python manage.py migrate
   ```
7. Crea un usuario administrador (opcional, para acceder a `/admin`):
   ```bash
   python manage.py createsuperuser
   ```
8. Inicia el servidor de desarrollo del backend:
   ```bash
   python manage.py runserver
   ```
   El backend estará corriendo en [http://localhost:8000](http://localhost:8000).

---

## 🔒 Seguridad en Repositorios Públicos

Este proyecto ha sido configurado para ser 100% seguro de subir a repositorios públicos:

1. **Ignorados de Git:** Los archivos `.env` (credenciales de base de datos y llaves secretas) y entornos virtuales de Python (`entorno/`, `venv/`) están configurados en el archivo [Page/.gitignore](file:///home/bas/Documents/ProyectoWeb/Page/.gitignore) y [.gitignore](file:///home/bas/Documents/ProyectoWeb/.gitignore) global.
2. **Settings Seguros:** Django está configurado para cargar dinámicamente el `SECRET_KEY` y el estado `DEBUG` desde las variables de entorno. Nunca escribas credenciales reales en [Page/backend/B2B/B2B/settings.py](file:///home/bas/Documents/ProyectoWeb/Page/backend/B2B/B2B/settings.py).
