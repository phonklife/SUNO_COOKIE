"""Typed response models for the Suno API client.

Field sets follow the AudioInfo / LyricsResult / StemClip / AlignedWord /
CreditLimit / PersonaInfo shapes documented in the suno-api API reference.
All `from_dict` constructors are tolerant of missing/extra keys since Suno's
underlying API is not guaranteed to return every field on every response.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class AudioInfo:
    id: str
    title: str | None = None
    image_url: str | None = None
    lyric: str | None = None
    audio_url: str | None = None
    video_url: str | None = None
    created_at: str | None = None
    model_name: str | None = None
    gpt_description_prompt: str | None = None
    prompt: str | None = None
    status: str | None = None
    type: str | None = None
    tags: str | None = None
    negative_tags: str | None = None
    duration: str | None = None
    error_message: str | None = None

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> AudioInfo:
        return cls(
            id=data["id"],
            title=data.get("title"),
            image_url=data.get("image_url"),
            lyric=data.get("lyric"),
            audio_url=data.get("audio_url"),
            video_url=data.get("video_url"),
            created_at=data.get("created_at"),
            model_name=data.get("model_name"),
            gpt_description_prompt=data.get("gpt_description_prompt"),
            prompt=data.get("prompt"),
            status=data.get("status"),
            type=data.get("type"),
            tags=data.get("tags"),
            negative_tags=data.get("negative_tags"),
            duration=data.get("duration"),
            error_message=data.get("error_message"),
        )

    @property
    def is_ready(self) -> bool:
        """True once the clip has audio available (`streaming` or `complete`)."""
        return self.status in ("streaming", "complete")

    @property
    def is_error(self) -> bool:
        return self.status == "error"


@dataclass
class LyricsResult:
    id: str
    title: str | None = None
    text: str | None = None
    status: str | None = None

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> LyricsResult:
        return cls(
            id=data["id"],
            title=data.get("title"),
            text=data.get("text"),
            status=data.get("status"),
        )


@dataclass
class StemClip:
    id: str
    status: str | None = None
    created_at: str | None = None
    title: str | None = None
    stem_from_id: str | None = None
    duration: str | None = None

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> StemClip:
        return cls(
            id=data["id"],
            status=data.get("status"),
            created_at=data.get("created_at"),
            title=data.get("title"),
            stem_from_id=data.get("stem_from_id"),
            duration=data.get("duration"),
        )


@dataclass
class AlignedWord:
    word: str
    start_s: float
    end_s: float
    success: bool = True
    p_align: float | None = None

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> AlignedWord:
        return cls(
            word=data["word"],
            start_s=data["start_s"],
            end_s=data["end_s"],
            success=data.get("success", True),
            p_align=data.get("p_align"),
        )


@dataclass
class CreditLimit:
    credits_left: float
    period: str
    monthly_limit: float
    monthly_usage: float

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> CreditLimit:
        return cls(
            credits_left=data["credits_left"],
            period=data["period"],
            monthly_limit=data["monthly_limit"],
            monthly_usage=data["monthly_usage"],
        )


@dataclass
class Persona:
    id: str
    name: str | None = None
    description: str | None = None
    image_s3_id: str | None = None
    root_clip_id: str | None = None
    user_display_name: str | None = None
    user_handle: str | None = None
    user_image_url: str | None = None
    is_suno_persona: bool = False
    is_trashed: bool = False
    is_owned: bool = False
    is_public: bool = False
    is_public_approved: bool = False
    is_loved: bool = False
    upvote_count: int = 0
    clip_count: int = 0
    persona_clips: list[Any] = field(default_factory=list)

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Persona:
        return cls(
            id=data["id"],
            name=data.get("name"),
            description=data.get("description"),
            image_s3_id=data.get("image_s3_id"),
            root_clip_id=data.get("root_clip_id"),
            user_display_name=data.get("user_display_name"),
            user_handle=data.get("user_handle"),
            user_image_url=data.get("user_image_url"),
            is_suno_persona=data.get("is_suno_persona", False),
            is_trashed=data.get("is_trashed", False),
            is_owned=data.get("is_owned", False),
            is_public=data.get("is_public", False),
            is_public_approved=data.get("is_public_approved", False),
            is_loved=data.get("is_loved", False),
            upvote_count=data.get("upvote_count", 0),
            clip_count=data.get("clip_count", 0),
            persona_clips=list(data.get("persona_clips", [])),
        )


@dataclass
class PersonaInfo:
    persona: Persona
    total_results: int
    current_page: int
    is_following: bool = False

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> PersonaInfo:
        return cls(
            persona=Persona.from_dict(data["persona"]),
            total_results=data.get("total_results", 0),
            current_page=data.get("current_page", 1),
            is_following=data.get("is_following", False),
        )
