/**
 * Client for a self-hosted suno-api (https://github.com/gcui-art/suno-api) server.
 *
 * This client does not talk to Suno.com directly and does not manage Suno session
 * cookies — that is the responsibility of the suno-api server it points at (via its
 * own SUNO_COOKIE environment variable). This client only needs the server's base
 * URL, plus an optional per-request Cookie override to switch Suno accounts, exactly
 * as documented for suno-api's "per-request cookie override" feature.
 *
 * Uses the platform's global `fetch` (Node 18+) — no HTTP dependency required.
 */

import { errorForStatus } from "./errors";
import {
  AlignedWord,
  AudioInfo,
  CreditLimit,
  CustomGenerateOptions,
  ExtendAudioOptions,
  GenerateOptions,
  GetOptions,
  LyricsResult,
  PersonaInfo,
  PollOptions,
  StemClip,
  isError,
  isReady,
} from "./types";

export const DEFAULT_BASE_URL = "http://localhost:3000";
export const DEFAULT_MODEL = "chirp-v3-5";
export const DEFAULT_TIMEOUT_MS = 30_000;
export const DEFAULT_POLL_INTERVAL_MS = 5_000;
export const DEFAULT_POLL_TIMEOUT_MS = 100_000;

export interface SunoClientOptions {
  baseUrl?: string;
  cookie?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

function dropUndefined<T extends Record<string, unknown>>(payload: T): Partial<T> {
  const result: Partial<T> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (value !== undefined) {
      (result as Record<string, unknown>)[key] = value;
    }
  }
  return result;
}

