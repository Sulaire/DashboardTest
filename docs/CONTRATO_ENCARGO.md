# Contrato de encargo del tratamiento

**Servicio: buzón de facturas y Panel de clientes**

> **BORRADOR PARA REVISAR. NO FIRMAR TODAVÍA.**
>
> - Es un borrador escrito a partir de cómo funciona de verdad el servicio el
>   25-10-2026 (el buzón de facturas en n8n y el Panel de clientes de este
>   repo). **No es asesoramiento jurídico.** Antes de firmarlo, que lo revise
>   alguien que sepa de protección de datos (un abogado o un consultor de RGPD).
> - Sigue el art. 28 del RGPD, el art. 33 de la LOPDGDD y el orden de las
>   «Directrices para la elaboración de contratos entre responsables y
>   encargados del tratamiento» de la AEPD.
> - Describe el servicio tal como quedará cuando el panel esté publicado y el
>   buzón le mande sus avisos. Hoy aún no lo están (`ROADMAP.md`, fases 1 y 2).
> - **Este repo es público.** Rellena los huecos en una copia privada, fuera de
>   GitHub, y guarda ahí también el contrato firmado. Aquí no van nombres, NIF
>   ni domicilios.
>
> **Huecos que tienes que rellenar** (salen entre corchetes en el texto):
>
> - De las partes: `[NOMBRE DE LA GESTORÍA]`, `[NIF DE LA GESTORÍA]`,
>   `[DOMICILIO DE LA GESTORÍA]`, `[NOMBRE DEL REPRESENTANTE]`, `[CARGO]`,
>   `[CORREO DE LA GESTORÍA PARA INSTRUCCIONES Y AVISOS]`, `[DPD DE LA GESTORÍA]`,
>   `[NOMBRE Y APELLIDOS DEL ENCARGADO]`, `[NOMBRE COMERCIAL]`,
>   `[NIF DEL ENCARGADO]`, `[DOMICILIO DEL ENCARGADO]`,
>   `[CORREO DEL ENCARGADO]`, `[TELÉFONO DEL ENCARGADO]`.
> - Del servicio: `[REFERENCIA DEL PRESUPUESTO O CONTRATO DE SERVICIO]`,
>   `[FECHA DE INICIO]`, `[DIRECCIÓN DEL PANEL]`, `[DÍA DEL ENVÍO MENSUAL]`.
> - De los proveedores: `[REGIÓN DE RAILWAY]`,
>   `[PROVEEDOR Y REGIÓN DEL SERVIDOR DE n8n]`, `[REGIÓN DE ENVÍO DE RESEND]`,
>   `[GARANTÍA PARA TRANSFERENCIAS]` de cada uno,
>   `[CONFIGURACIÓN DE RETENCIÓN EN OPENAI]`.
> - Plazos: `[PLAZO PARA AVISAR DE UNA BRECHA]`,
>   `[PLAZO PARA AVISAR DE UN SUBENCARGADO NUEVO]`,
>   `[PLAZO PARA REENVIAR SOLICITUDES]`, `[PLAZO PARA DEVOLVER Y BORRAR]`,
>   `[PLAZO DEL HISTORIAL DE n8n]`, `[PLAZO DE AVISO DE AUDITORÍA]`,
>   `[PLAZO DE CONSERVACIÓN EN DRIVE Y HOJA]`.
> - Cierre: `[LÍMITE DE RESPONSABILIDAD]`, `[SEGURO]`, `[JURISDICCIÓN]`,
>   `[LUGAR]`, `[FECHA]`.
>
> **Decisiones que tienes que tomar antes** (en el texto, «DECISIÓN n»):
>
> 1. **Quién es el responsable.** Si la gestoría ofrece el buzón a sus
>    clientes dentro de sus propios servicios, quizá ella sea a su vez
>    *encargada* de cada cliente y tú, *subencargado*; entonces cada cliente
>    tiene que autorizarlo. Pregúntaselo al revisor (nota al principio de las
>    cláusulas).
> 2. **En qué cuenta de Google viven la carpeta de Drive y la hoja de cálculo:**
>    opción A (la de la gestoría o la de cada negocio) u opción B (la tuya).
>    Cambia todo el contrato a la vez según lo que elijas.
> 3. **Qué borras al terminar y en qué plazo**, y si entregas antes una copia
>    (cláusula 5.11).
> 4. **OpenAI:** si lo mantienes, con qué configuración (sin guardar datos,
>    región) y con qué garantía para la transferencia a EE. UU.
> 5. **Telegram:** hoy los avisos que te llegan por Telegram llevan el nombre
>    del negocio, nombres de proveedores y totales de gastos e ingresos. O los
>    dejas sin datos (códigos y recuentos) o Telegram pasa a la lista de
>    subencargados.
> 6. **Asistentes de IA para el mantenimiento** (Claude u otros): si les dejas
>    ver ejecuciones de n8n, la hoja o los PDF, ven datos reales. O no les das
>    acceso a datos reales, o van en la lista de subencargados.
> 7. **Los plazos** de la lista de arriba.
> 8. **Responsabilidad:** si pones un límite y si tienes seguro (cláusula 8).
>
> Las notas en cursiva que empiezan por «*Nota para el revisor*» o «*Nota
> para Jordi*» se quitan antes de firmar.

