import assert from "node:assert/strict";
import { test } from "node:test";
import { isValidSlug, toPascalCase } from "./slug.ts";

test("isValidSlug aceita kebab-case minúsculo", () => {
  assert.equal(isValidSlug("lancamento-app"), true);
  assert.equal(isValidSlug("video2"), true);
  assert.equal(isValidSlug("Lancamento"), false);
  assert.equal(isValidSlug("com espaço"), false);
  assert.equal(isValidSlug("-comeca-com-hifen"), false);
  assert.equal(isValidSlug(""), false);
});

test("toPascalCase junta as partes", () => {
  assert.equal(toPascalCase("lancamento-app"), "LancamentoApp");
  assert.equal(toPascalCase("meu-video-2"), "MeuVideo2");
});
