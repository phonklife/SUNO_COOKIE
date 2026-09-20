export {
  SunoClient,
  DEFAULT_BASE_URL,
  DEFAULT_MODEL,
  DEFAULT_TIMEOUT_MS,
  DEFAULT_POLL_INTERVAL_MS,
  DEFAULT_POLL_TIMEOUT_MS,
} from "./client";
export type { SunoClientOptions } from "./client";

export {
  SunoAPIError,
  BadRequestError,
  PaymentRequiredError,
  InternalServerError,
  ServiceUnavailableError,
} from "./errors";

export type {
  AudioInfo,
  LyricsResult,
  StemClip,
  AlignedWord,
  CreditLimit,
  Persona,
  PersonaInfo,
  GenerateOptions,
  CustomGenerateOptions,
  ExtendAudioOptions,
  GetOptions,
  PollOptions,
} from "./types";
export { isReady, isError } from "./types";
