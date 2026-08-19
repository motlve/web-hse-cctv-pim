#!/usr/bin/env bash
# ==========================================================
# rebuild.sh — Force clean rebuild untuk web-hse-cctv-pim
# ==========================================================
# Kenapa dibutuhkan:
# Docker meng-cache setiap layer build. Kalau kamu cuma jalanin
# `docker compose up -d --build`, layer yang sama (mis. `COPY . .`
# atau `npm ci`) kadang tetap dipakai dari cache walau source
# code sudah berubah — hasilnya container jalan tapi pakai kode LAMA.
#
# Script ini:
#   1. Stop semua container
#   2. Hapus image lokal (service yang direbuild) — TIDAK menyentuh
#      image mysql:8 yang di-pull, dan TIDAK menyentuh volume DB
#   3. Build ulang total dengan --no-cache
#   4. Start SEMUA service lagi (termasuk yang tidak direbuild,
#      supaya tidak ketinggalan mati kayak sebelumnya)
#
# Cara pakai:
#   chmod +x rebuild.sh
#   ./rebuild.sh                      -> rebuild semua service
#   ./rebuild.sh frontend              -> rebuild frontend saja
#   ./rebuild.sh backend               -> rebuild backend saja
#   ./rebuild.sh frontend backend      -> rebuild frontend & backend (BISA lebih dari satu!)
#   ./rebuild.sh --hard                -> rebuild semua + hapus SEMUA image (termasuk base image)
# ==========================================================

set -e

# ---- Parsing argumen ----
# Kumpulkan semua argumen yang BUKAN "--hard" sebagai daftar service.
# Kalau tidak ada argumen sama sekali -> rebuild semua service.
TARGETS=()
HARD_MODE=false

for arg in "$@"; do
  if [ "$arg" == "--hard" ]; then
    HARD_MODE=true
  else
    TARGETS+=("$arg")
  fi
done

if [ ${#TARGETS[@]} -eq 0 ]; then
  MODE_LABEL="SEMUA service"
else
  MODE_LABEL="${TARGETS[*]}"
fi

echo "=========================================="
echo "🎯 Target rebuild : $MODE_LABEL"
[ "$HARD_MODE" == true ] && echo "⚠️  Mode HARD aktif"
echo "=========================================="

echo ""
echo "🛑 [1/4] Stop & remove container yang sedang jalan..."
docker compose down

echo ""
echo "🗑  [2/4] Hapus image lama..."
if [ "$HARD_MODE" == true ]; then
  echo "   -> Mode HARD: hapus semua image lokal termasuk cache layer dasar"
  docker compose down --rmi all
  docker builder prune -af
elif [ ${#TARGETS[@]} -eq 0 ]; then
  echo "   -> Hapus image semua service lokal (mysql:8 tetap dari cache)"
  docker compose down --rmi local
else
  for svc in "${TARGETS[@]}"; do
    echo "   -> Hapus image service: $svc"
    docker rmi -f "$(docker compose images -q "$svc" 2>/dev/null)" 2>/dev/null || true
  done
fi

echo ""
echo "🔨 [3/4] Build ulang tanpa cache..."
if [ ${#TARGETS[@]} -eq 0 ]; then
  docker compose build --no-cache
else
  docker compose build --no-cache "${TARGETS[@]}"
fi

echo ""
echo "🚀 [4/4] Start ulang SEMUA container (biar tidak ada yang ketinggalan mati)..."
docker compose up -d --force-recreate

echo ""
echo "=========================================="
echo "✅ Selesai. Status container sekarang:"
echo "=========================================="
docker compose ps

echo ""
echo "📋 Lihat log realtime dengan:"
echo "   docker compose logs -f"