# 📋 Guía de Clonación y Configuración del Proyecto (Bazar B2B)

Esta guía detalla los pasos necesarios para clonar y ejecutar este proyecto en cualquier computadora.

---

## 🛠️ Requisitos Previos

Asegúrate de tener instalados los siguientes programas en tu computadora:

- **Git**: Para clonar el repositorio. [Descargar Git](https://git-scm.com/)
- **Docker y Docker Compose**: (Recomendado) Para levantar todo el sistema con un solo comando. [Descargar Docker](https://www.docker.com/)
- **Python (v3.11 o superior)**: Solo requerido si deseas ejecutar el Backend localmente sin usar Docker para la aplicación web (Método B). [Descargar Python](https://www.python.org/)

---

## 🚀 Paso 1: Clonar el Repositorio

Abre una terminal y ejecuta el siguiente comando para clonar el repositorio en tu máquina:

```bash
git clone <URL_DEL_REPOSITORIO>
cd ProyectoWeb
```

---

## 🐋 Método A: Ejecución Rápida con Docker (Recomendado)

Este método levantará automáticamente la base de datos PostgreSQL y el servidor Backend en Django utilizando contenedores de Docker. No necesitas configurar entornos virtuales de Python.

### 1. Iniciar el Proyecto con Docker Compose

Navega a la carpeta `Page/backend` y levanta los contenedores en segundo plano:

```bash
cd Page/backend
docker compose up -d --build
```

Este comando descargará/construirá las imágenes necesarias para el Backend, preparará la base de datos y expondrá los servicios localmente.

- ⚙️ **Catálogo Web y Backend (Django)**: [http://localhost:8000](http://localhost:8000)
- ⚙️ **Panel de Administración**: [http://localhost:8000/admin](http://localhost:8000/admin)

### 2. Configuración Inicial de la Base de Datos

La primera vez que levantes los contenedores en una computadora nueva, asegúrate de aplicar las migraciones de Django para crear las tablas en la base de datos:

```bash
# Estando dentro de Page/backend
docker exec -it bazar_web python manage.py migrate
```

Si deseas acceder al panel de administración de Django (`/admin`), puedes crear un superusuario con el siguiente comando:

```bash
docker exec -it bazar_web python manage.py createsuperuser
```

### 3. Detener el Proyecto

Para detener el proyecto y apagar los contenedores, ejecuta:

```bash
# Estando dentro de Page/backend
docker compose down
```

---

## 💻 Método B: Ejecución Local Independiente (Desarrollo Tradicional)

Si prefieres ejecutar el servidor Django directamente localmente en tu sistema operativo, usando Docker únicamente para la base de datos:

### 1. Levantar la Base de Datos (PostgreSQL)

Navega a la carpeta del backend y levanta solo la base de datos:
```bash
cd Page/backend
docker compose up -d db
```

### 2. Configurar el Backend (Django)

1. Ve a la carpeta de la aplicación Django:
   ```bash
   cd Page/backend/B2B
   ```
2. Crea un entorno virtual de Python:
   ```bash
   python -m venv venv
   ```
3. Activa el entorno virtual:
   - **En Linux/macOS:** `source venv/bin/activate`
   - **En Windows (PowerShell):** `.\venv\Scripts\Activate.ps1`
   - **En Windows (CMD):** `.\venv\Scripts\activate.bat`
4. Instala las dependencias necesarias:
   ```bash
   pip install -r requirements.txt
   ```
5. *(Opcional)* Crea tu archivo de configuración `.env` en la carpeta `Page/backend/B2B/` si deseas sobrescribir variables de entorno. El proyecto intentará conectarse por defecto a `localhost:5434` (o `db:5432` si estás dentro del contenedor).
   Ejemplo de contenido para el `.env`:
   ```env
   DATABASE_URL=postgres://bazar_admin:bazar_password@localhost:5434/bazar_db
   SECRET_KEY=clave_secreta_super_segura_para_desarrollo
   ```
6. Ejecuta las migraciones de la base de datos:
   ```bash
   python manage.py migrate
   ```
7. Crea un usuario administrador:
   ```bash
   python manage.py createsuperuser
   ```
8. Inicia el servidor de desarrollo:
   ```bash
   python manage.py runserver
   ```
   El sitio estará corriendo en [http://localhost:8000](http://localhost:8000).

---

## 🔒 Notas de Seguridad

Este proyecto ha sido configurado para ser seguro en desarrollo local:
1. Las credenciales de base de datos de desarrollo y las llaves secretas en `settings.py` se pueden sobrescribir mediante variables de entorno o utilizando un archivo `.env`.
2. Los entornos virtuales (`venv/`) y los archivos `.env` se encuentran ignorados por `.gitignore` para prevenir exposición accidental en repositorios públicos.
