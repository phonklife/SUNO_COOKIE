# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Suno API Client Library** — A hybrid Python and Node.js/TypeScript library for interacting with
[`suno-api`](https://github.com/gcui-art/suno-api), the self-hosted REST wrapper around Suno.com's
internal music generation API. This repo does not reimplement `suno-api` itself — it ships typed
client SDKs that talk HTTP to a running `suno-api` instance (default `http://localhost:3000`).

The full endpoint contract (request/response shapes, auth model, error codes) is documented in the
`phonklife/docs` repository's API Reference (`/api-reference/*.mdx`) and is the source of truth this
library is built against. Endpoints covered:

| Endpoint | Purpose |
|---|---|
| `POST /api/generate` | Generate 2 clips from a text description |
| `POST /api/custom_generate` | Generate 2 clips from explicit lyrics/tags/title |
| `POST /api/extend_audio` | Continue an existing clip |
| `POST /api/concat` | Merge an extension with its parent into one song |
| `POST /api/generate_lyrics` | Generate lyrics only, no audio |
| `POST /api/generate_stems` | Split a song into vocal/instrumental stems |
| `GET /api/get_aligned_lyrics` | Word-level lyric timestamps |
| `GET /api/get` | Fetch clip(s) by id, or the whole library (also used for polling) |
| `GET /api/clip` | Fetch the raw, unnormalized Suno clip object |
| `GET /api/get_limit` | Remaining credit balance |
| `GET /api/persona` | Persona info, paginated |
| `POST /v1/chat/completions` | OpenAI-compatible generation endpoint (plain-text response) |

## Project Structure & Architecture

This is a monorepo with integrated Python and TypeScript packages:

```
/python           - Python client library package
  /suno           - Main Python module (client, models, exceptions)
  /tests          - Python unit tests (pytest)
  requirements.txt
  pyproject.toml

/node             - TypeScript client library package
  /src            - TypeScript source code (client, types, errors)
  /tests          - TypeScript/Jest tests
  package.json
  tsconfig.json

/docs             - Usage guides local to this repo (system/workflow notes; full API
                    reference lives in the phonklife/docs repo, not duplicated here)
README.md         - Project overview and quick start
```

### Key Architecture Notes

1. **Dual-Language Design**: Both Python and TypeScript clients expose equivalent interfaces
   (`generate`, `custom_generate`, `extend_audio`, `concat`, `generate_lyrics`, `generate_stems`,
   `get_aligned_lyrics`, `get`, `get_clip`, `get_limit`, `get_persona`, `chat_completion`). Keep
   method names, parameters, and defaults (e.g. `model="chirp-v3-5"`) consistent across both.
2. **No Suno auth logic here**: `suno-api` itself owns the `SUNO_COOKIE` / Clerk session handling.
   This client only needs the base URL of a running `suno-api` instance, plus an optional
   per-request `Cookie` override (mirrors `suno-api`'s documented per-request account switching).
3. **Request Patterns**: Both languages should use the same retry/timeout defaults and the same
   status-code-to-exception mapping: `400` → bad request, `402` → out of credits, `500` → internal
   error, `503` → network error reaching Suno.
4. **Error Handling**: Shared exception hierarchy per language (`SunoAPIError` base, with
   `BadRequestError`, `PaymentRequiredError`, `InternalServerError`, `ServiceUnavailableError`
   subclasses) — both implementations should raise equivalent types for the same HTTP status.
5. **Polling helper**: `/api/generate` and friends can return before audio is ready
   (`wait_audio=false`). Both clients expose a `poll_until_complete` helper that polls
   `GET /api/get` every few seconds, matching the documented client-side polling pattern.
6. **Type Safety**: TypeScript code should be strictly typed. Python code should use type hints
   (`typing` module) for clarity.

## Development Commands

### Python

```bash
cd python

# Setup virtual environment
python -m venv venv
source venv/bin/activate  # or 'venv\Scripts\activate' on Windows

# Install dependencies
pip install -r requirements.txt
pip install -e ".[dev]"  # Install package in editable mode with dev deps

# Run tests
pytest
pytest -v                    # Verbose output
pytest tests/test_client.py  # Single test file

# Type checking
mypy suno/

# Linting & formatting
ruff check suno/
black suno/
```

### Node.js/TypeScript

```bash
cd node

# Install dependencies
npm install

# Run tests
npm test
npm test -- --watch  # Watch mode

# Type checking
npm run type-check

# Build
npm run build

# Linting & formatting
npm run lint
```

## Testing & Quality

- **Unit Tests**: Maintain test coverage for all public client methods. Mock HTTP calls to the
  `suno-api` server — tests must not require a live server or real Suno credentials.
- **Pre-commit Hooks**: Configure hooks to run type checks and linting before commits.
- **CI/CD**: GitHub Actions (`.github/workflows/ci.yml`) runs tests, type checks, and linting for
  both packages on pull requests.

## Code Conventions

### Python
- Use type hints for all function signatures.
- Follow PEP 8 style guide.
- Docstrings for public classes and methods.
- Minimal inline comments; explain WHY, not WHAT.

### TypeScript
- Strict mode enabled in `tsconfig.json`.
- Prefer interfaces for object types.
- Avoid `any`; use the documented response types from `types.ts`.

## Documentation

- **README.md**: Quick start guide, basic usage examples for both languages, installation.
- **docs/**: Local usage notes only. For the authoritative endpoint reference (parameters,
  response fields, error codes, examples), see `phonklife/docs` — do not fork or duplicate that
  content here; link to it instead.

## Before Pushing Changes

- Run tests and ensure they pass (`pytest`, `npm test`).
- Run type checker (`mypy` for Python, `tsc --noEmit` for TypeScript).
- Run linter (`ruff`, ESLint).
- Write clear commit messages explaining the change and its motivation.
