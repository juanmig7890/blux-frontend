# BLUX Frontend — Next.js

Frontend de la plataforma de streaming **BLUX**, migrado de HTML/CSS/JS vanilla a **Next.js 14** con TypeScript.

## Tecnologías

- **Next.js 14** (App Router)
- **TypeScript**
- **CSS global** (sin Tailwind, estilos propios iguales al original)

## Estructura del proyecto

```
src/
├── app/
│   ├── page.tsx          ← Login, Registro, Recuperación, Selección de perfiles
│   ├── home/page.tsx     ← Página de inicio (catálogo + hero + en vivo)
│   ├── movies/page.tsx   ← Catálogo de películas con filtros
│   ├── live/page.tsx     ← Streams en vivo (estilo Twitch)
│   ├── mylist/page.tsx   ← Mi lista (carrusel + grid)
│   ├── admin/page.tsx    ← Panel de administración
│   ├── globals.css       ← Todos los estilos
│   └── layout.tsx        ← Layout raíz
├── components/
│   ├── Navbar.tsx        ← Navbar compartida
│   ├── ContentCard.tsx   ← Card de contenido reutilizable
│   └── ContentModal.tsx  ← Modal de detalle reutilizable
├── types/
│   └── index.ts          ← Tipos TypeScript + constantes (API URL, avatares)
└── lib/
    └── api.ts            ← Helper de fetch
public/
└── imagenes/             ← Avatares de perfiles
```

## Rutas

| Ruta | Página |
|------|--------|
| `/` | Login / Registro / Recuperación / Perfiles |
| `/home` | Inicio |
| `/movies` | Películas y series |
| `/live` | En vivo |
| `/mylist` | Mi lista |
| `/admin` | Panel admin (requiere rol ADMIN) |

## Configuración

### 1. Instalar dependencias

```bash
npm install
```

### 2. Variables de entorno

Crea `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

> Ajusta la URL al puerto donde corre tu backend NestJS.

### 3. Correr en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

### 4. Build para producción

```bash
npm run build
npm start
```

## Repositorio GitHub

Este proyecto es el **frontend** independiente. El backend (NestJS) está en un repositorio separado.

```bash
# Inicializar git y subir a GitHub
git init
git add .
git commit -m "feat: migración frontend a Next.js"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/blux-frontend.git
git push -u origin main
```

## Conexión con el backend

El frontend se comunica con el backend NestJS a través de las siguientes rutas:

| Endpoint | Uso |
|----------|-----|
| `POST /v1/auth/registrar` | Registro de usuario |
| `POST /v1/auth/login` | Login |
| `POST /v1/auth/recuperar/solicitar` | Solicitar código de recuperación |
| `POST /v1/auth/recuperar/cambiar` | Cambiar contraseña |
| `GET /v1/perfiles/listar?correo=` | Listar perfiles del usuario |
| `POST /v1/perfiles/guardar-lote` | Crear perfiles iniciales |
| `PUT /v1/perfiles/actualizar` | Editar perfil |
| `GET /v1/flux/home` | Catálogo + en vivo para home |
| `GET /v1/flux/catalogo` | Catálogo completo |
| `GET /v1/flux/en-vivo` | Streams en vivo |
| `GET /v1/flux/buscar?query=` | Búsqueda |
| `GET /v1/favoritos/mis-favoritos?correo=` | Obtener favoritos |
| `POST /v1/favoritos/agregar` | Agregar favorito |
| `DELETE /v1/favoritos/eliminar` | Quitar favorito |
| `POST /v1/flux/admin/agregar` | Admin: agregar contenido |
| `PUT /v1/flux/admin/editar/:id` | Admin: editar contenido |
| `DELETE /v1/flux/admin/eliminar/:id` | Admin: eliminar contenido |
