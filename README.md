# Invenet

Sistema web para la gestión del ciclo de vida de activos informáticos de la ESCOM N.º 44: registro, seguimiento, reportes de anomalías, reparaciones e historial.

## Tecnologías

- **Backend:** Laravel, PHP, MySQL, Laravel Sanctum.
- **Frontend:** React, Vite, JavaScript.

## Requisitos previos

Instalar en la computadora:

- Git
- PHP y las extensiones requeridas por la versión de Laravel del proyecto
- Composer
- Node.js y npm (versión compatible con el `package.json`)
- MySQL

> Antes de la defensa, comprobá que la computadora tenga todo instalado. Los pasos siguientes suponen que el repositorio contiene las carpetas `backend` y `frontend`.

## 1. Clonar el proyecto

Abrí una terminal y ejecutá:

```bash
git clone https://github.com/Agusjj16/invenet.git
cd invenet
```

Si el repositorio es privado, iniciá sesión con una cuenta de GitHub que tenga acceso.

## 2. Configurar el backend (Laravel)

Abrí una terminal en la carpeta del backend:

```bash
cd backend
composer install
```

Creá el archivo `.env` a partir del ejemplo:

**Windows (PowerShell):**

```powershell
Copy-Item .env.example .env
```

**Linux/macOS:**

```bash
cp .env.example .env
```

Generá la clave de Laravel:

```bash
php artisan key:generate
```

En el `.env`, revisá al menos estos valores según tu instalación:

```dotenv
APP_URL=http://localhost:8000
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=invenet
DB_USERNAME=root
DB_PASSWORD=
```

Creá una base de datos vacía llamada `invenet` desde MySQL (por ejemplo, con phpMyAdmin o MySQL Workbench). Si utilizás SQL:

```sql
CREATE DATABASE invenet CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Ejecutá las migraciones y cargá los datos iniciales:

```bash
php artisan migrate --seed
```

> **Importante:** verificá previamente que los seeders creen los roles, permisos y una cuenta de administrador de prueba. No documentes contraseñas reales en el repositorio. Si el proyecto requiere otros comandos de inicialización, agregalos aquí.

Levantá el servidor:

```bash
php artisan serve
```

Backend: **http://localhost:8000**

## 3. Configurar el frontend (React)

Abrí **otra terminal** desde la carpeta raíz del repositorio:

```bash
cd frontend
npm install
```

Si el frontend utiliza variables de entorno, creá su `.env` a partir de `.env.example` y configurá la URL de la API según el nombre de variable que use el código. No inventes una variable nueva sin comprobar que Vite la lea.

Iniciá el frontend:

```bash
npm run dev
```

Frontend: **http://localhost:5173** (o la dirección que indique Vite).

## 4. Abrir Invenet

1. Dejá corriendo **MySQL**.
2. Dejá abierta la terminal de **Laravel** (`php artisan serve`).
3. Dejá abierta la terminal de **React** (`npm run dev`).
4. Abrí la URL que muestre Vite en el navegador.
5. Iniciá sesión con una cuenta de prueba creada para la demostración.

## Solución rápida de problemas

| Problema | Qué revisar |
|---|---|
| Error al conectar con la base de datos | MySQL iniciado, base creada y valores `DB_*` del `.env` |
| `vendor/autoload.php` no existe | Ejecutar `composer install` en `backend` |
| No encuentra paquetes de React | Ejecutar `npm install` en `frontend` |
| Error 419 / CSRF o problema de sesión | Configuración de Sanctum, cookies, CORS y URLs locales |
| No hay roles ni usuario para ingresar | Revisar qué datos cargan los seeders |
| Puerto ocupado | Revisar los puertos usados por Laravel y Vite y actualizar la configuración si cambia alguno |

## Comandos para el día de la defensa

**Terminal 1 (backend):**

```bash
cd invenet/backend
php artisan serve
```

**Terminal 2 (frontend):**

```bash
cd invenet/frontend
npm run dev
```

> Estos comandos rápidos suponen que ya completaste la instalación, configuraste `.env`, creaste la base de datos y ejecutaste las migraciones y seeders.

## Seguridad

No subir archivos `.env`, credenciales, claves privadas, bases de datos con información sensible, ni carpetas de dependencias (`vendor`, `node_modules`). Los archivos `.env.example` pueden incluir variables de ejemplo sin secretos.
