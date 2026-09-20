"""Exceptions raised by the Suno API client.

Mirrors the status-code-to-error mapping documented for suno-api:
400 -> bad request, 402 -> out of credits, 500 -> internal error,
503 -> network error reaching Suno.
"""

from __future__ import annotations

from typing import Any


class SunoAPIError(Exception):
    """Base exception for all errors raised by the Suno API client."""

    def __init__(self, message: str, status_code: int | None = None, response_body: Any = None) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.response_body = response_body

    def __str__(self) -> str:  # pragma: no cover - trivial
        if self.status_code is not None:
            return f"[{self.status_code}] {self.message}"
        return self.message


class BadRequestError(SunoAPIError):
    """Raised for HTTP 400 responses (e.g. missing required field)."""


class PaymentRequiredError(SunoAPIError):
    """Raised for HTTP 402 responses — out of Suno credits."""


class InternalServerError(SunoAPIError):
    """Raised for HTTP 500 responses."""


class ServiceUnavailableError(SunoAPIError):
    """Raised for HTTP 503 responses — network error connecting to Suno."""


_STATUS_TO_ERROR: dict[int, type[SunoAPIError]] = {
    400: BadRequestError,
    402: PaymentRequiredError,
    500: InternalServerError,
    503: ServiceUnavailableError,
}


def error_for_status(status_code: int, message: str, response_body: Any = None) -> SunoAPIError:
    """Build the typed exception matching a given HTTP status code."""
    error_cls = _STATUS_TO_ERROR.get(status_code, SunoAPIError)
    return error_cls(message, status_code=status_code, response_body=response_body)
