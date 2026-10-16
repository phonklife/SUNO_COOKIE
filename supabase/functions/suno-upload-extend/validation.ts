export type UploadExtendInput = {
  uploadUrl: string;
  defaultParamFlag: boolean;
  model: string;
  callBackUrl: string;
  instrumental?: boolean;
  continueAt?: number;
  prompt?: string;
  style?: string;
  title?: string;
  negativeTags?: string;
};

const MODELS = new Set(["V3_5", "V4", "V4_5", "V4_5PLUS"]);

function httpsUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try { return new URL(value).protocol === "https:"; } catch { return false; }
}

export function validateInput(value: unknown): { data?: UploadExtendInput; error?: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { error: "Body musi być obiektem JSON." };
  const b = value as Record<string, unknown>;
  if (!httpsUrl(b.uploadUrl)) return { error: "uploadUrl musi być prawidłowym adresem HTTPS." };
  if (typeof b.defaultParamFlag !== "boolean") return { error: "defaultParamFlag musi być boolean." };
  if (typeof b.model !== "string" || !MODELS.has(b.model)) return { error: "Niedozwolony model." };
  if (!httpsUrl(b.callBackUrl)) return { error: "callBackUrl musi być prawidłowym adresem HTTPS." };
  if (b.instrumental !== undefined && typeof b.instrumental !== "boolean") return { error: "instrumental musi być boolean." };
  if (b.continueAt !== undefined && (typeof b.continueAt !== "number" || !Number.isFinite(b.continueAt) || b.continueAt <= 0)) return { error: "continueAt musi być dodatnią liczbą." };

  for (const field of ["prompt", "style", "title", "negativeTags"]) {
    if (b[field] !== undefined && typeof b[field] !== "string") return { error: field + " musi być tekstem." };
  }
  const prompt = typeof b.prompt === "string" ? b.prompt.trim() : "";
  const style = typeof b.style === "string" ? b.style.trim() : "";
  const title = typeof b.title === "string" ? b.title.trim() : "";
  const negativeTags = typeof b.negativeTags === "string" ? b.negativeTags.trim() : "";

  if (b.defaultParamFlag === true) {
    if (typeof b.continueAt !== "number" || !style || !title) return { error: "Tryb custom wymaga continueAt, style i title." };
    if (b.instrumental !== true && !prompt) return { error: "Tryb custom wymaga prompt, chyba że instrumental=true." };
  } else if (!prompt) return { error: "prompt jest wymagany." };

  if (prompt.length > 3000) return { error: "prompt przekracza limit 3000 znaków." };
  if (style.length > 200) return { error: "style przekracza limit 200 znaków." };
  if (title.length > 80) return { error: "title przekracza limit 80 znaków." };

  const data: UploadExtendInput = {
    uploadUrl: (b.uploadUrl as string).trim(),
    defaultParamFlag: b.defaultParamFlag,
    model: b.model,
    callBackUrl: (b.callBackUrl as string).trim(),
  };
  if (b.instrumental !== undefined) data.instrumental = b.instrumental as boolean;
  if (typeof b.continueAt === "number") data.continueAt = b.continueAt;
  if (prompt) data.prompt = prompt;
  if (style) data.style = style;
  if (title) data.title = title;
  if (negativeTags) data.negativeTags = negativeTags;
  return { data };
}
