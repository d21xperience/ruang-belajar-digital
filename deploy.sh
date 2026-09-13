#!/bin/bash
# =============================================================
# deploy.sh — Build & Deploy Ruang Belajar Digital ke GitHub Pages
# =============================================================
# Cara pakai:
#   ./deploy.sh                    → pesan commit otomatis (tanggal/waktu)
#   ./deploy.sh "Tambah modul 3"   → pesan commit custom
# =============================================================

set -e  # Stop on error

# ═══════════════════════════════════════════════════════════
# Konfigurasi
# ═══════════════════════════════════════════════════════════
REPO_URL="https://github.com/d21xperience/ruang-belajar-digital.git"
BRANCH_DEPLOY="gh-pages"
LIVE_URL="https://d21xperience.github.io/ruang-belajar-digital/"
MSG="${1:-Deploy $(date '+%Y-%m-%d %H:%M')}"

# ═══════════════════════════════════════════════════════════
# Warna terminal
# ═══════════════════════════════════════════════════════════
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# ═══════════════════════════════════════════════════════════
# Helper functions
# ═══════════════════════════════════════════════════════════
print_step() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}▶ $1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_ok() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_warn() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

# Trap errors
trap 'print_error "Script gagal di baris $LINENO. Cek pesan error di atas."' ERR

# ═══════════════════════════════════════════════════════════
# STEP 0: Verifikasi lokasi & git
# ═══════════════════════════════════════════════════════════
print_step "0/6 — Cek lingkungan"

if [ ! -f "package.json" ]; then
  print_error "Tidak ada package.json. Pastikan dijalankan di root project."
  exit 1
fi

if [ ! -f "quasar.config.js" ]; then
  print_error "Tidak ada quasar.config.js. Ini bukan project Quasar."
  exit 1
fi

if ! git rev-parse --git-dir > /dev/null 2>&1; then
  print_error "Folder ini bukan git repository."
  exit 1
fi

print_ok "Lingkungan OK"

# ═══════════════════════════════════════════════════════════
# STEP 1: Commit & push source ke main
# ═══════════════════════════════════════════════════════════
print_step "1/6 — Commit & push source ke main"

# Cek ada perubahan
if [ -n "$(git status --porcelain)" ]; then
  git add .
  git commit -m "$MSG"
  print_ok "Commit lokal: $MSG"
else
  print_warn "Tidak ada perubahan source — skip commit"
fi

# Push ke main (jika ada commit baru)
if [ "$(git rev-list @{u}..HEAD 2>/dev/null | wc -l)" -gt 0 ]; then
  git push origin main
  print_ok "Push ke main sukses"
else
  print_warn "Tidak ada commit baru — skip push"
fi

# ═══════════════════════════════════════════════════════════
# STEP 2: Build PWA
# ═══════════════════════════════════════════════════════════
print_step "2/6 — Build PWA (production)"

# Hapus build lama supaya bersih
rm -rf dist/pwa

quasar build -m pwa

if [ ! -d "dist/pwa" ]; then
  print_error "Folder dist/pwa tidak ditemukan setelah build."
  exit 1
fi

print_ok "Build PWA selesai"

# ═══════════════════════════════════════════════════════════
# STEP 3: Verifikasi output
# ═══════════════════════════════════════════════════════════
print_step "3/6 — Verifikasi build output"

# Cek tidak ada placeholder EJS yang tersisa
PLACEHOLDER_COUNT=$(grep -c "<%" dist/pwa/index.html 2>/dev/null || echo "0")
if [ "$PLACEHOLDER_COUNT" -gt 0 ]; then
  print_error "Masih ada $PLACEHOLDER_COUNT placeholder '<%' di index.html"
  print_error "Cek file index.html di root project."
  exit 1
fi
print_ok "Tidak ada placeholder EJS"

# Cek q-app div sudah di-render
if ! grep -q 'id="q-app"' dist/pwa/index.html; then
  print_error "Tidak ada '<div id=\"q-app\">' di output — Quasar gagal render."
  exit 1
fi
print_ok "Entry point '<div id=\"q-app\">' ada"

# Cek file PWA penting
for f in "sw.js" "manifest.json"; do
  if [ ! -f "dist/pwa/$f" ]; then
    print_error "File '$f' tidak ditemukan di dist/pwa/"
    exit 1
  fi
done
print_ok "File PWA (sw.js, manifest.json) ada"

# Pastikan .nojekyll ada
if [ ! -f "dist/pwa/.nojekyll" ]; then
  touch dist/pwa/.nojekyll
  print_warn ".nojekyll tidak ada — sudah dibuat otomatis"
else
  print_ok ".nojekyll ada"
fi

# ═══════════════════════════════════════════════════════════
# STEP 4: Siapkan git untuk gh-pages
# ═══════════════════════════════════════════════════════════
print_step "4/6 — Siapkan folder deploy"

cd dist/pwa

# Init git bersih
rm -rf .git
git init -q
git checkout -q -b "$BRANCH_DEPLOY"

git add -A
git commit -q -m "$MSG"

print_ok "Commit deploy: $MSG"

# ═══════════════════════════════════════════════════════════
# STEP 5: Push ke gh-pages
# ═══════════════════════════════════════════════════════════
print_step "5/6 — Push ke GitHub Pages"

git remote add origin "$REPO_URL"

echo -e "${YELLOW}📤 Pushing ke $BRANCH_DEPLOY...${NC}"
git push -f origin "$BRANCH_DEPLOY"

print_ok "Push ke $BRANCH_DEPLOY sukses"

# ═══════════════════════════════════════════════════════════
# STEP 6: Selesai
# ═══════════════════════════════════════════════════════════
cd ../..

print_step "6/6 — Selesai!"
echo ""
print_ok "🎉 DEPLOY BERHASIL!"
echo ""
echo -e "${YELLOW}🌐 Live URL:${NC} $LIVE_URL"
echo ""
echo -e "${YELLOW}⏱  Tunggu 30–90 detik, lalu buka URL di atas.${NC}"
echo -e "${YELLOW}   Kalau masih tampil versi lama, hard refresh:${NC}"
echo -e "${YELLOW}   Ctrl + Shift + R  (Windows)${NC}"
echo -e "${YELLOW}   Cmd  + Shift + R  (Mac)${NC}"
echo ""
echo -e "${YELLOW}📊 Cek status deploy:${NC}"
echo -e "   https://github.com/d21xperience/ruang-belajar-digital/deployments"
echo ""
