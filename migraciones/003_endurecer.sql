-- En Postgres anteriores al 15, cualquier usuario puede crear tablas y
-- funciones en el esquema public. panel_app no lo necesita, y quitárselo
-- evita que una consulta mal hecha (o inyectada) deje algo plantado ahí.
-- En Postgres 15 o más ya viene así; repetirlo no hace daño.
revoke create on schema public from public;
