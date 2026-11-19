# Sistema de pujas

Backend inicial para una plataforma de subastas, con PostgreSQL instalado localmente, sin contenedores.

## Componentes

- `backend/`: API HTTP con Express y TypeScript, persistencia con Prisma, autenticación JWT y pujas en tiempo real con Socket.IO.
- `web/`, `desktop/`, `mobile/`: reservados para las aplicaciones cliente.

## Requisitos

- Node.js 24 LTS recomendado.
- PostgreSQL instalado y ejecutándose en la computadora.

## Preparar PostgreSQL

Crea una base de datos vacía llamada `sistema_pujas`. Por ejemplo, con una instalación local:

```sql
CREATE DATABASE sistema_pujas;
```

## Preparar y ejecutar el backend

```bash
cd backend
npm install
cp .env.example .env
```

Edita `backend/.env` y configura `DATABASE_URL`, `JWT_SECRET` y los orígenes permitidos en `CORS_ORIGIN`. `JWT_SECRET` debe tener al menos 32 caracteres.

Después crea las tablas y levanta el servidor:

```bash
npm run db:generate
npm run db:migrate
npm run dev
```

La API estará en `http://localhost:4000`; `GET /health` sirve para comprobar que el proceso responde. Prisma guarda las migraciones en `backend/prisma/migrations`.

## Rutas iniciales

| Método | Ruta | Acceso | Descripción |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Público | Registro y emisión de token |
| `POST` | `/api/auth/login` | Público | Inicio de sesión |
| `GET` | `/api/auth/me` | Token | Usuario autenticado |
| `GET` | `/api/auctions` | Público | Lista; admite `?status=ACTIVE` |
| `GET` | `/api/auctions/:id` | Público | Detalle e historial reciente |
| `POST` | `/api/auctions` | Token | Crear producto y subasta |
| `POST` | `/api/auctions/:id/bids` | Token | Hacer una oferta |

Para rutas protegidas envía `Authorization: Bearer <token>`. Registro requiere `{ "name", "email", "password" }`; crear subasta requiere `{ "name", "description", "imageUrl?", "startsAt", "endsAt", "startingPrice", "minIncrement?" }`; pujar requiere `{ "amount" }`.

## Tiempo real

Los clientes Socket.IO pueden emitir `auction:join` con el ID de una subasta y escuchar `bid:placed` y `auction:ended`. También pueden emitir `auction:leave` al abandonar la sala. Socket.IO usa un protocolo propio sobre WebSocket/HTTP long polling; los clientes deben usar Socket.IO Client, no un WebSocket plano.

Las subastas vencidas se cierran en el proceso backend cada 15 segundos. Para producción, agrega controles administrativos, auditoría, pruebas, recuperación del ganador/pago, política para ampliar el cierre y un proceso de tareas confiable si se ejecutan varias instancias.

## Aplicación web

```bash
cd web
npm install
npm run dev
```

Abre la dirección de Vite (normalmente `http://localhost:5173`). La web se conecta al backend en `http://localhost:4000/api`; para cambiarlo, crea `web/.env` con `VITE_API_URL=http://localhost:4000/api`. Mantén ese origen incluido en `backend/.env` dentro de `CORS_ORIGIN`.

## Aplicación de escritorio

La app de escritorio usa Electron y abre la misma interfaz React de `web`, para compartir las funciones y datos con el navegador.

```bash
cd desktop
npm install
npm run dev
```

Antes de iniciarla, deja PostgreSQL y el backend activos. El comando de desarrollo inicia Vite para la interfaz y abre la ventana Electron. Si ya tienes Vite ocupando el puerto 5173, detén ese proceso antes de arrancar el escritorio.
