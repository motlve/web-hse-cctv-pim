#!/usr/bin/env bash
#
# debug-routes.sh
# Cek cepat semua route penting di stack web-hse-cctv-pim lewat nginx,
# supaya ketahuan langsung mana yang 404 / 502 / salah container,
# tanpa harus klak-klik manual satu-satu di browser.
#
# Cara pakai:
#   chmod +x debug-routes.sh
#   ./debug-routes.sh
#
# Opsional, kalau host/port bukan default:
#   BASE_URL=http://localhost:8080 ./debug-routes.sh

BASE_URL="${BASE_URL:-http://localhost}"

# Format: "METHOD|PATH|deskripsi singkat"
ROUTES=(
  "GET|/|Company profile — beranda"
  "GET|/login/hse|App HSE — halaman login"
  "GET|/login/paramedis|App Paramedis — halaman login"
  "GET|/dashboard/login|App CCTV (dashboard) — halaman login"
  "GET|/api/public/officer|API — data petugas CCTV (publik)"
  "GET|/api/public/paramedic|API — data paramedis (publik, kalau sudah ada)"
  "GET|/api/login|API — endpoint login (biasanya 405 kalau diakses GET, itu wajar)"
)

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

printf "${BOLD}Base URL: %s${NC}\n\n" "$BASE_URL"
printf "%-45s %-6s %-8s %s\n" "PATH" "METHOD" "STATUS" "KETERANGAN"
printf -- '-%.0s' {1..90}; echo

for entry in "${ROUTES[@]}"; do
  IFS='|' read -r method path desc <<< "$entry"
  url="${BASE_URL}${path}"

  # -s silent, -o /dev/null buang body, -w print status+time, --max-time biar ga nggantung
  result=$(curl -s -o /dev/null -w "%{http_code}|%{time_total}" --max-time 5 -X "$method" "$url")
  status="${result%%|*}"
  time_total="${result##*|}"

  if [[ "$status" =~ ^2 ]]; then
    color="$GREEN"
  elif [[ "$status" =~ ^3 ]] || [[ "$status" == "405" ]]; then
    color="$YELLOW"
  else
    color="$RED"
  fi

  printf "%-45s %-6s ${color}%-8s${NC} %s  ${YELLOW}(%.2fs)${NC}\n" \
    "$path" "$method" "$status" "$desc" "$time_total"
done

echo
printf "${BOLD}Catatan cara baca hasil:${NC}\n"
echo "  200/204  → oke, kemungkinan besar sehat"
echo "  301/302  → redirect, biasanya masih wajar (cek arahnya kalau curl -L)"
echo "  405      → endpoint ada tapi method salah, WAJAR untuk endpoint POST yg dites GET"
echo "  404      → route tidak ketemu — cek pendaftaran route di backend ATAU nginx location"
echo "  502/504  → nginx tidak bisa connect ke container upstream — cek nama service & network Docker"
echo "  000      → request gagal total (timeout/refused) — nginx sendiri kemungkinan belum jalan"
echo
printf "${BOLD}Kalau ada yang 404/502, lanjutkan cek manual:${NC}\n"
echo "  docker compose ps                     # semua container status 'Up'?"
echo "  docker compose logs -f <nama-service>  # cek error spesifik service itu"
echo "  docker network inspect <nama-network>  # pastikan nginx & backend satu network"