---

## Partes

**De una parte, el RESPONSABLE DEL TRATAMIENTO** (en adelante, «la gestoría»):

- Nombre o razón social: [NOMBRE DE LA GESTORÍA]
- NIF: [NIF DE LA GESTORÍA]
- Domicilio: [DOMICILIO DE LA GESTORÍA]
- Representada por: [NOMBRE DEL REPRESENTANTE], como [CARGO]
- Correo para instrucciones y avisos: [CORREO DE LA GESTORÍA PARA INSTRUCCIONES Y AVISOS]
- Delegado de protección de datos: [DPD DE LA GESTORÍA, o «no tiene»]

**De otra parte, el ENCARGADO DEL TRATAMIENTO** (en adelante, «el encargado»):

- Nombre y apellidos: [NOMBRE Y APELLIDOS DEL ENCARGADO], que trabaja como
  profesional autónomo con el nombre comercial [NOMBRE COMERCIAL]
- NIF: [NIF DEL ENCARGADO]
- Domicilio: [DOMICILIO DEL ENCARGADO]
- Contacto: [CORREO DEL ENCARGADO] · [TELÉFONO DEL ENCARGADO]

Las dos partes se reconocen capacidad para firmar este contrato y

## Exponen

1. Que la gestoría ha contratado con el encargado el servicio de **buzón de
   facturas** y el acceso al **Panel de clientes** (en adelante, «el
   servicio»), según [REFERENCIA DEL PRESUPUESTO O CONTRATO DE SERVICIO].
2. Que, para prestar el servicio, el encargado tiene que tratar datos
   personales que aparecen en las facturas de los clientes de la gestoría y en
   los correos con que llegan, por cuenta de la gestoría y siguiendo sus
   instrucciones.
3. Que el art. 28 del Reglamento (UE) 2016/679 (RGPD) y el art. 33 de la Ley
   Orgánica 3/2018 (LOPDGDD) exigen que ese encargo conste en un contrato con
   el contenido que sigue.

Por todo ello, acuerdan las siguientes

## Cláusulas

> *Nota para el revisor — DECISIÓN 1 (quién es el responsable).* Este borrador
> trata a la gestoría como responsable y al encargado como su encargado. Pero
> las facturas son de los clientes de la gestoría (negocios, muchos de ellos
> autónomos). Si la gestoría trata esas facturas como encargada de cada
> cliente, el encargado sería subencargado y necesitaría la autorización de
> cada cliente (art. 28.2 y 28.4 RGPD); si cada negocio contrata el buzón
> directamente, el contrato sería con cada negocio. La cláusula 6, letra b,
> intenta cubrir el primer caso. Confirmad cuál es antes de firmar.

### 1. Objeto del encargo

El encargado tratará, por cuenta de la gestoría, los datos personales
necesarios para prestar el servicio, que consiste en:

a) **Buzón de facturas.** Unos flujos automáticos, montados en la herramienta
   n8n, leen los correos que llegan a la dirección que cada cliente de la
   gestoría usa para recibir facturas. De cada factura en PDF sacan sus datos
   contables (quién la emite, su CIF, número, fecha, base, IVA y total),
   guardan el PDF en una carpeta de Google Drive ordenada por año y mes y
   apuntan esos datos en una hoja de cálculo de Google. Lo que no pueden leer
   con seguridad lo apartan en una lista de revisión para que lo mire una
   persona. Una vez al mes ([DÍA DEL ENVÍO MENSUAL]) mandan a la gestoría las
   facturas del periodo con su desglose (un archivo CSV y los documentos),
   desde el propio correo del negocio.

b) **Lectura con inteligencia artificial, solo cuando hace falta.** Si las
   reglas no consiguen leer una factura (los importes no cuadran, falta el
   CIF, la fecha o el proveedor es nuevo) y la factura tiene texto, ese texto
   se manda a un modelo de inteligencia artificial (OpenAI) para que proponga
   los datos que faltan. Lo que propone no se acepta a ciegas: si base más IVA
   no da el total, o un importe no está escrito en el PDF, la factura va a
   revisión. En una muestra de 60 días, fueron 4 documentos de 28.

c) **Panel de clientes.** Una web, en [DIRECCIÓN DEL PANEL], donde las
   personas que la gestoría designe ven el estado del buzón: un semáforo,
   recuentos del mes, una gráfica semanal, la lista de sus clientes **por
   código** y los avisos. El panel no recibe ni guarda facturas, importes ni
   nombres (cláusula 4.3).

d) **Soporte y mantenimiento:** dar de alta a un cliente nuevo de la gestoría,
   mirar por qué una factura no se ha archivado, corregir un fallo.

Las operaciones de tratamiento son: recogida (lectura del correo), consulta,
extracción, registro, organización, estructuración, conservación,
comunicación por transmisión (el envío mensual a la gestoría) y supresión.
Ninguna otra.

### 2. Duración

Este contrato empieza el [FECHA DE INICIO] y dura lo mismo que el servicio.
Cuando el servicio termine, por el motivo que sea, se aplica la cláusula 5.11
(destino de los datos). El deber de confidencialidad sigue después.

### 3. Naturaleza y finalidad

