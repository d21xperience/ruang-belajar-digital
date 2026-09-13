#!/bin/bash
# =============================================================
# deploy.sh — Build & Deploy Ruang Belajar Digital ke GitHub Pages
# =============================================================

set -e

REPO_URL="https://github.com/d21xperience/ruang-belajar-digital.git"
BRANCH_DEPLOY="gh-pages"
LIVE_URL="https://d21xperience.github.io/ruang-belajar-digital/"
MSG="${1:-Deploy $(date '+%Y-%m-%d %H:%M')}"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}▶ $1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}
print_ok()    { echo -e "${GREEN}✅ $1${NC}"; }
print_warn()  { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }

trap 'print_error "Script gagal di baris $LINENO."' ERR

# ═══════════════════════════════════════════════════════════
print_step "0/6 — Cek lingkungan"
# ═══════════════════════════════════════════════════════════
[ -f "package.json" ] || { print_error "Tidak ada package.json"; exit 1; }
[ -f "quasar.config.js" ] || { print_error "Bukan project Quasar"; exit 1; }
git rev-parse --git-dir > /dev/null 2>&1 || { print_error "Bukan git repo"; exit 1; }
print_ok "Lingkungan OK"

# ═══════════════════════════════════════════════════════════
print_step "1/6 — Commit & push source ke main"
# ═══════════════════════════════════════════════════════════
if [ -n "$(git status --porcelain)" ]; then
  git add .
  git commit -m "$MSG"
  print_ok "Commit lokal: $MSG"
else
  print_warn "Tidak ada perubahan source — skip commit"
fi

if [ "$(git rev-list @{u}..HEAD 2>/dev/null | wc -l)" -gt 0 ]; then
  git push origin main
  print_ok "Push ke main sukses"
else
  print_warn "Tidak ada commit baru — skip push"
fi

# ═══════════════════════════════════════════════════════════
print_step "2/6 — Build PWA (production)"
# ═══════════════════════════════════════════════════════════
rm -rf dist/pwa
quasar build -m pwa

[ -d "dist/pwa" ] || { print_error "Folder dist/pwa tidak ada"; exit 1; }
print_ok "Build PWA selesai"

# ═══════════════════════════════════════════════════════════
print_step "3/6 — Verifikasi build output"
# ═══════════════════════════════════════════════════════════

# ═══ Cek placeholder EJS (FIXED) ═══
if grep -q "<%" dist/pwa/index.html 2>/dev/null; then
  print_error "Masih ada placeholder '<%' di index.html"
  exit 1
fi
print_ok "Tidak ada placeholder EJS"

# ═══ Cek file index.html tidak kosong (FIXED — lebih lenient) ═══
HTML_SIZE=$(wc -c < dist/pwa/index.html)
if [ "$HTML_SIZE" -lt 500 ]; then
  print_error "index.html terlalu kecil (${HTML_SIZE} bytes)"
  exit 1
fi
print_ok "index.html OK (${HTML_SIZE} bytes)"

# ═══ Cek file PWA penting ═══
for f in "sw.js" "manifest.json"; do
  if [ ! -f "dist/pwa/$f" ]; then
    print_error "File '$f' tidak ditemukan"
    exit 1
  fi
done
print_ok "File PWA (sw.js, manifest.json) ada"

# ═══ .nojekyll ═══
if [ ! -f "dist/pwa/.nojekyll" ]; then
  touch dist/pwa/.nojekyll
  print_warn ".nojekyll dibuat otomatis"
else
  print_ok ".nojekyll ada"
fi

# ═══ Cek icons folder ═══
if [ -d "dist/pwa/icons" ] && [ "$(ls -1 dist/pwa/icons/*.png 2>/dev/null | wc -l)" -gt 0 ]; then
  ICON_COUNT=$(ls -1 dist/pwa/icons/*.png 2>/dev/null | wc -l)
  print_ok "Folder icons berisi $ICON_COUNT file PNG"
else
  print_warn "Folder icons kosong atau tidak ada"
fi

# ═══════════════════════════════════════════════════════════
print_step "4/6 — Siapkan folder deploy"
# ═══════════════════════════════════════════════════════════
cd dist/pwa

rm -rf .git
git init -q
git checkout -q -b "$BRANCH_DEPLOY"
git add -A
git commit -q -m "$MSG"

print_ok "Commit deploy: $MSG"

# ═══════════════════════════════════════════════════════════
print_step "5/6 — Push ke GitHub Pages"
# ═══════════════════════════════════════════════════════════
git remote add origin "$REPO_URL"
git push -f origin "$BRANCH_DEPLOY"
print_ok "Push ke $BRANCH_DEPLOY sukses"

cd ../..

# ═══════════════════════════════════════════════════════════
print_step "6/6 — Selesai!"
# ═══════════════════════════════════════════════════════════
echo ""
print_ok "🎉 DEPLOY BERHASIL!"
echo ""
echo -e "${YELLOW}🌐 Live URL:${NC} $LIVE_URL"
echo ""
echo -e "${YELLOW}⏱  Tunggu 30–90 detik, lalu buka URL (hard refresh: Ctrl+Shift+R)${NC}"
echo ""
