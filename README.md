# SUNO_COOKIE

This repository hosts two independent components:

1. **[SUNO_COOKIE CLI](#suno_cookie-cli)** (`src/`, `test/`, repo root) — a minimal, local-first
   Node.js/TypeScript toolkit for safely validating a Suno session cookie without ever exposing it.
2. **[Suno API Client Library](#suno-api-client-library)** (`python/`, `node/`) — typed Python and
   TypeScript clients for a self-hosted [`suno-api`](https://github.com/gcui-art/suno-api) server.

They do not depend on each other and can be used independently.

---

## SUNO_COOKIE CLI

Minimalny, lokalny toolkit Node.js/TypeScript do bezpiecznego sprawdzania konfiguracji sesji Suno bez ujawniania sekretu.

### Założenia

- wartość `SUNO_COOKIE` jest dostarczana przez użytkownika lokalnie;
- sekret nie jest zapisywany w repozytorium;
- CLI nigdy nie wypisuje pełnej wartości cookie;
- projekt nie odczytuje automatycznie cookies z przeglądarki i nie przechwytuje cudzych sesji.

### Wymagania

- Node.js 20+
- npm

### Start

```bash
npm install
cp .env.example .env
```

Ustaw `SUNO_COOKIE` w swoim środowisku. Plik `.env` jest ignorowany przez Git.

Ponieważ projekt nie dodaje zależności runtime do ładowania `.env`, uruchom wartość przez środowisko systemowe, np.:

```bash
SUNO_COOKIE="your-own-session-value" npm run build
SUNO_COOKIE="your-own-session-value" npm start
```

Windows PowerShell:

```powershell
$env:SUNO_COOKIE="your-own-session-value"
npm run build
npm start
```

### Komendy

```bash
npm run check   # type-check bez generowania plików
npm run build   # kompilacja do dist/
npm test        # build + testy Node
npm start       # sprawdzenie konfiguracji i zredagowany status
```

Przykładowy wynik:

```text
SUNO_COOKIE configuration: OK
Value: abcd…wxyz
Secret remains local and is never printed in full.
```

### Struktura

```text
src/config.ts       walidacja zmiennych środowiskowych
src/redact.ts       bezpieczne redagowanie sekretów
src/index.ts        CLI
test/redact.test.ts testy konfiguracji i redakcji
```

### Następny etap

Kolejnym modułem może być jawny adapter HTTP korzystający wyłącznie z sesji dostarczonej przez właściciela konta, z ograniczonym zakresem operacji, timeoutami i bez logowania danych uwierzytelniających.

---

## Suno API Client Library

Typed Python and TypeScript client libraries for
[`suno-api`](https://github.com/gcui-art/suno-api), the self-hosted REST wrapper around
Suno.com's music generation API. Point either client at a running `suno-api` instance
(default `http://localhost:3000`) and call typed methods instead of hand-rolling HTTP
requests.

This library does **not** talk to Suno.com directly and does not manage Suno session
cookies — that's what `suno-api` itself is for (via its own `SUNO_COOKIE` environment
variable; the CLI above is a separate, unrelated tool for validating that value locally).
See [`phonklife/docs`](https://github.com/phonklife/docs) for the full, authoritative
endpoint reference this client is built against.

### Packages

| Package | Path | Install |
|---|---|---|
| Python (`suno-client`) | [`python/`](python/) | `pip install -r python/requirements.txt` |
| TypeScript (`@suno-cookie/suno-client`) | [`node/`](node/) | `cd node && npm install` |

### Quick start

First, get a `suno-api` server running locally (see its
[quickstart](https://github.com/gcui-art/suno-api) — you'll need a Suno session cookie
and a 2Captcha key). Then:

#### Python

```python
from suno import SunoClient

client = SunoClient(base_url="http://localhost:3000")

# Generate and wait for the audio to be ready (blocks up to 100s server-side)
clips = client.generate(
    "An upbeat electronic track with driving synths and a hopeful melody",
    wait_audio=True,
)
for clip in clips:
    print(clip.title, clip.audio_url)

# Or fire-and-poll yourself
clips = client.generate("a lo-fi coding playlist track")
ready = client.poll_until_complete([c.id for c in clips])
```

#### TypeScript

```ts
import { SunoClient } from "@suno-cookie/suno-client";

const client = new SunoClient({ baseUrl: "http://localhost:3000" });

const clips = await client.generate(
  "An upbeat electronic track with driving synths and a hopeful melody",
  { waitAudio: true },
);
for (const clip of clips) {
  console.log(clip.title, clip.audio_url);
}
```

### Covered endpoints

Both clients expose the same set of methods, one per documented `suno-api` endpoint:
`generate`, `custom_generate`/`customGenerate`, `extend_audio`/`extendAudio`, `concat`,
`generate_lyrics`/`generateLyrics`, `generate_stems`/`generateStems`,
`get_aligned_lyrics`/`getAlignedLyrics`, `get`, `get_clip`/`getClip`,
`get_limit`/`getLimit`, `get_persona`/`getPersona`, `chat_completion`/`chatCompletion`,
plus a `poll_until_complete`/`pollUntilComplete` convenience helper. See
[`docs/USAGE.md`](docs/USAGE.md) for a per-method rundown and
[`CLAUDE.md`](CLAUDE.md) for architecture notes and development commands.

### Development

```bash
# Python
cd python && pip install -e ".[dev]" && pytest && mypy suno/ && ruff check suno/

# TypeScript
cd node && npm install && npm test && npm run type-check && npm run lint
```

Both test suites mock all HTTP calls — no live `suno-api` server or real Suno account
is required to run them.

---

## License

MIT
