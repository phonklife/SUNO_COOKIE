# Usage notes

This file covers this repo's two client SDKs only. For the full endpoint contract
(parameters, response fields, status codes, curl examples) see the
[`phonklife/docs`](https://github.com/phonklife/docs) API reference — it is the source
of truth these clients are implemented against and is not duplicated here.

## Method-to-endpoint map

| Python | TypeScript | HTTP | Notes |
|---|---|---|---|
| `generate()` | `generate()` | `POST /api/generate` | Returns 2 clips |
| `custom_generate()` | `customGenerate()` | `POST /api/custom_generate` | Returns 2 clips |
| `extend_audio()` | `extendAudio()` | `POST /api/extend_audio` | Returns clip(s) |
| `concat()` | `concat()` | `POST /api/concat` | Returns a single clip, not a list |
| `generate_lyrics()` | `generateLyrics()` | `POST /api/generate_lyrics` | Lyrics only, no audio |
| `generate_stems()` | `generateStems()` | `POST /api/generate_stems` | Vocal + instrumental clips |
| `get_aligned_lyrics()` | `getAlignedLyrics()` | `GET /api/get_aligned_lyrics` | Word-level timestamps |
| `get()` | `get()` | `GET /api/get` | Fetch by id(s), or your whole library |
| `get_clip()` | `getClip()` | `GET /api/clip` | Raw, unnormalized Suno object |
| `get_limit()` | `getLimit()` | `GET /api/get_limit` | Credit balance |
| `get_persona()` | `getPersona()` | `GET /api/persona` | Paginated persona info |
| `chat_completion()` | `chatCompletion()` | `POST /v1/chat/completions` | Returns raw markdown text, not JSON |
| `poll_until_complete()` | `pollUntilComplete()` | (client-side, calls `get()` repeatedly) | Local helper, not a `suno-api` endpoint |

## Authentication

Both clients accept an optional `cookie` argument (constructor-level default, or
per-call override) that is forwarded as the HTTP `Cookie` header — matching
`suno-api`'s documented per-request account override. If you don't pass one, the
`suno-api` server falls back to its own `SUNO_COOKIE` environment variable. Neither
client stores, parses, or refreshes Suno session cookies itself.

## Error handling

Both clients raise a typed error for non-2xx responses:

| Status | Python | TypeScript |
|---|---|---|
| 400 | `BadRequestError` | `BadRequestError` |
| 402 | `PaymentRequiredError` | `PaymentRequiredError` |
| 500 | `InternalServerError` | `InternalServerError` |
| 503 | `ServiceUnavailableError` | `ServiceUnavailableError` |
| other | `SunoAPIError` | `SunoAPIError` |

## Local workflow notes

See [`system.txt`](system.txt) for the repo/CI/agent workflow conventions (branch
naming, commit templates, PR flow) that predate this library and still apply to how
changes here get made.