El tratamiento es automatizado en su mayor parte, con revisión de una persona
para lo que el sistema no lee con seguridad. El buzón no toma decisiones que
produzcan efectos jurídicos sobre nadie: clasifica facturas y aparta las
dudosas.

El encargado tratará los datos **solo** para prestar el servicio de la
cláusula 1. En particular, no los usará:

- para fines propios, publicidad ni estadísticas comerciales;
- para entrenar o mejorar modelos de inteligencia artificial, ni dejará que
  un subencargado lo haga;
- para comunicarlos a nadie que no sea la propia gestoría o los subencargados
  de la cláusula 5.4.

Para comprobar que el servicio funciona, el encargado usa una herramienta
interna suya que solo recibe, por cada cliente del panel, el nombre con que la
gestoría figura en él, el color del semáforo y recuentos (facturas del mes,
cuántos de sus clientes tienen algo por revisar —sin decir cuáles—, fecha del
último envío y cuántos clientes han tenido actividad). Nunca recibe los códigos
de los clientes de la gestoría, los textos de los avisos ni correos de
personas.

### 4. Datos y personas afectadas

#### 4.1 Quiénes y qué datos

| Personas afectadas (interesados) | Datos | De dónde salen |
|---|---|---|
| Clientes de la gestoría (negocios; muchos son autónomos, es decir, personas físicas) | Nombre o razón social, NIF, domicilio o dirección de suministro que aparezcan en la factura, dirección de correo del buzón | Las facturas y la configuración del buzón |
| Proveedores de esos negocios y quienes les escriben en su nombre | Nombre o razón social, CIF o NIF, dirección de correo del remitente, número y fecha de factura, importes (base, IVA, total), conceptos y lo demás que traiga la factura | Las facturas y los correos |
| Cualquiera que escriba al buzón aunque no mande una factura | Remitente, asunto, nombre y tipo del adjunto | Los correos que llegan al buzón |
| Personas de la gestoría que usan el panel | Dirección de correo; mientras tienen la sesión abierta, la dirección IP y el navegador desde el que entraron | El alta en el panel y el propio uso |

#### 4.2 Categorías especiales

No se prevé tratar datos de categorías especiales (art. 9 RGPD) ni sobre
condenas o infracciones (art. 10). El servicio no los busca ni los extrae; si
alguna factura los trajera por casualidad, se archivaría tal cual llega, como
cualquier otra.

#### 4.3 Lo que guarda el Panel de clientes (y lo que no)

El panel está hecho para saber lo mínimo. Lo que el buzón le cuenta tiene una
forma fija: un **código** de cliente, **sí o no** (fue bien o hay algo que
revisar), una **frase corta** y **recuentos**.

| Guarda | No guarda nunca |
|---|---|
| El código de cada cliente de la gestoría (por ejemplo, su número de cliente), nunca su nombre | Facturas ni su contenido |
| Si cada pasada fue bien o hay algo que revisar, con una frase corta de texto fijo («Una factura no trae el CIF de quien la emite») | Importes, números de factura, CIF ni NIF |
| Recuentos: facturas archivadas, por revisar y enviadas | Nombres de los clientes de la gestoría ni de sus proveedores |
| El correo de las personas de la gestoría con acceso | Asuntos de correo, direcciones de remitentes ni enlaces a Drive |
| La IP y el navegador de cada sesión abierta | Contraseñas (no hay: se entra con un enlace al correo) |
| La huella de las llaves con las que el buzón manda sus avisos (no la llave) | |

Además, el panel **rechaza** cualquier aviso cuyo texto parezca llevar un
correo, un número de 7 cifras o más (teléfonos, DNI, cuentas), un importe o una
moneda, o cuyo código tenga forma de DNI, NIE, CIF o teléfono.

La relación entre cada código y el cliente al que corresponde la guarda la
gestoría (y la configuración del buzón), no el panel.

#### 4.4 Dónde está cada cosa

| Lugar | Qué hay | De quién es la cuenta |
|---|---|---|
| Correo del negocio (Gmail) | Los correos y las facturas tal como llegan | Del propio negocio. El buzón entra con un permiso de acceso que el negocio puede retirar en cualquier momento desde su cuenta de Google. El buzón solo lee: no borra ni mueve correos. |
| Carpeta de Google Drive | Los PDF archivados, por año y mes | **DECISIÓN 2:** [OPCIÓN A: cuenta de Google de la gestoría / de cada negocio] o [OPCIÓN B: cuenta de Google Workspace del encargado] |
| Hoja de cálculo de Google | El registro de facturas (emisor, CIF, número, fechas, importes, remitente, enlace al PDF), la lista de revisión (remitente, asunto, motivo, lo detectado), los proveedores de cada negocio y la configuración de cada negocio | Igual que la carpeta de Drive (DECISIÓN 2) |
| Servidor de n8n | Los flujos, los permisos de acceso a Google guardados, y el historial de ejecuciones (lo que pasó por cada paso, incluido el texto de las facturas) | Del encargado, en [PROVEEDOR Y REGIÓN DEL SERVIDOR DE n8n] |
| OpenAI | El texto de las facturas que las reglas no entienden, con el remitente y el CIF del negocio destinatario | Cuenta del encargado |
| Panel de clientes (Railway) | Lo de la cláusula 4.3 | Del encargado, en [REGIÓN DE RAILWAY] |
| Correo de la gestoría | El envío mensual (CSV y documentos) | De la gestoría |

