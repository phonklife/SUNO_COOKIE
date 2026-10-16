# SunoAPI Upload and Extend Audio

Repository notes for the Supabase Edge Function `suno-upload-extend`.

- Supabase project ref: `rfkngzzqnuejiawshwoz`
- Provider endpoint: `https://api.sunoapi.org/api/v1/generate/upload-extend`
- Keep JWT verification enabled.
- Store `SUNO_API_KEY` only in Supabase Edge Function secrets. Never commit credentials.
- Unit tests must mock provider requests; do not trigger paid audio generation in CI.

Status: repository synchronization is in progress. The deployed function has not passed a successful live HTTP smoke test yet. Verify the current official provider contract before production use.
