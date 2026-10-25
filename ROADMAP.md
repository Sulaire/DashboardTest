# Dashboard de clientes — plan

Una aplicación donde cada cliente de Jordi entra con su correo y ve solo lo
suyo: si sus productos funcionan, qué han hecho este mes y qué hay que revisar.
El primer producto es el buzón de facturas de la gestoría.

Cómo funciona por dentro: `docs/COMO_FUNCIONA.md`. La propuesta original, con
el porqué de cada decisión, está en Cosmerito (`docs/propuestas/dashboard-clientes.md`).

## Fase 0 — Preparar el proyecto

- [x] Decidir qué entra en la primera versión y con qué herramientas
- [x] Conectar el proyecto al tablero de Jordi

## Fase 1 — Lo mínimo que se puede enseñar

- [x] Una demostración del buzón de facturas con datos inventados
- [x] Entrar con el correo, sin contraseñas: llega un enlace y ya
- [x] Cada cliente ve solo lo suyo, y la base de datos lo garantiza
- [x] El buzón puede contar lo que hace: facturas archivadas, problemas y envíos
- [x] El semáforo, las cifras del mes, la lista de clientes y los avisos
- [x] El semáforo sigue en ámbar mientras queden facturas por revisar, y se apaga solo cuando no queda ninguna
- [x] Cada cliente elige qué bloques quiere ver
- [x] Panel de administración para dar de alta clientes, personas y productos
- [x] Un probador para comprobar un aviso antes de conectar un producto
- [x] Lo que llega se borra solo a los 12 meses
- [x] Dar de baja a un cliente borra todos sus datos de una vez
- [ ] Publicar la aplicación en internet, con su dirección
- [ ] Mandar los correos de entrada desde un remitente propio
- [ ] Enseñar la demostración a la gestoría y apuntar qué quiere ver

## Fase 2 — El buzón de verdad

- [x] Preparada la conexión del buzón con el panel, lista para ponerla en marcha
- [ ] El buzón de facturas manda sus avisos al panel
- [ ] Dar de alta a la gestoría, con sus clientes por código
- [ ] Una semana con datos reales, revisada con la gestoría

## Fase 3 — Cosmerito lo vigila

- [x] Un resumen por cliente para Cosmerito (semáforo y cifras), con su propia llave
- [x] Cómo va cada cliente, en la pantalla de Cosmerito, y un aviso por Telegram si el buzón deja de dar señales
- [ ] Cosmerito comprueba cada poco que el panel está en línea

## Fase 4 — Segundo producto

- [x] Un segundo producto, «Tu web»: vigila que la web de un cliente esté en línea, sin tocar el buzón
- [ ] Ponerlo en marcha para un cliente de verdad

## Fase 5 — Más adelante

- [x] Gráfica de facturas archivadas por semana
- [ ] Avisos por correo, si los clientes los quieren
- [ ] El panel con la marca de cada cliente
- [ ] Cobros con Stripe
