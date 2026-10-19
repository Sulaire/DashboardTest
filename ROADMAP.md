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
- [x] Lo que llega se borra solo a los 12 meses
- [ ] Publicar la aplicación en internet, con su dirección
- [ ] Mandar los correos de entrada desde un remitente propio
- [ ] Enseñar la demostración a la gestoría y apuntar qué quiere ver

## Fase 2 — El buzón de verdad

- [ ] El buzón de facturas manda sus avisos al panel
- [ ] Dar de alta a la gestoría, con sus clientes por código
- [ ] Una semana con datos reales, revisada con la gestoría

## Fase 3 — Cosmerito lo vigila

- [ ] Un resumen por cliente para Cosmerito (semáforo y cifras), con su propia llave
- [ ] Si algo falla, sale en Cosmerito y en su Telegram
- [ ] Cosmerito comprueba cada poco que el panel está en línea

## Fase 4 — Segundo producto

- [ ] Conectar un segundo producto (una web, un chatbot…) sin tocar el buzón

## Fase 5 — Más adelante

- [ ] Gráficas (por ejemplo, facturas por semana)
- [ ] Avisos por correo, si los clientes los quieren
- [ ] El panel con la marca de cada cliente
- [ ] Cobros con Stripe
