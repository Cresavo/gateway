#!/usr/bin/env bash
# SPDX-License-Identifier: AGPL-3.0-only
set -euo pipefail
umask 077
# Start with a clean environment so an operator's salon, proxy or DB settings
# cannot select a different target or mode during installation and seeding.
if [[ ${1:-} != --isolated ]]; then
  exec env -i LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 PATH="$PATH" HOME="$HOME" TMPDIR="${TMPDIR:-/tmp}" \
    CRESAVO_CHECKOUT="${CRESAVO_CHECKOUT:-}" GITHUB_ACTIONS="${GITHUB_ACTIONS:-}" \
    E2E_POSTGRES_PORT="${E2E_POSTGRES_PORT:-}" bash "$0" --isolated
fi
root=$(cd "$(dirname "$0")/../.." && pwd)
revision=ffbfc48e2299bb4854eba71698468f9745d61b99
scratch=$(mktemp -d /tmp/cresavo-e2e.XXXXXXXX)
db_name="gateway_$(openssl rand -hex 8)_test"
started_db=0
created_db=0
cleanup() {
  if [[ $created_db = 1 ]]; then dropdb "$db_name"; fi
  if [[ $started_db = 1 ]]; then pg_ctl -D "$scratch/pg" -m immediate -w stop >/dev/null; fi
  rm -rf "$scratch"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
mkdir "$scratch/salon"
if [[ -n ${CRESAVO_CHECKOUT:-} ]]; then
  git -C "$CRESAVO_CHECKOUT" archive "$revision" | tar -x -C "$scratch/salon"
else
  git init -q "$scratch/source"
  git -C "$scratch/source" fetch -q --depth=1 https://github.com/Cresavo/cresavo.git "$revision"
  git -C "$scratch/source" archive "$revision" | tar -x -C "$scratch/salon"
fi
echo "[real] Cresavo $revision"
export PGHOST=127.0.0.1 PGUSER=postgres
unset PGSERVICE PGSERVICEFILE PGOPTIONS PGHOSTADDR PGPASSWORD
export PGPASSFILE=/dev/null
if [[ -n ${E2E_POSTGRES_PORT:-} ]]; then
  # The CI job supplies a disposable, loopback-only PostgreSQL service.
  [[ ${GITHUB_ACTIONS:-} = true && $E2E_POSTGRES_PORT =~ ^[0-9]+$ ]]
  export PGPORT="$E2E_POSTGRES_PORT"
  db_user=postgres
else
  export PGPORT=$(node --input-type=module -e 'import net from "node:net"; const s=net.createServer(); s.listen(0,"127.0.0.1",()=>{console.log(s.address().port);s.close()})')
  openssl rand -hex 32 > "$scratch/password"
  initdb -D "$scratch/pg" -U postgres --auth-local=scram-sha-256 --auth-host=scram-sha-256 --pwfile="$scratch/password" >/dev/null
  pg_ctl -D "$scratch/pg" -l "$scratch/postgres.log" -o "-h 127.0.0.1 -p $PGPORT -k $scratch" -w start >/dev/null
  started_db=1
  export PGPASSWORD=$(cat "$scratch/password")
  db_user="postgres:$PGPASSWORD"
fi
createdb "$db_name"
created_db=1
export DATABASE_URL="postgresql://$db_user@127.0.0.1:$PGPORT/$db_name"
export SESSION_SECRET=$(openssl rand -hex 32)
export NEXT_TELEMETRY_DISABLED=1
cd "$scratch/salon"
# Keep build tools, database URLs and provider stdout out of CI logs.
step() {
  local label=$1
  shift
  echo "[real] $label"
  "$@" >/dev/null 2>&1 || { echo "[real] failed during $label" >&2; return 1; }
}
step "install provider dependencies" npm ci --no-fund
step "generate Prisma client" node_modules/.bin/prisma generate
step "migrate empty test database" npm run db:migrate
step "seed demo salon" npm run db:seed
step "build provider" npm run build
step "install test browser" node_modules/.bin/playwright install chromium
# This test operator resolves dependencies from the disposable provider checkout.
cp "$root/scripts/real/operator.mjs" ./gateway-test-operator.mjs
export E2E_OPERATOR="$PWD/gateway-test-operator.mjs"
node --import tsx "$root/scripts/e2e.js" --real
