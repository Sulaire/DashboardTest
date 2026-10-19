# Publicarlo en Railway

1. En Railway, **New Project → Deploy from GitHub repo** → `Sulaire/DashboardTest`
   (la rama que quieras publicar; normalmente la principal).
2. En el mismo proyecto, **+ New → Database → PostgreSQL**.
3. En el servicio de la app, pestaña **Variables** (ver `.env.example`):
   - `DATABASE_URL` → «Add reference» a la del Postgres.
   - `PANEL_DB_PASSWORD` → una contraseña larga y aleatoria (24+ caracteres,
     sin espacios ni tildes; `openssl rand -base64 32` vale).
   - `BETTER_AUTH_SECRET` → otra cadena larga y aleatoria.
   - `PANEL_URL` → la dirección pública (Settings → Networking → Generate Domain).
   - `PANEL_ADMIN_EMAIL` → tu correo.
   - `RESEND_API_KEY` y `PANEL_CORREO_DE` → de tu cuenta de Resend. Para que
     los correos no acaben en spam, Resend pide verificar un dominio tuyo.
4. Al arrancar, la app crea sola las tablas y el usuario `panel_app`.
5. Entra en `PANEL_URL`, pide el enlace con tu correo y estarás en `/admin`.
6. `/api/salud` dice si la app y su base de datos responden: es lo que mira
   Railway y lo que mirará Cosmerito (`despliegue.salud` en `hub.json`).

Después de publicar, comprobar que Railway pisa la cabecera `X-Real-IP`
que mande quien llama (los frenos por IP se fían de ella): llamar a
`/api/avisos` con una llave falsa y `-H "X-Real-IP: 1.2.3.4"` 31 veces y ver
que el 429 llega igual desde otra IP inventada. Si no, avisar: hay que
configurar los proxies de confianza.

Ojo: `panel_app` es un usuario de todo el servidor de Postgres. Si algún día
hay dos copias del panel (pruebas y real) en el mismo Postgres, tienen que
llevar la misma `PANEL_DB_PASSWORD`, o cada una le cambiará la contraseña a la
otra al arrancar. Mejor un Postgres para cada una.
