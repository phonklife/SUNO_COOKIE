# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Suno API Client Library** — A hybrid Python and Node.js/TypeScript library for interacting with the Suno AI API.

## Project Structure & Architecture

This is a monorepo with integrated Python and TypeScript packages:

```
/python          - Python client library package
  /suno          - Main Python module
  /tests         - Python unit tests (pytest)
  requirements.txt
  setup.py or pyproject.toml

/node (or /typescript)
  /src           - TypeScript source code
  /tests         - TypeScript/Jest tests
  package.json
  tsconfig.json

/docs            - API documentation and usage guides
README.md        - Project overview and quick start
```

### Key Architecture Notes

1. **Dual-Language Design**: Both Python and TypeScript clients expose similar interfaces to the Suno API. Maintain API consistency across implementations.

2. **Authentication**: The library handles Suno API authentication. Store auth methods clearly—whether using API keys, OAuth tokens, or session-based auth. Document the auth flow prominently.

3. **Request Patterns**: API calls should follow consistent patterns across both languages. Use similar retry logic, timeout handling, and error propagation.

4. **Error Handling**: Define a shared set of error types/exceptions (e.g., `AuthenticationError`, `RateLimitError`, `NotFoundError`). Both implementations should use equivalent error handling.

5. **Type Safety**: TypeScript code should be strictly typed. Python code should use type hints (`typing` module) for clarity.

## Development Commands

### Python

```bash
# Setup virtual environment
python -m venv venv
source venv/bin/activate  # or 'venv\Scripts\activate' on Windows

# Install dependencies
pip install -r requirements.txt
pip install -e .  # Install package in editable mode

# Run tests
pytest
pytest -v                    # Verbose output
pytest tests/test_client.py  # Single test file

# Type checking
mypy suno/

# Linting & formatting (if configured)
ruff check suno/
black suno/
```

### Node.js/TypeScript

```bash
# Install dependencies
npm install

# Run tests
npm test
npm test -- --watch  # Watch mode

# Type checking
npm run type-check
# or
tsc --noEmit

# Build
npm run build

# Linting & formatting (if configured)
npm run lint
npm run format
```

## Testing & Quality

- **Unit Tests**: Maintain test coverage for all public APIs. Use mocks for external Suno API calls.
- **Integration Tests** (if applicable): Test against staging/sandbox endpoints.
- **Pre-commit Hooks**: Configure hooks to run type checks and linting before commits.
- **CI/CD**: GitHub Actions should run tests, type checks, and linting on pull requests.

## Code Conventions

### Python
- Use type hints for all function signatures.
- Follow PEP 8 style guide.
- Docstrings for public classes and methods (Google or NumPy style).
- Minimal inline comments; explain WHY, not WHAT.

### TypeScript
- Strict mode enabled in `tsconfig.json`.
- Use JSDoc for public exports.
- Prefer interfaces over type aliases for object types.
- Avoid `any` type; use generics or union types instead.

## Documentation

- **README.md**: Quick start guide, basic usage examples, installation instructions.
- **API Docs**: Document all public classes, methods, and properties with examples.
- **Type Definitions**: In TypeScript, leverage exported types. In Python, rely on type hints visible in IDE tooltips.

## Before Pushing Changes

- Run tests and ensure they pass.
- Run type checker (`mypy` for Python, `tsc` for TypeScript).
- Run linter if configured.
- Write clear commit messages explaining the change and its motivation.
