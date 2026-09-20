"""Python client library for a self-hosted suno-api server."""

from .client import DEFAULT_BASE_URL, DEFAULT_MODEL, SunoClient
from .exceptions import (
    BadRequestError,
    InternalServerError,
    PaymentRequiredError,
    ServiceUnavailableError,
    SunoAPIError,
)
from .models import (
    AlignedWord,
    AudioInfo,
    CreditLimit,
    LyricsResult,
    Persona,
    PersonaInfo,
    StemClip,
)

__version__ = "0.1.0"

__all__ = [
    "DEFAULT_BASE_URL",
    "DEFAULT_MODEL",
    "AlignedWord",
    "AudioInfo",
    "BadRequestError",
    "CreditLimit",
    "InternalServerError",
    "LyricsResult",
    "PaymentRequiredError",
    "Persona",
    "PersonaInfo",
    "ServiceUnavailableError",
    "StemClip",
    "SunoAPIError",
    "SunoClient",
]