> *Nota para Jordi — DECISIÓN 2.* Lo que se ve hoy en la v3 del buzón: el
> correo es la cuenta de Gmail del propio negocio; la carpeta de Drive y la
> hoja se usan con credenciales de Google cuyo dueño no se puede saber desde el
> repo, y la hoja es **una sola para todos los negocios** (columna
> `id_negocio`). Si esa hoja está en tu cuenta, tú guardas importes, CIF y
> remitentes de todos los clientes de la gestoría: es la opción B, y entonces
> Google es subencargado tuyo y hace falta una cuenta de Google Workspace con
> su adenda de tratamiento de datos (una cuenta gratuita de Gmail no la trae).
> La opción A (los datos viven en una cuenta de la gestoría o de cada negocio y
> tú solo tienes permiso para escribir) te deja guardando mucho menos y al
> terminar basta con quitarte el acceso. Elige una y cambia a la vez la
> cláusula 4.4, la 5.4, la 5.11 y la 7.

### 5. Obligaciones del encargado

#### 5.1 Instrucciones documentadas

a) El encargado tratará los datos solo según las instrucciones documentadas
   de la gestoría: este contrato y las que la gestoría le dé por escrito desde
   [CORREO DE LA GESTORÍA PARA INSTRUCCIONES Y AVISOS]. El encargado guardará
   esas instrucciones mientras dure el servicio.
b) Si una instrucción le parece contraria al RGPD o a otra norma de
   protección de datos, lo dirá inmediatamente a la gestoría y no la aplicará
   hasta aclararlo.
c) Si una ley le obligara a tratar o transferir los datos de otra forma, lo
   dirá antes a la gestoría, salvo que esa ley lo prohíba.
d) Si el encargado decidiera por su cuenta los fines o los medios del
   tratamiento, sería considerado responsable de ese tratamiento (art. 28.10
   RGPD).

#### 5.2 Confidencialidad

a) El encargado guardará secreto sobre los datos, también después de que
   termine el servicio.
b) Solo tratarán los datos las personas que el encargado autorice, que se
   habrán comprometido por escrito a guardar secreto y conocerán sus
   obligaciones. Hoy es solo el propio encargado. Si se suma alguien, se
   avisará a la gestoría.
c) **Ver solo lo necesario.** Que las facturas pasen por los flujos del
   encargado no significa que las mire. Solo abrirá una factura, la hoja o el
   historial de ejecuciones para resolver una incidencia, revisar una factura
   apartada o atender algo que pida la gestoría.

#### 5.3 Medidas de seguridad

El encargado aplicará las medidas técnicas y organizativas del **Anexo I**,
adecuadas al riesgo según el art. 32 RGPD (el estado de la técnica, el coste,
y la naturaleza y fines del tratamiento), y las revisará cuando cambie algo
importante del servicio o se descubra un fallo.

#### 5.4 Subencargados

a) La gestoría da su **autorización general por escrito** para que el
   encargado use a los subencargados de la tabla de abajo, solo para lo que en
   ella se dice.
b) Antes de añadir o cambiar uno, el encargado lo comunicará por escrito a la
   gestoría con [PLAZO PARA AVISAR DE UN SUBENCARGADO NUEVO, p. ej. 15 días] de
   antelación, diciendo quién es, para qué y qué datos verá. La gestoría puede
   oponerse con motivo en ese plazo; si no hay alternativa, cualquiera de las
   dos partes puede terminar el servicio sin penalización.
c) El encargado se asegurará de que cada subencargado tenga, por contrato
   (normalmente su adenda de tratamiento de datos), las mismas obligaciones de
   protección de datos que este contrato. Si un subencargado incumple, el
   encargado sigue respondiendo ante la gestoría (art. 28.4 RGPD).

| Subencargado | Para qué | Qué ve | Dónde | Garantía si sale de la UE | Estado |
|---|---|---|---|---|---|
| **Railway** | Aloja el Panel de clientes y su base de datos | Lo que guarda el panel (cláusula 4.3): correos de las personas de la gestoría, IP y navegador de sus sesiones, códigos, frases cortas y recuentos | [REGIÓN DE RAILWAY] | [GARANTÍA PARA TRANSFERENCIAS] | Confirmar su adenda de tratamiento de datos |
| **Resend** | Manda los correos con el enlace para entrar al panel | Solo la dirección de correo de quien entra y el propio enlace | [REGIÓN DE ENVÍO DE RESEND] | [GARANTÍA PARA TRANSFERENCIAS] | Confirmar su adenda de tratamiento de datos |
| **[PROVEEDOR DEL SERVIDOR DE n8n]** | Ejecuta los flujos del buzón | Todo lo que procesa el buzón: correos que llegan (remitente, asunto, adjuntos), texto e importes de las facturas, permisos de acceso a Google | [REGIÓN] | [GARANTÍA PARA TRANSFERENCIAS] | Confirmar dónde corre n8n (las notas técnicas del buzón apuntan a Railway) |
| **OpenAI** (DECISIÓN 4) | Lee las facturas que las reglas no entienden | El texto de esa factura, el remitente, el proveedor probable y el CIF del negocio destinatario | EE. UU. [o región europea, si se configura] | [GARANTÍA PARA TRANSFERENCIAS] | Confirmar: que no use los datos para entrenar y [CONFIGURACIÓN DE RETENCIÓN EN OPENAI] |
| **Google** (Gmail, Drive y Hojas de cálculo) | Donde llegan, se archivan y se apuntan las facturas | Todo el contenido de los correos, los PDF y la hoja | [REGIÓN] | [GARANTÍA PARA TRANSFERENCIAS] | **Solo es subencargado del encargado en la opción B** (DECISIÓN 2). En la opción A, las cuentas son de la gestoría o del negocio y Google es proveedor suyo |
| **[Telegram]** (DECISIÓN 5) | Avisos internos al encargado cuando algo falla | Hoy: nombre del negocio, nombres de proveedores, motivos y totales semanales de gastos e ingresos | [—] | [—] | Quitar de la lista si los avisos se dejan sin datos de nadie |
| **[ASISTENTE DE IA PARA EL MANTENIMIENTO]** (DECISIÓN 6) | Ayuda al encargado a programar y revisar el buzón | Nada, si no se le da acceso a datos reales; si revisa ejecuciones, la hoja o los PDF, lo que haya en ellos | [—] | [—] | Quitar de la lista si solo trabaja con datos inventados |

