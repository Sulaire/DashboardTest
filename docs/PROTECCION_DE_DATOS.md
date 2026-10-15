# Protección de datos

Con el buzón, Jordi es **encargado del tratamiento**: trata facturas de los
clientes de la gestoría por encargo suyo. Esto es lo que hace el panel y lo
que hay que recoger en el **contrato de encargo** con la gestoría (la AEPD
tiene una guía para redactarlo; que lo revise alguien que sepa antes de
firmarlo).

## Para el contrato de encargo

- **Qué guarda el panel:** avisos con un código de cliente (no su nombre),
  si fue bien o no, una frase corta y recuentos (cuántas facturas, cuántos
  problemas, cuántas enviadas). Además, el correo de las personas de la
  gestoría que entran al panel.
- **Qué no guarda:** ni facturas, ni importes, ni nombres o datos de los
  clientes de la gestoría. Las facturas siguen en el Drive o el correo del
  cliente.
- **Cuánto tiempo:** los avisos se borran solos a los **12 meses**. Las
  cuentas, cuando la gestoría deja el servicio (se quitan en `/admin`).
- **Dónde:** la base de datos de Railway del panel. Los correos de entrada
  los manda Resend (subencargado: solo ve la dirección de correo de quien entra).
- **Quién lo ve:** la gestoría, solo lo suyo (garantizado por la base de
  datos: `docs/COMO_FUNCIONA.md`), y Jordi como administrador. Cosmerito, más
  adelante, solo un resumen: semáforo y recuentos.

## Cómo lo cuida el código

- `/api/avisos` rechaza textos con correos, teléfonos, DNI/NIE o importes, y
  cifras que no sean recuentos declarados (`src/lib/avisos.ts`).
- Cada cliente solo ve sus filas, aunque falle el código (seguridad por filas).
- Las llaves de los productos se guardan solo como huella.
