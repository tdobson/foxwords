#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:8787}"
ORIGIN_HEADER="${2:-${BASE_URL}}"

echo "=========================================="
echo "🦊 Foxwords API Smoke Test Suite"
echo "Target: ${BASE_URL}"
echo "Origin: ${ORIGIN_HEADER}"
echo "=========================================="

FAILED=0

check() {
  local desc="$1"
  local expected="$2"
  local actual="$3"

  if [ "${expected}" = "${actual}" ]; then
    echo "  ✅ PASS: ${desc} (HTTP ${actual})"
  else
    echo "  ❌ FAIL: ${desc} (Expected HTTP ${expected}, got ${actual})"
    FAILED=$((FAILED + 1))
  fi
}

echo
echo "1. Public Child Play & Join APIs"
echo "------------------------------------------"

# Invalid play token -> 404
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/api/play/NON_EXISTENT_TOKEN_12345")
check "GET /api/play/[token] for non-existent token returns 404" "404" "${STATUS}"

# Invalid join code -> 404
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${BASE_URL}/api/play/resolve" \
  -H "Origin: ${ORIGIN_HEADER}" \
  -H "Content-Type: application/json" \
  -d '{"code":"ZZZZ99"}')
check "POST /api/play/resolve for unknown code returns 404" "404" "${STATUS}"

# Malformed join code payload -> 400
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${BASE_URL}/api/play/resolve" \
  -H "Origin: ${ORIGIN_HEADER}" \
  -H "Content-Type: application/json" \
  -d '{}')
check "POST /api/play/resolve without code returns 400" "400" "${STATUS}"

echo
echo "2. Authentication & Security Gates"
echo "------------------------------------------"

# Magic link request valid email -> 202 Accepted
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${BASE_URL}/api/auth/request" \
  -H "Origin: ${ORIGIN_HEADER}" \
  -H "Content-Type: application/json" \
  -d '{"email":"smoke-parent@example.com"}')
check "POST /api/auth/request with valid email returns 202" "202" "${STATUS}"

# Magic link request invalid email -> 400
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${BASE_URL}/api/auth/request" \
  -H "Origin: ${ORIGIN_HEADER}" \
  -H "Content-Type: application/json" \
  -d '{"email":"not-an-email"}')
check "POST /api/auth/request with invalid email returns 400" "400" "${STATUS}"

# Verification invalid token -> 302 redirect to error view
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/api/auth/verify?token=INVALID_RAW_TOKEN_9999")
check "GET /api/auth/verify with invalid token returns 302" "302" "${STATUS}"

echo
echo "3. Authenticated Profile Protection"
echo "------------------------------------------"

# Unauthenticated profiles list -> 401
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/api/profiles")
check "GET /api/profiles without session cookie returns 401" "401" "${STATUS}"

# Unauthenticated profile creation -> 401
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${BASE_URL}/api/profiles" \
  -H "Origin: ${ORIGIN_HEADER}" \
  -H "Content-Type: application/json" \
  -d '{"childName":"Leo"}')
check "POST /api/profiles without session cookie returns 401" "401" "${STATUS}"

# Unauthenticated custom word item upload -> 401
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${BASE_URL}/api/profiles/prof_123/items" \
  -H "Origin: ${ORIGIN_HEADER}" \
  -H "Content-Type: application/json" \
  -d '{"word":"CAT","promptLabel":"Cat","category":"pets"}')
check "POST /api/profiles/[profileId]/items without session cookie returns 401" "401" "${STATUS}"

echo
echo "4. Asset Upload Bounds & Guards"
echo "------------------------------------------"

# Asset upload unauthenticated -> 401
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${BASE_URL}/api/profiles/prof_123/assets" \
  -H "Origin: ${ORIGIN_HEADER}" \
  -F "kind=photo" \
  -F "file=@package.json;type=image/jpeg")
check "POST /api/profiles/[profileId]/assets without session returns 401" "401" "${STATUS}"

echo
echo "=========================================="
if [ ${FAILED} -eq 0 ]; then
  echo "🎉 All API smoke tests PASSED!"
  exit 0
else
  echo "⚠️  ${FAILED} API smoke test(s) FAILED."
  exit 1
fi
