-- Clientes, lo que tiene contratado cada uno, las llaves de los productos y
-- los avisos que mandan. Con seguridad por filas: lea docs/COMO_FUNCIONA.md.
--
-- Dos usuarios de Postgres:
--   · el dueño (el de DATABASE_URL): crea las tablas y lo usa solo el panel
--     de administrador. El dueño se salta las reglas por filas.
--   · panel_app: el que usa la app para todo lo demás. No es dueño de nada y
--     no puede saltarse las reglas: solo ve las filas del cliente que la app
--     le diga en cada transacción (app.cliente_id, con SET LOCAL).

do $$
begin
  if not exists (select from pg_roles where rolname = 'panel_app') then
    create role panel_app nologin nosuperuser nocreatedb nocreaterole nobypassrls;
  end if;
end
$$;

-- El cliente de la transacción en curso, o null si no se ha dicho ninguno
-- (y entonces las reglas no dejan ver nada).
create function cliente_actual() returns uuid
  language sql stable
  as $$ select nullif(current_setting('app.cliente_id', true), '')::uuid $$;

-- Un cliente de Jordi (p. ej. la gestoría). Los clientes de ese cliente no
-- son filas aquí: son códigos dentro de sus avisos ("017").
create table clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  creado_en timestamptz not null default now()
);

-- Quién puede entrar a ver cada cliente.
create table miembros (
  usuario_id text not null references "user" (id) on delete cascade,
  cliente_id uuid not null references clientes (id) on delete cascade,
  creado_en timestamptz not null default now(),
  primary key (usuario_id, cliente_id)
);

-- Un producto contratado por un cliente = una pestaña de su panel.
-- bloques: los ids de los bloques que quiere ver (null = todos los del producto).
create table contrataciones (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes (id) on delete cascade,
  producto text not null,
  bloques text[],
  activa boolean not null default true,
  creado_en timestamptz not null default now(),
  unique (cliente_id, producto),
  unique (id, cliente_id)
);

-- La llave con la que un producto (p. ej. el n8n del buzón de esa gestoría)
-- manda sus avisos. Solo se guarda su huella: la llave se enseña una vez.
-- La llave decide el cliente: quien la tiene no puede escribir en otro.
create table llaves_producto (
  id uuid primary key default gen_random_uuid(),
  contratacion_id uuid not null,
  cliente_id uuid not null,
  huella text not null unique,
  creada_en timestamptz not null default now(),
  revocada_en timestamptz,
  foreign key (contratacion_id, cliente_id) references contrataciones (id, cliente_id) on delete cascade
);

-- Lo que cuenta cada producto: { producto, cliente, ok, texto, cifras }.
-- codigo = el "cliente" del aviso (el cliente de la gestoría, p. ej. "017").
-- Se borran solos a los 12 meses (src/lib/retencion.ts).
create table avisos (
  id bigserial primary key,
  cliente_id uuid not null,
  contratacion_id uuid not null,
  codigo text,
  ok boolean not null,
  texto text not null,
  cifras jsonb not null default '{}',
  recibido_en timestamptz not null default now(),
  foreign key (contratacion_id, cliente_id) references contrataciones (id, cliente_id) on delete cascade
);
create index avisos_contratacion_fecha on avisos (contratacion_id, recibido_en desc);
create index avisos_fecha on avisos (recibido_en);

-- Las reglas por filas: cada tabla con datos de un cliente solo enseña (y
-- solo deja escribir) las filas del cliente de la transacción.
alter table clientes enable row level security;
create policy solo_el_suyo on clientes using (id = cliente_actual());

alter table contrataciones enable row level security;
create policy solo_el_suyo on contrataciones using (cliente_id = cliente_actual());

alter table avisos enable row level security;
create policy solo_el_suyo on avisos using (cliente_id = cliente_actual()) with check (cliente_id = cliente_actual());

-- Lo que puede hacer panel_app, y nada más.
grant usage on schema public to panel_app;
grant select, insert, update, delete on "user", "session", "account", "verification" to panel_app;
grant select on clientes, contrataciones to panel_app;
grant select, insert on avisos to panel_app;
grant usage on sequence avisos_id_seq to panel_app;
-- Antes de saber el cliente hace falta leer estas dos (solo ids y huellas).
grant select on miembros, llaves_producto to panel_app;
