import { assertEquals, assertExists } from "jsr:@std/assert@1";
import { validateInput } from "./validation.ts";

const valid = {
  uploadUrl: "https://example.com/audio.mp3",
  defaultParamFlag: false,
  model: "V4_5",
  callBackUrl: "https://example.com/callback",
  prompt: "continue dark phonk",
};

Deno.test("accepts valid payload and trims text", () => {
  const result = validateInput({ ...valid, prompt: "  continue dark phonk  " });
  assertExists(result.data);
  assertEquals(result.data.prompt, "continue dark phonk");
});

Deno.test("rejects non-object payloads", () => {
  for (const value of [null, [], "text", 7]) assertExists(validateInput(value).error);
});

Deno.test("requires HTTPS URLs and allowed model", () => {
  assertExists(validateInput({ ...valid, uploadUrl: "http://example.com/a.mp3" }).error);
  assertExists(validateInput({ ...valid, callBackUrl: "http://example.com/hook" }).error);
  assertExists(validateInput({ ...valid, model: "V9" }).error);
});

Deno.test("checks required prompt and field types", () => {
  const { prompt: _prompt, ...missing } = valid;
  assertExists(validateInput(missing).error);
  assertExists(validateInput({ ...valid, instrumental: "yes" }).error);
  assertExists(validateInput({ ...valid, title: 12 }).error);
});

Deno.test("checks custom mode required fields and limits", () => {
  assertExists(validateInput({ ...valid, defaultParamFlag: true }).error);
  assertExists(validateInput({ ...valid, prompt: "p".repeat(3001) }).error);
  assertExists(validateInput({ ...valid, defaultParamFlag: true, continueAt: 30, style: "s".repeat(201), title: "Track", prompt: "lyrics" }).error);
  assertExists(validateInput({ ...valid, defaultParamFlag: true, continueAt: 30, style: "phonk", title: "t".repeat(81), prompt: "lyrics" }).error);
});

Deno.test("accepts instrumental custom mode without prompt", () => {
  const result = validateInput({ ...valid, defaultParamFlag: true, continueAt: 30, style: "phonk", title: "Track", instrumental: true });
  assertExists(result.data);
});
