import pytest
import responses

from suno import (
    BadRequestError,
    PaymentRequiredError,
    ServiceUnavailableError,
    SunoClient,
)

BASE = "http://localhost:3000"


@responses.activate
def test_generate_returns_two_clips(client: SunoClient) -> None:
    responses.add(
        responses.POST,
        f"{BASE}/api/generate",
        json=[
            {
                "id": "a1",
                "title": "Hopeful Horizons",
                "audio_url": "https://cdn1.suno.ai/a1.mp3",
                "status": "complete",
                "model_name": "chirp-v3-5",
            },
            {
                "id": "b2",
                "title": "Electric Dawn",
                "audio_url": "https://cdn1.suno.ai/b2.mp3",
                "status": "complete",
                "model_name": "chirp-v3-5",
            },
        ],
        status=200,
    )

    clips = client.generate("An upbeat electronic track", wait_audio=True)

    assert len(clips) == 2
    assert clips[0].id == "a1"
    assert clips[0].title == "Hopeful Horizons"
    assert clips[0].is_ready
    body = responses.calls[0].request.body
    assert b'"wait_audio": true' in body or b'"wait_audio":true' in body


@responses.activate
def test_custom_generate_sends_negative_tags(client: SunoClient) -> None:
    responses.add(
        responses.POST,
        f"{BASE}/api/custom_generate",
        json=[{"id": "c3", "title": "Ocean Wanderer", "status": "complete"}],
        status=200,
    )

    clips = client.custom_generate(
        prompt="[Verse]\nSalt wind",
        tags="folk, acoustic guitar",
        title="Ocean Wanderer",
        negative_tags="heavy metal",
    )

    assert clips[0].title == "Ocean Wanderer"
    import json

    sent = json.loads(responses.calls[0].request.body)
    assert sent["negative_tags"] == "heavy metal"
    assert sent["tags"] == "folk, acoustic guitar"


@responses.activate
def test_extend_audio_omits_none_fields(client: SunoClient) -> None:
    responses.add(
        responses.POST,
        f"{BASE}/api/extend_audio",
        json=[{"id": "e5", "status": "streaming"}],
        status=200,
    )

    clips = client.extend_audio("c3", continue_at=30)

    assert clips[0].id == "e5"
    import json

    sent = json.loads(responses.calls[0].request.body)
    assert sent["continue_at"] == 30
    assert "prompt" not in sent
    assert "tags" not in sent


@responses.activate
def test_concat_returns_single_audio_info(client: SunoClient) -> None:
    responses.add(
        responses.POST,
        f"{BASE}/api/concat",
        json={"id": "f6", "title": "Ocean Wanderer (Full)", "status": "complete"},
        status=200,
    )

    result = client.concat("e5")

    assert result.id == "f6"
    assert result.title == "Ocean Wanderer (Full)"


@responses.activate
def test_generate_lyrics(client: SunoClient) -> None:
    responses.add(
        responses.POST,
        f"{BASE}/api/generate_lyrics",
        json={"id": "l1", "title": "Frost and Absence", "text": "[Verse 1]\n...", "status": "complete"},
        status=200,
    )

    result = client.generate_lyrics("A melancholic song about winter")

    assert result.title == "Frost and Absence"
    assert result.status == "complete"


@responses.activate
def test_generate_stems_returns_two_tracks(client: SunoClient) -> None:
    responses.add(
        responses.POST,
        f"{BASE}/api/generate_stems",
        json=[
            {"id": "d4", "title": "Ocean Wanderer (Vocals)", "stem_from_id": "c3", "status": "complete"},
            {"id": "e5", "title": "Ocean Wanderer (Instrumental)", "stem_from_id": "c3", "status": "complete"},
        ],
        status=200,
    )

    stems = client.generate_stems("c3")

    assert len(stems) == 2
    assert stems[0].stem_from_id == "c3"


@responses.activate
def test_get_aligned_lyrics(client: SunoClient) -> None:
    responses.add(
        responses.GET,
        f"{BASE}/api/get_aligned_lyrics",
        json=[
            {"word": "The", "start_s": 4.12, "end_s": 4.28, "success": True, "p_align": 0.97},
            {"word": "window", "start_s": 4.29, "end_s": 4.71, "success": True, "p_align": 0.95},
        ],
        status=200,
    )

    words = client.get_aligned_lyrics("c3")

    assert len(words) == 2
    assert words[0].word == "The"
    assert responses.calls[0].request.params["song_id"] == "c3"


