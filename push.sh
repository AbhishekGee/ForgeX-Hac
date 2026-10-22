#!/usr/bin/env bash
# Usage: ./push.sh https://github.com/YOUR-USER/lastminute-meds.git
set -euo pipefail
[ $# -eq 1 ] || { echo "Usage: ./push.sh <empty-github-repo-url>"; exit 1; }
git remote remove origin 2>/dev/null || true
git remote add origin "$1"
git branch -M main
git push -u origin main
