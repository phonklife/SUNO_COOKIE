#!/usr/bin/env bash
# Smoke-drives the suno-cookie CLI: build, happy path, both error paths, tests.
# Run from the repo root: bash .claude/skills/run-suno-cookie/smoke.sh
set -uo pipefail

fail=0
check() {
  local desc="$1" expected_exit="$2" actual_exit="$3" output="$4" grep_for="$5"
  if [ "$actual_exit" -ne "$expected_exit" ]; then
    echo "FAIL  $desc (exit $actual_exit, expected $expected_exit)"
    fail=1
    return
  fi
  if [ -n "$grep_for" ] && ! grep -qF "$grep_for" <<<"$output"; then
    echo "FAIL  $desc (missing expected text: $grep_for)"
    fail=1
    return
  fi
  echo "PASS  $desc"
}

echo "== build =="
npm run build >/tmp/suno-cookie-build.log 2>&1
check "build" 0 $? "$(cat /tmp/suno-cookie-build.log)" ""

echo "== happy path (valid SUNO_COOKIE) =="
out=$(SUNO_COOKIE="dummy-local-session-value-1234567890" npm start 2>&1); code=$?
check "valid cookie -> exit 0, redacted value shown" 0 "$code" "$out" "dumm…7890"

echo "== missing SUNO_COOKIE =="
out=$(env -u SUNO_COOKIE npm start 2>&1); code=$?
check "missing cookie -> exit 1" 1 "$code" "$out" "Missing SUNO_COOKIE"

echo "== too-short SUNO_COOKIE =="
out=$(SUNO_COOKIE="short" npm start 2>&1); code=$?
check "short cookie -> exit 1" 1 "$code" "$out" "too short"

echo "== test suite =="
out=$(npm test 2>&1); code=$?
check "npm test" 0 "$code" "$out" "# fail 0"

echo
if [ "$fail" -eq 0 ]; then
  echo "ALL CHECKS PASSED"
else
  echo "SOME CHECKS FAILED"
fi
exit $fail