@responses.activate
def test_get_with_ids_and_page(client: SunoClient) -> None:
    responses.add(
        responses.GET,
        f"{BASE}/api/get",
        json=[{"id": "abc123", "title": "Midnight Drive", "status": "complete"}],
        status=200,
    )

    clips = client.get(["abc123", "def456"], page=2)

    assert clips[0].id == "abc123"
    request = responses.calls[0].request
    assert request.params["ids"] == "abc123,def456"
    assert request.params["page"] == "2"


@responses.activate
def test_get_clip_returns_raw_dict(client: SunoClient) -> None:
    responses.add(
        responses.GET,
        f"{BASE}/api/clip",
        json={"id": "abc123", "metadata": {"tags": "synthwave"}},
        status=200,
    )

    clip = client.get_clip("abc123")

    assert clip["metadata"]["tags"] == "synthwave"


@responses.activate
def test_get_limit(client: SunoClient) -> None:
    responses.add(
        responses.GET,
        f"{BASE}/api/get_limit",
        json={"credits_left": 30, "period": "day", "monthly_limit": 50, "monthly_usage": 20},
        status=200,
    )

    limit = client.get_limit()

    assert limit.credits_left == 30
    assert limit.period == "day"


@responses.activate
def test_get_persona(client: SunoClient) -> None:
    responses.add(
        responses.GET,
        f"{BASE}/api/persona",
        json={
            "persona": {"id": "abc123", "name": "RockLegend", "clip_count": 27},
            "total_results": 27,
            "current_page": 1,
            "is_following": False,
        },
        status=200,
    )

    info = client.get_persona("abc123", page=1)

    assert info.persona.name == "RockLegend"
    assert info.total_results == 27


@responses.activate
def test_chat_completion_returns_plain_text(client: SunoClient) -> None:
    responses.add(
        responses.POST,
        f"{BASE}/v1/chat/completions",
        body="## Song Title: Electric Pulse\n### Listen to the song: https://cdn1.suno.ai/abc123.mp3",
        status=200,
        content_type="text/plain",
    )

    text = client.chat_completion("An upbeat electronic dance track")

    assert "Electric Pulse" in text


@responses.activate
def test_400_raises_bad_request_error(client: SunoClient) -> None:
    responses.add(
        responses.POST,
        f"{BASE}/api/extend_audio",
        json={"error": "Missing parameter audio_id"},
        status=400,
    )

    with pytest.raises(BadRequestError) as exc_info:
        client.extend_audio("")

    assert exc_info.value.status_code == 400


@responses.activate
def test_402_raises_payment_required_error(client: SunoClient) -> None:
    responses.add(
        responses.POST,
        f"{BASE}/api/generate",
        json={"error": "Insufficient credits"},
        status=402,
    )

    with pytest.raises(PaymentRequiredError):
        client.generate("a song")


@responses.activate
def test_503_raises_service_unavailable_error(client: SunoClient) -> None:
    responses.add(
        responses.POST,
        f"{BASE}/api/generate",
        json={"error": "Network error connecting to Suno"},
        status=503,
    )

    with pytest.raises(ServiceUnavailableError):
        client.generate("a song")


@responses.activate
def test_cookie_override_sets_header(client: SunoClient) -> None:
    responses.add(
        responses.GET,
        f"{BASE}/api/get_limit",
        json={"credits_left": 50, "period": "day", "monthly_limit": 50, "monthly_usage": 0},
        status=200,
    )

    client.get_limit(cookie="__client=other-account-token")

    assert responses.calls[0].request.headers["Cookie"] == "__client=other-account-token"


@responses.activate
def test_poll_until_complete_waits_for_ready_status(client: SunoClient, monkeypatch: pytest.MonkeyPatch) -> None:
    responses.add(
        responses.GET,
        f"{BASE}/api/get",
        json=[{"id": "a1", "status": "queued"}],
        status=200,
    )
    responses.add(
        responses.GET,
        f"{BASE}/api/get",
        json=[{"id": "a1", "status": "complete", "audio_url": "https://cdn1.suno.ai/a1.mp3"}],
        status=200,
    )

    slept: list[float] = []
    monkeypatch.setattr("time.sleep", lambda seconds: slept.append(seconds))

    clips = client.poll_until_complete(["a1"], interval=0.01, timeout=5)

    assert clips[0].status == "complete"
    assert slept == [0.01]


@responses.activate
def test_poll_until_complete_times_out(client: SunoClient, monkeypatch: pytest.MonkeyPatch) -> None:
    responses.add(
        responses.GET,
        f"{BASE}/api/get",
        json=[{"id": "a1", "status": "queued"}],
        status=200,
    )

    times = iter([0, 0, 10, 10])
    monkeypatch.setattr("time.monotonic", lambda: next(times))
    monkeypatch.setattr("time.sleep", lambda seconds: None)

    with pytest.raises(TimeoutError):
        client.poll_until_complete(["a1"], interval=0.01, timeout=5)
