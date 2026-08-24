#!/usr/bin/env bash
# ==========================================================
# git.sh — Quick add, commit, push untuk web-hse-cctv-pim
# ==========================================================
# Kenapa dibutuhkan:
# Alur git yang sering dipakai (add semua perubahan -> commit
# dengan pesan -> push ke branch aktif) biasanya diketik manual
# 3 baris terpisah tiap kali mau push. Script ini menyatukannya
# jadi satu perintah, sekaligus menampilkan status sebelum &
# sesudah supaya tidak ada perubahan yang ke-skip tanpa sadar.
#
# Script ini:
#   1. Tampilkan status & branch aktif saat ini
#   2. git add (semua file, atau file tertentu kalau dikasih -f)
#   3. Cek supaya .env tidak ikut ke-stage / sudah ter-track
#   4. git commit dengan pesan yang kamu tulis
#   5. git push ke remote origin, branch aktif saat ini
#
# Cara pakai:
#   chmod +x git.sh
#   ./git.sh "fix: perbaiki path import axios di CCTV.jsx"
#       -> add semua perubahan, commit, push ke branch aktif
#
#   ./git.sh "fix: perbaiki bug X" -f src/landing/pages/CCTV.jsx
#       -> add HANYA file yang disebutkan setelah -f (bisa lebih dari satu)
#
#   ./git.sh --status
#       -> tampilkan status git saja, tanpa commit/push
# ==========================================================

set -e

# ---- Cek argumen ----
if [ "$1" == "--status" ]; then
echo "=========================================="
echo "📍 Branch aktif : $(git branch --show-current)"
echo "=========================================="
git status
exit 0
fi

if [ -z "$1" ]; then
echo "❌ Error: pesan commit belum diisi."
echo ""
echo "Cara pakai:"
echo "  ./git.sh \"pesan commit kamu\""
echo "  ./git.sh \"pesan commit kamu\" -f file1 file2"
echo "  ./git.sh --status"
exit 1
fi

COMMIT_MSG="$1"
shift

# ---- Parsing file spesifik (opsional, setelah -f) ----
FILES=()
if [ "$1" == "-f" ]; then
shift
FILES=("$@")
fi

BRANCH="$(git branch --show-current)"

echo "=========================================="
echo "📍 Branch aktif : $BRANCH"
echo "💬 Pesan commit : $COMMIT_MSG"
if [ ${#FILES[@]} -eq 0 ]; then
echo "📂 File yang di-add : SEMUA perubahan"
else
echo "📂 File yang di-add : ${FILES[*]}"
fi
echo "=========================================="

echo ""
echo "📋 [1/5] Status sebelum add:"
git status --short

# ---- Safety check: .env sudah pernah ter-track git? ----
echo ""
echo "🔒 [2/5] Cek keamanan .env..."
TRACKED_ENV=$(git ls-files | grep -E '(^|/)\.env(\..+)?$' || true)
if [ -n "$TRACKED_ENV" ]; then
  echo "⚠️  BAHAYA: file .env berikut SUDAH ter-track oleh git (gitignore tidak"
  echo "    berlaku untuk file yang sudah ditrack sebelumnya):"
  echo "$TRACKED_ENV" | sed 's/^/    - /'
  echo ""
  echo "    Jalankan dulu: git rm --cached <path-file-di-atas>"
  echo "    lalu commit penghapusannya sebelum lanjut pakai script ini."
  exit 1
fi
echo "Aman — tidak ada .env yang ter-track."

echo ""
echo "➕ [3/5] Menambahkan perubahan..."
if [ ${#FILES[@]} -eq 0 ]; then
git add .
else
git add "${FILES[@]}"
fi

# ---- Safety check: .env somehow masuk staging area? ----
STAGED_ENV=$(git diff --cached --name-only | grep -E '(^|/)\.env(\..+)?$' || true)
if [ -n "$STAGED_ENV" ]; then
  echo "⚠️  BAHAYA: file berikut ke-stage padahal seharusnya di-ignore:"
  echo "$STAGED_ENV" | sed 's/^/    - /'
  git reset -- $STAGED_ENV
  echo "    Sudah di-unstage otomatis. Cek .gitignore kamu, lalu jalankan ulang."
  exit 1
fi

echo ""
echo "📝 [4/5] Commit..."
git commit -m "$COMMIT_MSG"

echo ""
echo "🚀 [5/5] Push ke origin/$BRANCH..."
git push origin "$BRANCH"

echo ""
echo "=========================================="
echo "✅ Selesai. Log commit terbaru:"
echo "=========================================="
git log --oneline -5