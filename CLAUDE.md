# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

`SUNO_COOKIE` is a small Node.js/TypeScript toolkit for validating a user-supplied Suno session cookie without exposing the secret. It is intentionally local-first and does not scrape browser cookie stores or capture other users' sessions.

## Project Structure

```text
src/config.ts       environment validation
src/redact.ts       secret redaction helper
src/index.ts        CLI entry point
test/redact.test.ts tests for config and redaction
README.md           usage and security notes
.env.example        placeholder environment configuration
```

## Development Commands

```bash
npm install
npm run check
npm run build
npm test
npm start
```

Node.js 20+ is required.

## Security Rules

- Never commit a real `SUNO_COOKIE` value.
- Never print, log, snapshot, or include the full cookie in errors.
- Keep `.env` and other local secret files ignored by Git.
- Do not add automatic browser-cookie extraction or credential/session harvesting.
- Any future HTTP adapter must use only a session explicitly supplied by the account owner and should use timeouts, narrow operations, and redacted logging.

## Code Conventions

- TypeScript strict mode is enabled.
- Use ESM imports compatible with `NodeNext`.
- Prefer small pure helpers that are easy to test.
- Add tests for validation, redaction, and any future request-building logic.
- Keep runtime dependencies minimal unless a dependency clearly improves correctness or security.