#### 5.5 Transferencias internacionales

Varios subencargados son empresas de Estados Unidos o pueden acceder a los
datos desde allí. El encargado solo usará los que den una garantía de las del
capítulo V del RGPD: estar adheridos al Marco de Privacidad de Datos UE-EE. UU.
(decisión de adecuación) o haber firmado cláusulas contractuales tipo de la
Comisión Europea. La garantía de cada uno está en la tabla de la cláusula 5.4.
Cuando un proveedor deje elegir una región de la Unión Europea, el encargado la
elegirá.

#### 5.6 Derechos de los interesados

a) Si una persona se dirige al encargado para ejercer sus derechos (acceso,
   rectificación, supresión, oposición, limitación, portabilidad o no ser
   objeto de decisiones automatizadas), el encargado se lo reenviará a la
   gestoría en [PLAZO PARA REENVIAR SOLICITUDES, p. ej. 5 días hábiles] y no
   contestará él, salvo que la gestoría se lo pida por escrito.
b) El encargado ayudará a la gestoría a responder: buscar los datos de una
   persona en la carpeta, la hoja o el panel, y corregirlos o borrarlos.

#### 5.7 Violaciones de seguridad

a) Si el encargado conoce una violación de seguridad que afecte a estos
   datos, la comunicará a la gestoría **sin dilación indebida** y, como mucho,
   en [PLAZO PARA AVISAR DE UNA BRECHA, p. ej. 24 horas] desde que la conozca,
   por correo a [CORREO DE LA GESTORÍA PARA INSTRUCCIONES Y AVISOS] y por
   teléfono.
b) Contará, en cuanto lo sepa (si no lo sabe todo a la vez, por partes): qué
   ha pasado; qué tipo de datos y de personas afecta y, aproximadamente,
   cuántas; con quién hablar; qué consecuencias puede tener; y qué ha hecho o
   propone hacer para remediarlo (art. 33.3 RGPD).
c) La gestoría decide si hay que comunicarlo a la AEPD (dentro de las 72 horas
   desde que ella lo sepa) y a las personas afectadas (arts. 33 y 34 RGPD). El
   encargado le dará toda la ayuda que necesite.
d) Ejemplos de lo que se avisaría: alguien que no debía entró al panel; se
   filtró una llave o un permiso de acceso a Google o a n8n; un envío con
   facturas salió hacia una dirección equivocada; un subencargado comunica una
   brecha propia.
e) El encargado apuntará cada incidente, aunque no haya que comunicarlo, con
   lo que pasó y lo que se hizo.

#### 5.8 Evaluación de impacto y consulta previa

Si la gestoría decide hacer una evaluación de impacto (art. 35 RGPD) o una
consulta previa a la AEPD (art. 36), el encargado le dará la información que
necesite: cómo funciona el servicio, por dónde pasan los datos (cláusula 4.4) y
las medidas del Anexo I.

> *Nota para el revisor.* Valorar si hace falta evaluación de impacto
> (volumen de negocios, uso de inteligencia artificial, lista de la AEPD de
> tratamientos que la requieren).

#### 5.9 Registro de actividades

El encargado llevará por escrito un registro de las actividades de tratamiento
que hace por cuenta de la gestoría, con lo que pide el art. 30.2 RGPD: sus
datos y los de la gestoría, qué tratamientos hace, las transferencias
internacionales y una descripción general de las medidas de seguridad.

> *Nota para el revisor.* La excepción del art. 30.5 (menos de 250 personas)
> no se aplica si el tratamiento no es ocasional, y este es continuo.

#### 5.10 Delegado de protección de datos

El encargado [no está obligado a designar delegado de protección de datos /
ha designado a: …]. Para cualquier cuestión de este contrato, el contacto es
[CORREO DEL ENCARGADO].

#### 5.11 Destino de los datos al terminar (DECISIÓN 3)

Cuando termine el servicio, en [PLAZO PARA DEVOLVER Y BORRAR, p. ej. 30 días],
el encargado:

a) **Panel de clientes:** usará «Dar de baja y borrar todos sus datos», que
   borra de una vez los productos de la gestoría, sus llaves, todos sus avisos
   y las cuentas de sus personas.
b) **Buzón:** apagará los flujos de los clientes de la gestoría, borrará de
   n8n los permisos de acceso a sus cuentas de Google y la configuración de
   cada negocio, y borrará su historial de ejecuciones. Recomendará a cada
   negocio que retire también el permiso desde su cuenta de Google.
c) **Carpeta de Drive y hoja de cálculo:**
   - *Opción A:* siguen en la cuenta de la gestoría o del negocio, que son sus
     dueños; el encargado solo deja de tener acceso.
   - *Opción B:* el encargado entregará antes a la gestoría una copia completa
     (la carpeta con los PDF y la hoja exportada) y, cuando la gestoría
     confirme que la tiene, la borrará de su cuenta.
   - [LO QUE DECIDA JORDI: …]
d) Si una ley obligara a conservar algún dato, no lo destruirá: se lo devolverá
   a la gestoría, que lo conservará mientras dure esa obligación (art. 33
   LOPDGDD). Guardar las facturas los años que piden las normas fiscales y
   mercantiles es obligación del negocio y de la gestoría, no del encargado.
e) El encargado podrá conservar, bloqueados, los datos imprescindibles
   mientras puedan derivarse responsabilidades de su relación con la gestoría.
f) Al acabar, el encargado confirmará por escrito a la gestoría qué ha borrado
   y cuándo.

> *Nota para el revisor.* Las copias de seguridad de los proveedores (si
> Railway o el servidor de n8n las hacen) no se borran al momento: indicar
> cuánto tardan en desaparecer.

#### 5.12 Información y auditorías

a) El encargado pondrá a disposición de la gestoría toda la información
   necesaria para demostrar que cumple este contrato, y la lista de
   subencargados al día cuando se la pida.
b) Permitirá auditorías e inspecciones de la gestoría o de un auditor que ella
   designe, avisándole con [PLAZO DE AVISO DE AUDITORÍA, p. ej. 15 días], en
   horario de trabajo y sin acceso a datos de otros clientes del encargado.
   [QUIÉN PAGA LA AUDITORÍA].
c) Ayudará a la gestoría a cumplir sus obligaciones de los arts. 32 a 36 RGPD.

### 6. Obligaciones de la gestoría

La gestoría se compromete a:

a) Dar al encargado lo necesario para prestar el servicio, y en particular un
   **código** para cada uno de sus clientes (lo ideal, su propio número de
   cliente), guardando ella la relación entre código y nombre. El panel nunca
   conoce los nombres.
b) Asegurarse de que el tratamiento es lícito: tener una base jurídica e
   informar a sus clientes de que usa este servicio y a este encargado. Si la
   gestoría trata esas facturas como encargada de sus clientes, garantiza que
   tiene su autorización por escrito para recurrir a este encargado (DECISIÓN 1).
c) Asegurarse de que cada cliente autoriza el acceso del buzón a su correo y,
   cuando se pueda, usa una dirección dedicada solo a recibir facturas (así el
   buzón no lee correos que no son facturas).
d) Decir al encargado quién puede entrar al panel, y pedirle que quite el
   acceso a quien deje de necesitarlo.
e) Dar sus instrucciones por escrito, y supervisar el tratamiento, incluidas
   las inspecciones y auditorías que considere.
f) Hacer la evaluación de impacto o la consulta previa, si hicieran falta.
g) Avisar al encargado de cualquier solicitud o incidente que conozca y afecte
   al servicio.

### 7. Cuánto se guarda cada cosa

| Qué | Dónde | Cuánto tiempo | Cómo se borra |
|---|---|---|---|
| Avisos del panel (código, sí o no, frase corta, recuentos) | Panel (Railway) | **12 meses** desde que llegan | Solos, de forma automática |
| Correos de las personas con acceso | Panel | Mientras tengan acceso | Al quitarles el acceso o al dar de baja a la gestoría |
| IP y navegador de cada sesión | Panel | Mientras la sesión sigue abierta: caduca a los 30 días (y se renueva si se usa) | Al caducar se borra sola (la limpieza de `src/lib/retencion.ts`, comprobada con una prueba), y también al quitar la cuenta o con la baja |
| Enlaces para entrar | Panel (solo su huella) | 15 minutos, un solo uso | Caducan |
| Llaves del buzón | Panel (solo su huella) | Hasta que se cambian o se da de baja a la gestoría | Con la baja |
| PDF de las facturas | Carpeta de Drive (DECISIÓN 2) | [PLAZO DE CONSERVACIÓN EN DRIVE Y HOJA] | Cláusula 5.11 |
| Registro de facturas, lista de revisión y proveedores | Hoja de cálculo (DECISIÓN 2) | [PLAZO DE CONSERVACIÓN EN DRIVE Y HOJA] | Cláusula 5.11 |
| Correos originales | Gmail del negocio | Lo decide el negocio (el buzón no los borra) | — |
| Historial de ejecuciones | Servidor de n8n | [PLAZO DEL HISTORIAL DE n8n, p. ej. 14 días] | Automático, según la configuración de n8n |
| Texto mandado a la inteligencia artificial | OpenAI | [CONFIGURACIÓN DE RETENCIÓN EN OPENAI] | Según la configuración de la cuenta |
| Correo con el enlace para entrar | Resend | [SEGÚN SU REGISTRO DE ENVÍOS] | Según Resend |
| Avisos internos | Telegram (DECISIÓN 5) | [—] | [—] |