export class SunoClient {
  readonly baseUrl: string;
  private readonly cookie?: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: SunoClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
    this.cookie = options.cookie;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  private headers(cookie?: string): Record<string, string> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const effectiveCookie = cookie ?? this.cookie;
    if (effectiveCookie) {
      headers["Cookie"] = effectiveCookie;
    }
    return headers;
  }

  private async request<T>(
    method: string,
    path: string,
    options: { params?: Record<string, string | number>; body?: unknown; cookie?: string } = {},
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (options.params) {
      for (const [key, value] of Object.entries(options.params)) {
        url.searchParams.set(key, String(value));
      }
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    let response: Response;
    try {
      response = await this.fetchImpl(url.toString(), {
        method,
        headers: this.headers(options.cookie),
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    const text = await response.text();
    if (response.status >= 400) {
      let message = text;
      let parsedBody: unknown = undefined;
      try {
        parsedBody = text ? JSON.parse(text) : undefined;
        if (parsedBody && typeof parsedBody === "object") {
          const body = parsedBody as Record<string, unknown>;
          message = (body.error as string) ?? (body.message as string) ?? message;
        }
      } catch {
        // leave message as raw text
      }
      throw errorForStatus(response.status, message, parsedBody);
    }

    if (!text) {
      return undefined as T;
    }
    return JSON.parse(text) as T;
  }

  /** POST /api/generate — generate two clips from a text description. */
  async generate(prompt: string, options: GenerateOptions = {}): Promise<AudioInfo[]> {
    return this.request<AudioInfo[]>("POST", "/api/generate", {
      body: {
        prompt,
        make_instrumental: options.makeInstrumental ?? false,
        model: options.model ?? DEFAULT_MODEL,
        wait_audio: options.waitAudio ?? false,
      },
      cookie: options.cookie,
    });
  }

  /** POST /api/custom_generate — generate two clips from explicit lyrics/tags/title. */
  async customGenerate(
    prompt: string,
    tags: string,
    title: string,
    options: CustomGenerateOptions = {},
  ): Promise<AudioInfo[]> {
    const body = dropUndefined({
      prompt,
      tags,
      title,
      make_instrumental: options.makeInstrumental ?? false,
      model: options.model ?? DEFAULT_MODEL,
      wait_audio: options.waitAudio ?? false,
      negative_tags: options.negativeTags,
    });
    return this.request<AudioInfo[]>("POST", "/api/custom_generate", { body, cookie: options.cookie });
  }

  /** POST /api/extend_audio — continue an existing clip. */
  async extendAudio(audioId: string, options: ExtendAudioOptions = {}): Promise<AudioInfo[]> {
    const body = dropUndefined({
      audio_id: audioId,
      prompt: options.prompt,
      continue_at: options.continueAt,
      tags: options.tags,
      negative_tags: options.negativeTags,
      title: options.title,
      model: options.model ?? DEFAULT_MODEL,
      wait_audio: options.waitAudio ?? false,
    });
    return this.request<AudioInfo[]>("POST", "/api/extend_audio", { body, cookie: options.cookie });
  }

  /** POST /api/concat — merge an extension clip with its parent lineage. */
  async concat(clipId: string, cookie?: string): Promise<AudioInfo> {
    return this.request<AudioInfo>("POST", "/api/concat", { body: { clip_id: clipId }, cookie });
  }

  /** POST /api/generate_lyrics — generate lyrics only, no audio. */
  async generateLyrics(prompt: string, cookie?: string): Promise<LyricsResult> {
    return this.request<LyricsResult>("POST", "/api/generate_lyrics", { body: { prompt }, cookie });
  }

  /** POST /api/generate_stems — split a song into vocal/instrumental stems. */
  async generateStems(audioId: string, cookie?: string): Promise<StemClip[]> {
    return this.request<StemClip[]>("POST", "/api/generate_stems", {
      body: { audio_id: audioId },
      cookie,
    });
  }

  /** GET /api/get_aligned_lyrics — word-level lyric timestamps. */
  async getAlignedLyrics(songId: string, cookie?: string): Promise<AlignedWord[]> {
    return this.request<AlignedWord[]>("GET", "/api/get_aligned_lyrics", {
      params: { song_id: songId },
      cookie,
    });
  }

  /** GET /api/get — fetch clip(s) by id, or the whole library. */
  async get(ids?: string[], options: GetOptions = {}): Promise<AudioInfo[]> {
    const params: Record<string, string | number> = {};
    if (ids !== undefined) {
      params.ids = ids.join(",");
    }
    if (options.page !== undefined) {
      params.page = options.page;
    }
    return this.request<AudioInfo[]>("GET", "/api/get", { params, cookie: options.cookie });
  }

  /** GET /api/clip — raw, unnormalized Suno clip object (uses server-side SUNO_COOKIE only). */
  async getClip(clipId: string): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>("GET", "/api/clip", { params: { id: clipId } });
  }

  /** GET /api/get_limit — remaining credit balance. */
  async getLimit(cookie?: string): Promise<CreditLimit> {
    return this.request<CreditLimit>("GET", "/api/get_limit", { cookie });
  }

  /** GET /api/persona — persona info, paginated. */
  async getPersona(personaId: string, page = 1, cookie?: string): Promise<PersonaInfo> {
    return this.request<PersonaInfo>("GET", "/api/persona", {
      params: { id: personaId, page },
      cookie,
    });
  }

  /** POST /v1/chat/completions — OpenAI-compatible generation, returns raw markdown text. */
  async chatCompletion(prompt: string, model = DEFAULT_MODEL, cookie?: string): Promise<string> {
    const url = `${this.baseUrl}/v1/chat/completions`;
    const response = await this.fetchImpl(url, {
      method: "POST",
      headers: this.headers(cookie),
      body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }] }),
    });
    const text = await response.text();
    if (response.status >= 400) {
      throw errorForStatus(response.status, text);
    }
    return text;
  }

  /**
   * Poll GET /api/get until every id reaches `streaming`/`complete` (or errors out).
   * Mirrors the client-side polling pattern documented for waitAudio=false usage.
   * Rejects with an Error if the clips are not ready within `timeoutMs`.
   */
  async pollUntilComplete(ids: string[], options: PollOptions = {}): Promise<AudioInfo[]> {
    const intervalMs = options.intervalMs ?? DEFAULT_POLL_INTERVAL_MS;
    const timeoutMs = options.timeoutMs ?? DEFAULT_POLL_TIMEOUT_MS;
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      const clips = await this.get(ids, { cookie: options.cookie });
      if (clips.every((clip) => isReady(clip) || isError(clip))) {
        return clips;
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
    throw new Error(`Clips ${ids.join(",")} did not finish generating within ${timeoutMs}ms`);
  }
}
