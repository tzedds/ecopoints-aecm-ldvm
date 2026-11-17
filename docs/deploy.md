# Despliegue

## URLs

- API (Render): https://ecopoints-api-op38.onrender.com
- Frontend (Netlify): https://ecopointsaecmldvm89.netlify.app

## Importante del plan gratuito de Render

- La API se duerme tras 15 minutos sin uso. La primera petición tarda cerca de 1 minuto.
  Antes de una demo, abrir `/api/health` para despertarla.
- La base de datos expira a los 30 días de su creación y se borra tras 14 días más.

## Fechas de la base de datos

- Creada: 16/11/2026
- Expira: 16/12/2026
- **Hacer respaldo antes del 16/12/2026**

## Cómo hacer el respaldo

1. En Render: `ecopoints-db` → Connections → copiar la **External Database URL**.
   No compartirla ni subirla al repo.
2. En PowerShell:

```powershell
$env:DB_URL = "PEGAR_LA_URL"
mkdir C:\Users\tzoan\respaldos -Force
docker run --rm -e DB_URL -v "C:/Users/tzoan/respaldos:/out" postgres:16 sh -c 'pg_dump "$DB_URL" -Fc -f /out/ecopoints-respaldo.dump'
Remove-Item Env:DB_URL
```

El archivo `.dump` queda en `C:\Users\tzoan\respaldos`, fuera del repo.

## Despliegue automático

Cada merge a `master` actualiza la API en Render.