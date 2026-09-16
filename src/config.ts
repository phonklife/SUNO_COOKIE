export type SunoConfig = {
  cookie: string;
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): SunoConfig {
  const cookie = env.SUNO_COOKIE?.trim();

  if (!cookie) {
    throw new Error(
      "Missing SUNO_COOKIE. Set it in your local environment; do not commit the real value.",
    );
  }

  if (cookie.length < 16) {
    throw new Error("SUNO_COOKIE looks too short to be a valid session value.");
  }

  return { cookie };
}
