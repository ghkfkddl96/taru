#!/bin/bash
# Taru — MS Office 스킬 설치 (pptx / docx / xlsx / pdf)
#
# 이 스킬들은 Anthropic 공식 레포(anthropics/skills)의 자산이며
# Proprietary 라이선스다. Taru 레포에 번들로 포함하지 않고, 각 사용자가
# 본인 Anthropic 이용약관 하에 공식 소스에서 직접 받아 로컬에 설치한다.
#
# 하는 일:
#   1. anthropics/skills 를 sparse clone 해서 office 스킬 4종만 추출
#   2. .claude/skills/ 로 복사
#   3. 스킬이 쓰는 Python 의존성 설치
set -e

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DST="$REPO_ROOT/.claude/skills"
TMP="$REPO_ROOT/.cache/skills-src"
SKILLS="pptx docx xlsx pdf"

echo "=== [Taru] MS Office 스킬 설치 ==="

# --- python interpreter 탐색 (Windows Store stub 회피) ---
PY=""
for cand in py python3 python; do
  if command -v "$cand" >/dev/null 2>&1 && "$cand" --version >/dev/null 2>&1; then
    PY="$cand"; break
  fi
done
if [ -z "$PY" ]; then
  echo "ERROR: Python 인터프리터를 찾지 못함. Python 3.10+ 설치 후 다시 실행." >&2
  exit 1
fi
echo "python: $($PY --version 2>&1)"

if ! command -v git >/dev/null 2>&1; then
  echo "ERROR: git 이 필요함." >&2
  exit 1
fi

# --- 1) sparse clone ---
echo "→ anthropics/skills sparse clone..."
rm -rf "$TMP"
git clone --depth 1 --filter=blob:none --sparse https://github.com/anthropics/skills "$TMP" >/dev/null 2>&1
git -C "$TMP" sparse-checkout set $(for s in $SKILLS; do echo "skills/$s"; done) >/dev/null 2>&1

# --- 2) 복사 ---
mkdir -p "$DST"
for s in $SKILLS; do
  if [ -d "$TMP/skills/$s" ]; then
    rm -rf "$DST/$s"
    cp -r "$TMP/skills/$s" "$DST/$s"
    echo "  installed: $s"
  else
    echo "  WARN: skills/$s 를 찾지 못함 (레포 구조 변경?)" >&2
  fi
done
rm -rf "$TMP"

# --- 3) Python 의존성 ---
echo "→ Python 의존성 설치..."
"$PY" -m pip install --quiet --upgrade \
  python-pptx python-docx openpyxl lxml defusedxml Pillow pypdf pdfplumber markitdown \
  || echo "  WARN: 일부 패키지 설치 실패. pip 로그 확인." >&2

echo ""
echo "설치된 스킬:"
ls -1 "$DST" 2>/dev/null | sed 's/^/  - /'
echo ""
echo "=== 완료. 타루 재시작하면 /pptx /docx /xlsx /pdf 사용 가능 ==="
echo "참고: 썸네일/PDF→이미지 변환은 LibreOffice/poppler 가 추가로 필요할 수 있음."
echo "      문서 생성·편집은 위 Python 패키지만으로 동작."
