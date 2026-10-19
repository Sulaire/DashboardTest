-- Una sola llave viva por producto contratado. Antes, dos clics seguidos en
-- «Cambiar la llave» podían dejar varias vivas (auditoría del 19-10-2026). Si
-- ya hubiera varias, se queda la más nueva.
update llaves_producto l set revocada_en = now()
where l.revocada_en is null
  and exists (
    select 1 from llaves_producto m
    where m.contratacion_id = l.contratacion_id and m.revocada_en is null and m.creada_en > l.creada_en
  );
create unique index llave_viva_unica on llaves_producto (contratacion_id) where revocada_en is null;

-- Para saber deprisa cuándo habló por última vez cada código, aunque haga
-- meses (el semáforo pasa a rojo, no a gris, si un producto lleva mucho callado).
create index avisos_contratacion_codigo on avisos (contratacion_id, codigo, recibido_en desc);
