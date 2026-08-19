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
#   2. Hapus image lokal (frontend & backend) — TIDAK menyentuh
#      image mysql:8 yang di-pull, dan TIDAK menyentuh volume DB
#   3. Build ulang total dengan --no-cache
#   4. Start ulang dengan --force-recreate
#
# Cara pakai:
#   chmod +x rebuild.sh
#   ./rebuild.sh              -> rebuild semua service (frontend+backend)
#   ./rebuild.sh frontend     -> rebuild frontend saja
#   ./rebuild.sh backend      -> rebuild backend saja
#   ./rebuild.sh all --hard   -> rebuild semua + hapus SEMUA image (termasuk base image)
# ==========================================================

set -e

TARGET="${1:-all}"
HARD_FLAG="${2:-}"

echo "=========================================="
echo "🎯 Target rebuild : $TARGET"
echo "=========================================="

echo ""
echo "🛑 [1/4] Stop & remove container yang sedang jalan..."
docker compose down

echo ""
echo "🗑  [2/4] Hapus image lama..."
if [ "$TARGET" == "all" ]; then
  if [ "$HARD_FLAG" == "--hard" ]; then
    echo "   -> Mode HARD: hapus semua image lokal termasuk cache layer dasar"
    docker compose down --rmi all
    docker builder prune -af
  else
    echo "   -> Mode normal: hapus image frontend & backend saja (image mysql:8 tetap dipakai dari cache)"
    docker compose down --rmi local
  fi
else
  echo "   -> Hapus image service: $TARGET"
  docker rmi -f "$(docker compose images -q "$TARGET" 2>/dev/null)" 2>/dev/null || true
fi

echo ""
echo "🔨 [3/4] Build ulang tanpa cache..."
if [ "$TARGET" == "all" ]; then
  docker compose build --no-cache
else
  docker compose build --no-cache "$TARGET"
fi

echo ""
echo "🚀 [4/4] Start ulang container..."
if [ "$TARGET" == "all" ]; then
  docker compose up -d --force-recreate
else
  docker compose up -d --force-recreate --no-deps "$TARGET"
fi

echo ""
echo "=========================================="
echo "✅ Selesai. Status container sekarang:"
echo "=========================================="
docker compose ps

echo ""
echo "📋 Lihat log realtime dengan:"
echo "   docker compose logs -f $([ "$TARGET" != "all" ] && echo "$TARGET")"