import assert from "node:assert/strict";
import test from "node:test";
import { loadConfig } from "../src/config.js";
import { redactSecret } from "../src/redact.js";

test("redacts long secrets without exposing the middle", () => {
  assert.equal(redactSecret("abcdefghijklmnop"), "abcd…mnop");
});

test("masks short secrets completely", () => {
  assert.equal(redactSecret("secret"), "******");
});

test("rejects missing cookie configuration", () => {
  assert.throws(() => loadConfig({}), /Missing SUNO_COOKIE/);
});

test("accepts a plausibly sized cookie", () => {
  assert.deepEqual(loadConfig({ SUNO_COOKIE: "abcdefghijklmnop" }), {
    cookie: "abcdefghijklmnop",
  });
});
