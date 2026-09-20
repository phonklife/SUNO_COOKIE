# SUNO_COOKIE — Suno API Client Library

Typed Python and TypeScript client libraries for
[`suno-api`](https://github.com/gcui-art/suno-api), the self-hosted REST wrapper around
Suno.com's music generation API. Point either client at a running `suno-api` instance
(default `http://localhost:3000`) and call typed methods instead of hand-rolling HTTP
requests.

This library does **not** talk to Suno.com directly and does not manage Suno session
cookies — that's what `suno-api` itself is for (via its own `SUNO_COOKIE` environment
variable). See [`phonklife/docs`](https://github.com/phonklife/docs) for the full,
authoritative endpoint reference this client is built against.

## Packages

| Package | Path | Install |
|---|---|---|
| Python (`suno-client`) | [`python/`](python/) | `pip install -r python/requirements.txt` |
| TypeScript (`@suno-cookie/suno-client`) | [`node/`](node/) | `cd node && npm install` |

## Quick start

First, get a `suno-api` server running locally (see its
[quickstart](https://github.com/gcui-art/suno-api) — you'll need a Suno session cookie
and a 2Captcha key). Then:

### Python

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

### TypeScript

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

## Covered endpoints

Both clients expose the same set of methods, one per documented `suno-api` endpoint:
`generate`, `custom_generate`/`customGenerate`, `extend_audio`/`extendAudio`, `concat`,
`generate_lyrics`/`generateLyrics`, `generate_stems`/`generateStems`,
`get_aligned_lyrics`/`getAlignedLyrics`, `get`, `get_clip`/`getClip`,
`get_limit`/`getLimit`, `get_persona`/`getPersona`, `chat_completion`/`chatCompletion`,
plus a `poll_until_complete`/`pollUntilComplete` convenience helper. See
[`docs/USAGE.md`](docs/USAGE.md) for a per-method rundown and
[`CLAUDE.md`](CLAUDE.md) for architecture notes and development commands.

## Development

```bash
# Python
cd python && pip install -e ".[dev]" && pytest && mypy suno/ && ruff check suno/

# TypeScript
cd node && npm install && npm test && npm run type-check && npm run lint
```

Both test suites mock all HTTP calls — no live `suno-api` server or real Suno account
is required to run them.

## License

MIT