### 8. Responsabilidad

a) Cada parte responde de sus incumplimientos según el art. 82 RGPD.
b) Si el encargado usa los datos para otra cosa, los comunica o los trata
   incumpliendo este contrato, será considerado responsable de ese
   tratamiento y responderá de lo que haya hecho (art. 28.10 RGPD).
c) [LÍMITE DE RESPONSABILIDAD: si se pone alguno, que lo redacte el revisor.]
   [SEGURO: si el encargado tiene seguro de responsabilidad civil o de
   ciberriesgos, indicarlo aquí.]

### 9. Otras condiciones

a) Cualquier cambio de este contrato se hace por escrito. La lista de
   subencargados se actualiza con el procedimiento de la cláusula 5.4.
b) En lo que toca a protección de datos, este contrato prevalece sobre el
   presupuesto o contrato de servicio.
c) Si una cláusula fuera nula, las demás siguen valiendo.
d) Se rige por la ley española. Para cualquier conflicto, las partes se
   someten a los juzgados y tribunales de [JURISDICCIÓN].

## Firma

En [LUGAR], a [FECHA].

| Por la gestoría (responsable) | El encargado |
|---|---|
| | |
| Firmado: [NOMBRE DEL REPRESENTANTE] | Firmado: [NOMBRE Y APELLIDOS DEL ENCARGADO] |
| [CARGO] | |

---

## Anexo I: medidas técnicas

Explicado sin tecnicismos: qué hace el servicio para proteger los datos de los
clientes de la gestoría.

### Ver lo mínimo

- **El panel no tiene facturas.** Solo sabe, de cada cliente de la gestoría,
  su código, si va bien o hay algo que revisar, una frase corta y cuántas
  facturas. Las facturas siguen en Google Drive y en el correo del negocio.
- **Los clientes salen por código, no por nombre.** Solo la gestoría sabe qué
  cliente es cada código.
- **Un filtro rechaza lo que parezca un dato personal o dinero.** Si a un
  aviso se le colara un correo, un teléfono, un DNI, una cuenta bancaria o un
  importe, el panel no lo guarda. Como un nombre de persona no se puede
  detectar con seguridad, el buzón manda siempre frases fijas, escritas de
  antemano, sin nombres.
- **La inteligencia artificial, solo cuando hace falta** (unas pocas facturas
  de cada muchas) y nunca se acepta su respuesta sin comprobar que los
  importes cuadran.
- **La herramienta interna del encargado** solo ve el color del semáforo y
  recuentos de cada cliente del panel.

### Cada cliente solo ve lo suyo, aunque haya un fallo

- La separación entre clientes no depende solo del programa: la **propia base
  de datos** tiene una regla que solo deja ver las filas del cliente que ha
  entrado. Si un día una pantalla nueva tuviera un error, la base de datos
  seguiría sin enseñar lo de otro cliente.
- El programa entra en la base de datos con un usuario **sin privilegios**,
  que no puede saltarse esa regla. Hay pruebas automáticas que la comprueban
  a propósito con consultas sin filtro.

### Entrar sin contraseñas

- Se entra con **un enlace que llega al correo**: vale 15 minutos y se puede
  usar una sola vez. No hay contraseñas que se puedan robar o repetir.
- **No hay registro abierto:** solo pueden entrar las personas que el
  encargado da de alta a petición de la gestoría.
- La pantalla de entrada responde igual exista o no la cuenta, para que nadie
  pueda averiguar quién es cliente. Se mandan como mucho 3 enlaces por correo
  cada 15 minutos.
- La sesión caduca a los 30 días y se puede cerrar con «Salir».

### Llaves y frenos

- El buzón manda sus avisos con una **llave propia de cada cliente**. El panel
  solo guarda su huella (un resumen del que no se puede sacar la llave): si
  alguien copiara la base de datos, no tendría las llaves. Hay una sola llave
  viva por producto y se puede cambiar en cualquier momento.
- La llave decide de qué cliente es un aviso: con la llave de un cliente no se
  puede escribir en el panel de otro.
- **Frenos:** como mucho 120 avisos por minuto por producto, y quien pruebe
  llaves falsas queda frenado aparte (30 intentos por minuto), sin estorbar a
  las buenas.

### Conexiones cifradas y web cerrada

- Todas las conexiones con el panel van cifradas (https), y el navegador
  recuerda que solo debe entrar así.
- El panel no aparece en buscadores ni se puede incrustar en otra web.
- La contraseña de la base de datos de la aplicación se guarda ya cifrada.

### Borrar a tiempo

- Los avisos del panel **se borran solos a los 12 meses**.
- Dar de baja a la gestoría **borra de una vez** todo lo suyo en el panel:
  productos, llaves, avisos y las cuentas de sus personas.
- Quitar el acceso a la última persona de un cliente borra también su cuenta:
  no se guarda un correo que ya no hace falta.

