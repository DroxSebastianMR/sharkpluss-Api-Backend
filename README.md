# SharkPluss API Backend

API NestJS/Fastify para SharkPluss. PostgreSQL se gestiona en Supabase mediante Prisma.

## Inicio

1. Copia `.env.example` como `.env` y completa `DATABASE_URL`.
2. Instala dependencias: `pnpm install`.
3. Genera Prisma: `pnpm prisma:generate`.
4. Ejecuta migraciones locales: `pnpm prisma:migrate:dev`.
5. Inicia el API: `pnpm dev`.

El health check queda en `GET /api/health`.

## Principio de streaming

La API autoriza reproducción y genera URLs firmadas. Los videos HLS/MP4 se entregan desde almacenamiento/CDN, nunca a través del proceso NestJS.
