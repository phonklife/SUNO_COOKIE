# suno-client (Python)

Typed Python client for a self-hosted [`suno-api`](https://github.com/gcui-art/suno-api) server.
See the [repo root README](../README.md) for full usage examples and the
[phonklife/docs](https://github.com/phonklife/docs) API reference for the underlying HTTP contract.

## Install

```bash
pip install -r requirements.txt
pip install -e ".[dev]"
```

## Quick example

```python
from suno import SunoClient

client = SunoClient(base_url="http://localhost:3000")
clips = client.generate("An upbeat electronic track with driving synths", wait_audio=True)
for clip in clips:
    print(clip.title, clip.audio_url)
```
