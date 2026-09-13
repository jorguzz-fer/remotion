import assert from "node:assert/strict";
import { test } from "node:test";
import { getPageTimings } from "./caption-pages.ts";

test("getPageTimings corta a página quando a próxima começa", () => {
  const timings = getPageTimings({
    pages: [
      { startMs: 0, tokens: [{ toMs: 900 }] },
      { startMs: 1000, tokens: [{ toMs: 2500 }] },
    ],
    fps: 30,
    switchEveryMs: 1200,
  });
  assert.deepEqual(timings, [
    { from: 0, durationInFrames: 30 },
    { from: 30, durationInFrames: 45 },
  ]);
});

test("getPageTimings com lista vazia", () => {
  assert.deepEqual(
    getPageTimings({ pages: [], fps: 30, switchEveryMs: 1200 }),
    [],
  );
});