### El buzón

- Solo **lee** el correo del negocio: no borra ni mueve mensajes. El permiso
  de acceso lo puede retirar el negocio desde su cuenta de Google cuando
  quiera.
- No se descarta nada en silencio: lo que no se puede leer va a una lista de
  revisión.
- Si un flujo falla o cae un permiso de acceso, el encargado recibe un aviso
  enseguida, y el panel lo enseña en su semáforo.

### Vigilancia y revisión

- Pruebas automáticas vigilan en cada cambio las reglas de arriba (separación
  entre clientes, el filtro, quién puede usar qué).
- El panel tuvo una revisión de seguridad en octubre de 2026; lo encontrado
  se arregló y está apuntado.

### Por confirmar antes de firmar

- [Verificación en dos pasos en todas las cuentas del servicio: Railway, n8n,
  Google, OpenAI, Resend, GitHub.]
- [Copias de seguridad de la base de datos del panel y de n8n: si hay, dónde
  y cuánto duran.]
- [Permisos de acceso a Google guardados cifrados en n8n.]
- [Historial de ejecuciones de n8n recortado a [PLAZO DEL HISTORIAL DE n8n].]

---

## Anexo II: lista de comprobación antes de firmar

Para ti, Jordi. Lo que hay que tener hecho o decidido antes de mandar el
contrato al revisor y, después, a la gestoría.

### Decidir

- [ ] **DECISIÓN 1:** con el revisor, quién es el responsable (la gestoría,
      cada negocio o la gestoría como encargada de sus clientes).
- [ ] **DECISIÓN 2:** en qué cuenta de Google viven la carpeta y la hoja
      (opción A o B), y mirar en n8n de quién son de verdad las credenciales
      «Google Drive» y «Google Sheets» que usa la v3.
- [ ] **DECISIÓN 3:** qué borras al terminar, en qué plazo y si entregas una
      copia antes.
- [ ] **DECISIÓN 4 (OpenAI):** mantenerlo o no; si sí, con qué configuración.
- [ ] **DECISIÓN 5 (Telegram):** dejar los avisos sin nombres ni importes
      (solo códigos y recuentos) o listarlo como subencargado.
- [ ] **DECISIÓN 6 (asistentes de IA):** no darles acceso a datos reales
      (ejecuciones de n8n, la hoja, los PDF, textos de facturas para pruebas)
      o listarlos como subencargados.
- [ ] Los plazos: aviso de brechas, aviso de subencargados nuevos, reenvío de
      solicitudes, devolución y borrado, aviso de auditoría.

### Comprobar a los proveedores

- [ ] **Railway:** qué región usa el panel (mejor una de la UE), su adenda de
      tratamiento de datos y su garantía para EE. UU.; si hace copias de
      seguridad de la base de datos y cuánto duran.
- [ ] **n8n:** dónde corre de verdad (proveedor y región), y lo mismo que con
      Railway.
- [ ] **Resend:** su adenda y su garantía; si deja elegir región de envío en la
      UE; cuánto guarda el registro de correos enviados. De paso, verificar el
      dominio propio (está en `ROADMAP.md`).
- [ ] **OpenAI:** aceptar su adenda de tratamiento de datos; confirmar que lo
      enviado por la API no se usa para entrenar; pedir o activar que no guarde
      los datos («retención cero») o apuntar cuántos días los guarda; ver si se
      puede usar una región europea.
- [ ] **Google:** si eliges la opción B, cuenta de Google Workspace (no una
      gratuita de Gmail) con su adenda de tratamiento de datos aceptada.
- [ ] Rellenar la columna «Garantía si sale de la UE» de la tabla con lo que
      diga cada uno (Marco de Privacidad de Datos UE-EE. UU. o cláusulas
      contractuales tipo).

### Configurar

- [ ] Verificación en dos pasos en Railway, n8n, Google, OpenAI, Resend y
      GitHub.
- [ ] En n8n, recortar cuánto se guarda el historial de ejecuciones (lleva el
      texto de las facturas) y apuntar el plazo en la cláusula 7.
- [ ] Comprobar que las sesiones caducadas del panel se borran de la base de
      datos; si no, añadir su limpieza a la de los avisos.
- [ ] Recomendar a cada negocio una dirección de correo solo para facturas.
- [ ] Ningún dato real de clientes en GitHub (ni en este repo, que es público,
      ni en el del buzón): ni facturas, ni textos de facturas para pruebas, ni
      el contrato firmado.

### Tener por escrito (aunque no se firme)

- [ ] Tu registro de actividades como encargado (cláusula 5.9).
- [ ] Qué harás si hay una brecha: a quién llamas, qué apuntas, en qué plazo
      avisas (cláusula 5.7).
- [ ] La lista de personas autorizadas (hoy, solo tú) y su compromiso de
      secreto si algún día se suma alguien.

### Al firmar

- [ ] Quitar las notas en cursiva («Nota para el revisor», «Nota para Jordi»)
      y este anexo.
- [ ] Revisar que no queda ningún corchete sin rellenar.
- [ ] Dos copias firmadas (o firma electrónica), guardadas fuera del repo.
- [ ] Cuando cambie un subencargado, avisar a la gestoría con el plazo
      acordado y actualizar la tabla.
