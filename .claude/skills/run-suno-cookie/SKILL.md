---
name: run-suno-cookie
description: Build, run, and smoke-test the suno-cookie CLI. Use when asked to start suno-cookie, run it, build it, test it, or verify the SUNO_COOKIE config toolkit works.
---

This is a Node.js/TypeScript CLI (no server, no GUI) that validates a `SUNO_COOKIE` env var and prints a redacted status line. Drive it via `.claude/skills/run-suno-cookie/smoke.sh`, which covers the build, the happy path, both error paths, and the test suite in one run.

All paths below are relative to the repo root.

## Prerequisites

Node.js 20+ and npm. Verified on Node 22.22.2 / npm 10.9.7 in this container — no OS packages needed.

## Setup

```bash
npm ci
```

No `.env` loading in the app itself — `SUNO_COOKIE` must come from the process environment (see Run below).

## Build

```bash
npm run build
```

## Run (agent path)

```bash
bash .claude/skills/run-suno-cookie/smoke.sh
```

Runs build, then three CLI invocations (valid cookie, missing cookie, too-short cookie) plus the test suite, printing `PASS`/`FAIL` per check and exiting non-zero if anything fails. Logs the build output to `/tmp/suno-cookie-build.log` on failure.

For a single manual invocation instead of the full smoke script:

```bash
SUNO_COOKIE="dummy-local-session-value-1234567890" npm start
# -> SUNO_COOKIE configuration: OK
# -> Value: dumm…7890
# -> Secret remains local and is never printed in full.
```

```bash
env -u SUNO_COOKIE npm start; echo $?
# -> Configuration error: Missing SUNO_COOKIE. ...
# -> 1
```

## Run (human path)

Same as the agent path — this CLI exits immediately, there's no window or server to leave running.

```bash
SUNO_COOKIE="your-own-session-value" npm start
```

## Test

```bash
npm test
```

Expected: 4 suites, `# fail 0`. `npm test` runs `npm run build` first, so a stale `dist/` is not an issue.

## Gotchas

- `npm start` always runs `npm run build`'s *output* (`dist/src/index.js`), not the TypeScript source directly — if you edit `src/` and forget to rebuild, `npm start` silently runs the old compiled version. The smoke script always rebuilds first.
- The missing-cookie case must be tested with `env -u SUNO_COOKIE npm start`, not just an unset shell var — if a parent shell or `.env` has `SUNO_COOKIE` exported, a bare `npm start` will pick it up instead of exercising the error path.
