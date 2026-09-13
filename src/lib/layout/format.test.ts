import assert from "node:assert/strict";
import { test } from "node:test";
import { getFormat, getSafeAreaMetrics } from "./format.ts";

test("getFormat classifica pela proporção", () => {
  assert.equal(getFormat(1080, 1920), "vertical");
  assert.equal(getFormat(1920, 1080), "horizontal");
  assert.equal(getFormat(1080, 1080), "square");
  assert.equal(getFormat(1080, 1350), "vertical");
});

test("getSafeAreaMetrics escala pela largura", () => {
  assert.deepEqual(getSafeAreaMetrics(1080), {
    paddingX: 80,
    paddingY: 100,
    baseFontSize: 44,
  });
  assert.deepEqual(getSafeAreaMetrics(1920), {
    paddingX: 142,
    paddingY: 178,
    baseFontSize: 79,
  });
});
