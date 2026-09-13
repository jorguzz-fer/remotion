import assert from "node:assert/strict";
import { test } from "node:test";
import { formatNumber } from "./format-number.ts";

test("formatNumber usa pt-BR por padrão", () => {
  assert.equal(formatNumber(1250), "1.250");
  assert.equal(formatNumber(3.14159, { decimals: 1 }), "3,1");
});

test("formatNumber aplica prefixo e sufixo", () => {
  assert.equal(
    formatNumber(42, { prefix: "+", suffix: " vídeos" }),
    "+42 vídeos",
  );
});
