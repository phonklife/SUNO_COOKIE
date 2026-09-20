import {
  BadRequestError,
  PaymentRequiredError,
  ServiceUnavailableError,
  SunoClient,
} from "../src";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function textResponse(body: string, status = 200): Response {
  return new Response(body, { status, headers: { "Content-Type": "text/plain" } });
}

function makeClient(fetchImpl: jest.Mock): SunoClient {
  return new SunoClient({
    baseUrl: "http://localhost:3000",
    fetchImpl: fetchImpl as unknown as typeof fetch,
  });
}

describe("SunoClient", () => {
  test("generate returns two clips and sends wait_audio", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(
      jsonResponse([
        { id: "a1", title: "Hopeful Horizons", status: "complete", audio_url: "https://cdn1.suno.ai/a1.mp3" },
        { id: "b2", title: "Electric Dawn", status: "complete" },
      ]),
    );
    const client = makeClient(fetchImpl);

    const clips = await client.generate("An upbeat electronic track", { waitAudio: true });

    expect(clips).toHaveLength(2);
    expect(clips[0]!.id).toBe("a1");
    const [, init] = fetchImpl.mock.calls[0];
    const sentBody = JSON.parse(init.body as string);
    expect(sentBody.wait_audio).toBe(true);
  });

  test("customGenerate sends negative tags and omits undefined fields", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(
      jsonResponse([{ id: "c3", title: "Ocean Wanderer", status: "complete" }]),
    );
    const client = makeClient(fetchImpl);

    const clips = await client.customGenerate("[Verse]\nSalt wind", "folk, acoustic guitar", "Ocean Wanderer", {
      negativeTags: "heavy metal",
    });

    expect(clips[0]!.title).toBe("Ocean Wanderer");
    const [, init] = fetchImpl.mock.calls[0];
    const sentBody = JSON.parse(init.body as string);
    expect(sentBody.negative_tags).toBe("heavy metal");
    expect(sentBody.tags).toBe("folk, acoustic guitar");
  });

  test("extendAudio omits undefined optional fields", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(jsonResponse([{ id: "e5", status: "streaming" }]));
    const client = makeClient(fetchImpl);

    const clips = await client.extendAudio("c3", { continueAt: 30 });

    expect(clips[0]!.id).toBe("e5");
    const [, init] = fetchImpl.mock.calls[0];
    const sentBody = JSON.parse(init.body as string);
    expect(sentBody.continue_at).toBe(30);
    expect(sentBody).not.toHaveProperty("prompt");
    expect(sentBody).not.toHaveProperty("tags");
  });

  test("concat returns a single AudioInfo, not an array", async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValue(jsonResponse({ id: "f6", title: "Ocean Wanderer (Full)", status: "complete" }));
    const client = makeClient(fetchImpl);

    const result = await client.concat("e5");

    expect(result.id).toBe("f6");
    expect(result.title).toBe("Ocean Wanderer (Full)");
  });

  test("generateLyrics returns lyrics result", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(
      jsonResponse({ id: "l1", title: "Frost and Absence", text: "[Verse 1]\n...", status: "complete" }),
    );
    const client = makeClient(fetchImpl);

    const result = await client.generateLyrics("A melancholic song about winter");

    expect(result.title).toBe("Frost and Absence");
    expect(result.status).toBe("complete");
  });

  test("generateStems returns vocal/instrumental stems", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(
      jsonResponse([
        { id: "d4", title: "Ocean Wanderer (Vocals)", stem_from_id: "c3", status: "complete" },
        { id: "e5", title: "Ocean Wanderer (Instrumental)", stem_from_id: "c3", status: "complete" },
      ]),
    );
    const client = makeClient(fetchImpl);

    const stems = await client.generateStems("c3");

    expect(stems).toHaveLength(2);
    expect(stems[0]!.stem_from_id).toBe("c3");
  });

  test("getAlignedLyrics returns word timestamps and sends song_id query param", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(
      jsonResponse([
        { word: "The", start_s: 4.12, end_s: 4.28, success: true, p_align: 0.97 },
        { word: "window", start_s: 4.29, end_s: 4.71, success: true, p_align: 0.95 },
      ]),
    );
    const client = makeClient(fetchImpl);

    const words = await client.getAlignedLyrics("c3");

    expect(words).toHaveLength(2);
    expect(words[0]!.word).toBe("The");
    const [url] = fetchImpl.mock.calls[0];
    expect(new URL(url as string).searchParams.get("song_id")).toBe("c3");
  });

  test("get sends comma-joined ids and page params", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(jsonResponse([{ id: "abc123", status: "complete" }]));
    const client = makeClient(fetchImpl);

    const clips = await client.get(["abc123", "def456"], { page: 2 });

    expect(clips[0]!.id).toBe("abc123");
    const [url] = fetchImpl.mock.calls[0];
    const parsed = new URL(url as string);
    expect(parsed.searchParams.get("ids")).toBe("abc123,def456");
    expect(parsed.searchParams.get("page")).toBe("2");
  });

  test("getClip returns the raw unnormalized object", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(jsonResponse({ id: "abc123", metadata: { tags: "synthwave" } }));
    const client = makeClient(fetchImpl);

    const clip = await client.getClip("abc123");

    expect((clip.metadata as Record<string, unknown>).tags).toBe("synthwave");
  });

  test("getLimit returns credit balance", async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValue(jsonResponse({ credits_left: 30, period: "day", monthly_limit: 50, monthly_usage: 20 }));
    const client = makeClient(fetchImpl);

    const limit = await client.getLimit();

    expect(limit.credits_left).toBe(30);
  });

  test("getPersona returns persona info", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(
      jsonResponse({
        persona: { id: "abc123", name: "RockLegend", clip_count: 27 },
        total_results: 27,
        current_page: 1,
        is_following: false,
      }),
    );
    const client = makeClient(fetchImpl);

    const info = await client.getPersona("abc123");

    expect(info.persona.name).toBe("RockLegend");
    expect(info.total_results).toBe(27);
  });

  test("chatCompletion returns raw plain text", async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValue(textResponse("## Song Title: Electric Pulse\n### Listen to the song: https://cdn1.suno.ai/abc123.mp3"));
    const client = makeClient(fetchImpl);

    const text = await client.chatCompletion("An upbeat electronic dance track");

    expect(text).toContain("Electric Pulse");
  });

  test("400 response throws BadRequestError", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(jsonResponse({ error: "Missing parameter audio_id" }, 400));
    const client = makeClient(fetchImpl);

    await expect(client.extendAudio("")).rejects.toBeInstanceOf(BadRequestError);
  });

  test("402 response throws PaymentRequiredError", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(jsonResponse({ error: "Insufficient credits" }, 402));
    const client = makeClient(fetchImpl);

    await expect(client.generate("a song")).rejects.toBeInstanceOf(PaymentRequiredError);
  });

  test("503 response throws ServiceUnavailableError", async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValue(jsonResponse({ error: "Network error connecting to Suno" }, 503));
    const client = makeClient(fetchImpl);

    await expect(client.generate("a song")).rejects.toBeInstanceOf(ServiceUnavailableError);
  });

  test("cookie override sets the Cookie header", async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValue(jsonResponse({ credits_left: 50, period: "day", monthly_limit: 50, monthly_usage: 0 }));
    const client = makeClient(fetchImpl);

    await client.getLimit("__client=other-account-token");

    const [, init] = fetchImpl.mock.calls[0];
    expect((init.headers as Record<string, string>)["Cookie"]).toBe("__client=other-account-token");
  });

  test("pollUntilComplete waits until clips are ready", async () => {
    jest.useFakeTimers();
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse([{ id: "a1", status: "queued" }]))
      .mockResolvedValueOnce(jsonResponse([{ id: "a1", status: "complete", audio_url: "https://cdn1.suno.ai/a1.mp3" }]));
    const client = makeClient(fetchImpl);

    const pollPromise = client.pollUntilComplete(["a1"], { intervalMs: 10, timeoutMs: 5000 });
    await jest.advanceTimersByTimeAsync(10);
    const clips = await pollPromise;

    expect(clips[0]!.status).toBe("complete");
    jest.useRealTimers();
  });

  test("pollUntilComplete rejects after timeout", async () => {
    const fetchImpl = jest.fn().mockImplementation(async () => jsonResponse([{ id: "a1", status: "queued" }]));
    const client = makeClient(fetchImpl);

    await expect(client.pollUntilComplete(["a1"], { intervalMs: 1, timeoutMs: 5 })).rejects.toThrow(
      /did not finish generating/,
    );
  });
});
