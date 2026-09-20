"""Client for a self-hosted suno-api (https://github.com/gcui-art/suno-api) server.

This client does not talk to Suno.com directly and does not manage Suno session
cookies — that is the responsibility of the suno-api server it points at (via its
own SUNO_COOKIE environment variable). This client only needs the server's base
URL, plus an optional per-request Cookie override to switch Suno accounts, exactly
as documented for suno-api's "per-request cookie override" feature.
"""

from __future__ import annotations

import time
from collections.abc import Iterable
from typing import Any

import requests

from .exceptions import error_for_status
from .models import (
    AlignedWord,
    AudioInfo,
    CreditLimit,
    LyricsResult,
    PersonaInfo,
    StemClip,
)

DEFAULT_BASE_URL = "http://localhost:3000"
DEFAULT_MODEL = "chirp-v3-5"
DEFAULT_TIMEOUT = 30.0
DEFAULT_POLL_INTERVAL = 5.0
DEFAULT_POLL_TIMEOUT = 100.0


class SunoClient:
    """Typed HTTP client for a running suno-api instance."""

    def __init__(
        self,
        base_url: str = DEFAULT_BASE_URL,
        cookie: str | None = None,
        timeout: float = DEFAULT_TIMEOUT,
        session: requests.Session | None = None,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.cookie = cookie
        self.timeout = timeout
        self._session = session or requests.Session()

    # -- internal helpers ---------------------------------------------------

    def _headers(self, cookie: str | None) -> dict[str, str]:
        headers = {"Content-Type": "application/json"}
        effective_cookie = cookie if cookie is not None else self.cookie
        if effective_cookie:
            headers["Cookie"] = effective_cookie
        return headers

    def _request(
        self,
        method: str,
        path: str,
        *,
        params: dict[str, Any] | None = None,
        json_body: dict[str, Any] | None = None,
        cookie: str | None = None,
    ) -> Any:
        url = f"{self.base_url}{path}"
        response = self._session.request(
            method,
            url,
            params=params,
            json=json_body,
            headers=self._headers(cookie),
            timeout=self.timeout,
        )
        if response.status_code >= 400:
            message = response.text
            try:
                body = response.json()
                message = body.get("error") or body.get("message") or message
            except ValueError:
                body = None
            raise error_for_status(response.status_code, message, response_body=body)
        if not response.content:
            return None
        return response.json()

    @staticmethod
    def _drop_none(payload: dict[str, Any]) -> dict[str, Any]:
        return {k: v for k, v in payload.items() if v is not None}

    # -- generation -----------------------------------------------------------

    def generate(
        self,
        prompt: str,
        *,
        make_instrumental: bool = False,
        model: str = DEFAULT_MODEL,
        wait_audio: bool = False,
        cookie: str | None = None,
    ) -> list[AudioInfo]:
        """POST /api/generate — generate two clips from a text description."""
        body = {
            "prompt": prompt,
            "make_instrumental": make_instrumental,
            "model": model,
            "wait_audio": wait_audio,
        }
        data = self._request("POST", "/api/generate", json_body=body, cookie=cookie)
        return [AudioInfo.from_dict(item) for item in data]

    def custom_generate(
        self,
        prompt: str,
        tags: str,
        title: str,
        *,
        make_instrumental: bool = False,
        model: str = DEFAULT_MODEL,
        wait_audio: bool = False,
        negative_tags: str | None = None,
        cookie: str | None = None,
    ) -> list[AudioInfo]:
        """POST /api/custom_generate — generate two clips from explicit lyrics/tags/title."""
        body = self._drop_none(
            {
                "prompt": prompt,
                "tags": tags,
                "title": title,
                "make_instrumental": make_instrumental,
                "model": model,
                "wait_audio": wait_audio,
                "negative_tags": negative_tags,
            }
        )
        data = self._request("POST", "/api/custom_generate", json_body=body, cookie=cookie)
        return [AudioInfo.from_dict(item) for item in data]

    def extend_audio(
        self,
        audio_id: str,
        *,
        prompt: str | None = None,
        continue_at: float | None = None,
        tags: str | None = None,
        negative_tags: str | None = None,
        title: str | None = None,
        model: str = DEFAULT_MODEL,
        wait_audio: bool = False,
        cookie: str | None = None,
    ) -> list[AudioInfo]:
        """POST /api/extend_audio — continue an existing clip."""
        body = self._drop_none(
            {
                "audio_id": audio_id,
                "prompt": prompt,
                "continue_at": continue_at,
                "tags": tags,
                "negative_tags": negative_tags,
                "title": title,
                "model": model,
                "wait_audio": wait_audio,
            }
        )
        data = self._request("POST", "/api/extend_audio", json_body=body, cookie=cookie)
        return [AudioInfo.from_dict(item) for item in data]

    def concat(self, clip_id: str, *, cookie: str | None = None) -> AudioInfo:
        """POST /api/concat — merge an extension clip with its parent lineage."""
        data = self._request(
            "POST", "/api/concat", json_body={"clip_id": clip_id}, cookie=cookie
        )
        return AudioInfo.from_dict(data)

    def generate_lyrics(self, prompt: str, *, cookie: str | None = None) -> LyricsResult:
        """POST /api/generate_lyrics — generate lyrics only, no audio."""
        data = self._request(
            "POST", "/api/generate_lyrics", json_body={"prompt": prompt}, cookie=cookie
        )
        return LyricsResult.from_dict(data)

    def generate_stems(self, audio_id: str, *, cookie: str | None = None) -> list[StemClip]:
        """POST /api/generate_stems — split a song into vocal/instrumental stems."""
        data = self._request(
            "POST", "/api/generate_stems", json_body={"audio_id": audio_id}, cookie=cookie
        )
        return [StemClip.from_dict(item) for item in data]

    # -- retrieval --------------------------------------------------------------

    def get_aligned_lyrics(self, song_id: str, *, cookie: str | None = None) -> list[AlignedWord]:
        """GET /api/get_aligned_lyrics — word-level lyric timestamps."""
        data = self._request(
            "GET", "/api/get_aligned_lyrics", params={"song_id": song_id}, cookie=cookie
        )
        return [AlignedWord.from_dict(item) for item in data]

    def get(
        self,
        ids: Iterable[str] | None = None,
        *,
        page: int | None = None,
        cookie: str | None = None,
    ) -> list[AudioInfo]:
        """GET /api/get — fetch clip(s) by id, or the whole library."""
        params: dict[str, Any] = {}
        if ids is not None:
            params["ids"] = ",".join(ids)
        if page is not None:
            params["page"] = page
        data = self._request("GET", "/api/get", params=params or None, cookie=cookie)
        return [AudioInfo.from_dict(item) for item in data]

    def get_clip(self, clip_id: str) -> dict[str, Any]:
        """GET /api/clip — raw, unnormalized Suno clip object (uses server-side SUNO_COOKIE only)."""
        data: dict[str, Any] = self._request("GET", "/api/clip", params={"id": clip_id})
        return data

    def get_limit(self, *, cookie: str | None = None) -> CreditLimit:
        """GET /api/get_limit — remaining credit balance."""
        data = self._request("GET", "/api/get_limit", cookie=cookie)
        return CreditLimit.from_dict(data)

    def get_persona(
        self, persona_id: str, *, page: int = 1, cookie: str | None = None
    ) -> PersonaInfo:
        """GET /api/persona — persona info, paginated."""
        data = self._request(
            "GET", "/api/persona", params={"id": persona_id, "page": page}, cookie=cookie
        )
        return PersonaInfo.from_dict(data)

    def chat_completion(
        self, prompt: str, *, model: str = DEFAULT_MODEL, cookie: str | None = None
    ) -> str:
        """POST /v1/chat/completions — OpenAI-compatible generation, returns raw markdown text."""
        url = f"{self.base_url}/v1/chat/completions"
        response = self._session.post(
            url,
            json={"model": model, "messages": [{"role": "user", "content": prompt}]},
            headers=self._headers(cookie),
            timeout=self.timeout,
        )
        if response.status_code >= 400:
            raise error_for_status(response.status_code, response.text)
        return response.text

    # -- polling ------------------------------------------------------------

    def poll_until_complete(
        self,
        ids: Iterable[str],
        *,
        interval: float = DEFAULT_POLL_INTERVAL,
        timeout: float = DEFAULT_POLL_TIMEOUT,
        cookie: str | None = None,
    ) -> list[AudioInfo]:
        """Poll GET /api/get until every id reaches `streaming`/`complete` (or errors out).

        Mirrors the client-side polling pattern documented for wait_audio=False usage.
        Raises TimeoutError if the clips are not ready within `timeout` seconds.
        """
        ids = list(ids)
        deadline = time.monotonic() + timeout
        clips: list[AudioInfo] = []
        while time.monotonic() < deadline:
            clips = self.get(ids, cookie=cookie)
            if all(clip.is_ready or clip.is_error for clip in clips):
                return clips
            time.sleep(interval)
        raise TimeoutError(
            f"Clips {ids} did not finish generating within {timeout} seconds"
        )

    def close(self) -> None:
        self._session.close()

    def __enter__(self) -> SunoClient:  # noqa: PYI034 - typing.Self needs py3.11+
        return self

    def __exit__(self, *exc_info: object) -> None:
        self.close()
