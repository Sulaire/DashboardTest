#!/bin/sh
# Gancho de Cosmerito (el HUB de Jordi): avisa de que esta sesión de Claude
# está trabajando o ha terminado su turno, para que la oficina del HUB lo sepa
# sin esperar a un commit. Lo llama .claude/settings.json:
#   trabajando: al recibir un mensaje · pulso: tras cada herramienta (como mucho
#   cada 3 minutos) · espera: al terminar el turno.
# Manda solo el id de la sesión, el repo y la rama: nada del chat ni del código.
# Sin COSMERITO_URL y COSMERITO_LATIDO_TOKEN en el entorno, o si el HUB no
# responde, no hace nada y nunca estorba a la sesión.
# Más: docs/PARA_CADA_REPO.md de Sulaire/Cosmerito. No lo edites a mano: si el
# HUB te pasa una versión nueva, sustitúyelo entero. Versión 1.

evento="$1"
cat >/dev/null 2>&1 # Lo que Claude pasa por la entrada no hace falta (y no se manda).
url="${COSMERITO_URL:-}"
token="${COSMERITO_LATIDO_TOKEN:-}"
sesion="${CLAUDE_CODE_REMOTE_SESSION_ID:-}"
[ -n "$url" ] && [ -n "$token" ] && [ -n "$sesion" ] || exit 0
case "$evento" in trabajando | pulso | espera) ;; *) exit 0 ;; esac

if [ "$evento" = "pulso" ]; then
  marca="${TMPDIR:-/tmp}/cosmerito-latido-$sesion"
  [ -f "$marca" ] && [ -n "$(find "$marca" -mmin -3 2>/dev/null)" ] && exit 0
  : >"$marca" 2>/dev/null
fi

# Un repo: "remoto|rama" (sin usuario ni clave en el remoto).
repo_de() {
  r=$(git -C "$1" remote get-url origin 2>/dev/null | sed 's#//[^@/]*@#//#') || return 1
  b=$(git -C "$1" branch --show-current 2>/dev/null)
  [ -n "$r" ] && [ -n "$b" ] && printf '{"repo":"%s","rama":"%s"},' "$r" "$b"
}

principal="${CLAUDE_PROJECT_DIR:-$(pwd)}"
lista=$(repo_de "$principal")
# Los demás repos de la sesión (carpetas hermanas), solo si se han tocado: cambios sin subir o un commit en la última media hora.
for g in "$(dirname "$principal")"/*/.git; do
  d=$(dirname "$g")
  [ "$d" = "$principal" ] || [ ! -d "$g" ] && continue
  if [ -n "$(git -C "$d" status --porcelain 2>/dev/null | head -1)" ] || [ -n "$(git -C "$d" log -1 --since='30 minutes ago' --format=x 2>/dev/null)" ]; then
    lista="$lista$(repo_de "$d")"
  fi
done
[ -n "$lista" ] || exit 0

curl -s -m 4 -o /dev/null -X POST "$url/api/claude/latido" \
  -H "Authorization: Bearer $token" -H "Content-Type: application/json" \
  --data "{\"evento\":\"$evento\",\"sesion\":\"$sesion\",\"repos\":[${lista%,}]}" >/dev/null 2>&1
exit 0
