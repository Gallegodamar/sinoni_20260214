# Sinonimoen Erronka

Aplicacion PWA para practicar sinonimos en euskera con modo multijugador y modo individual con historial.

## Requisitos

- Node.js 20+

## Configuracion

Define estas variables en `.env.local`:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Para habilitar el reto diario y clasificaciones, ejecuta en Supabase SQL editor:

- `database/daily_challenge_runs.sql`

## Desarrollo

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```
