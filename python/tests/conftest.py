import pytest

from suno import SunoClient


@pytest.fixture
def client() -> SunoClient:
    return SunoClient(base_url="http://localhost:3000")
