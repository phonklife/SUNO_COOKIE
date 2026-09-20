/**
 * Response types for the Suno API client.
 *
 * Field sets follow the AudioInfo / LyricsResult / StemClip / AlignedWord /
 * CreditLimit / PersonaInfo shapes documented in the suno-api API reference.
 */

export interface AudioInfo {
  id: string;
  title?: string;
  image_url?: string;
  lyric?: string;
  audio_url?: string;
  video_url?: string;
  created_at?: string;
  model_name?: string;
  gpt_description_prompt?: string;
  prompt?: string;
  status?: string;
  type?: string;
  tags?: string;
  negative_tags?: string;
  duration?: string;
  error_message?: string | null;
}

export function isReady(clip: AudioInfo): boolean {
  return clip.status === "streaming" || clip.status === "complete";
}

export function isError(clip: AudioInfo): boolean {
  return clip.status === "error";
}

export interface LyricsResult {
  id: string;
  title?: string;
  text?: string;
  status?: string;
}

export interface StemClip {
  id: string;
  status?: string;
  created_at?: string;
  title?: string;
  stem_from_id?: string;
  duration?: string;
}

export interface AlignedWord {
  word: string;
  start_s: number;
  end_s: number;
  success: boolean;
  p_align?: number;
}

export interface CreditLimit {
  credits_left: number;
  period: string;
  monthly_limit: number;
  monthly_usage: number;
}

export interface Persona {
  id: string;
  name?: string;
  description?: string;
  image_s3_id?: string;
  root_clip_id?: string;
  user_display_name?: string;
  user_handle?: string;
  user_image_url?: string;
  is_suno_persona?: boolean;
  is_trashed?: boolean;
  is_owned?: boolean;
  is_public?: boolean;
  is_public_approved?: boolean;
  is_loved?: boolean;
  upvote_count?: number;
  clip_count?: number;
  persona_clips?: unknown[];
}

export interface PersonaInfo {
  persona: Persona;
  total_results: number;
  current_page: number;
  is_following: boolean;
}

export interface GenerateOptions {
  makeInstrumental?: boolean;
  model?: string;
  waitAudio?: boolean;
  cookie?: string;
}

export interface CustomGenerateOptions {
  makeInstrumental?: boolean;
  model?: string;
  waitAudio?: boolean;
  negativeTags?: string;
  cookie?: string;
}

export interface ExtendAudioOptions {
  prompt?: string;
  continueAt?: number;
  tags?: string;
  negativeTags?: string;
  title?: string;
  model?: string;
  waitAudio?: boolean;
  cookie?: string;
}

export interface GetOptions {
  page?: number;
  cookie?: string;
}

export interface PollOptions {
  intervalMs?: number;
  timeoutMs?: number;
  cookie?: string;
}
