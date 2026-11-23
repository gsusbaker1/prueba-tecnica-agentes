# TaskFlow — Gestor de Tareas e Incidencias (Next.js + Supabase)

Prueba técnica de desarrollo web moderno con **arquitectura estricta de 3 agentes** definida en Markdown:

- **`CLAUDE.md`** — Agente **Orquestador** principal (coordinación y flujo).
- **`.agents/develop.md`** — Subagente **Develop** (código limpio, tipado, Tailwind CSS y Supabase).
- **`.agents/testing.md`** — Subagente **Testing** (auditoría de calidad, seguridad, Vitest y `npm run build` hasta `STATUS: PASS`).

## Funcionalidades

- **CRUD completo** conectado a la tabla `items` de Supabase (acceso público directo sin login obligatorio).
- **Creación de tareas/incidencias** con título, descripción, prioridad (`baja`, `media`, `alta`) y estado (`pendiente`, `en_proceso`, `completado`).
- **Tablero con filtros por estado y contadores en tiempo real**, búsqueda instantánea y filtro por prioridad.
- **Cambio de estado con un clic**, edición inline y eliminación de tareas.
- **Diseño limpio y responsive** con Tailwind CSS.

## Configuración local

1. Instala las dependencias:
   ```bash
   npm install
   ```
2. Crea `.env.local` copiando `.env.example` y añade tus claves públicas de Supabase:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-publica
   ```
3. (Opcional) Verifica la estructura y políticas públicas de tu tabla `items` en [`supabase/schema.sql`](./supabase/schema.sql).
4. Arranca el servidor de desarrollo:
   ```bash
   npm run dev
   ```

## Verificación y QA

```bash
npm run typecheck
npx vitest run
npm run build
```

## Despliegue en Vercel

1. Importa la carpeta `prueba-tecnica-nextjs` en Vercel (Root Directory: `prueba-tecnica-nextjs` si está dentro de un repositorio padre).
2. Configura las variables de entorno en Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Lanza el despliegue. `.env.local` está bloqueado en `.gitignore` para evitar fugas de credenciales en Git.
