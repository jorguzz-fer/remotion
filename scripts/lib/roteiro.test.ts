import assert from "node:assert/strict";
import { test } from "node:test";
import { parseRoteiro } from "./roteiro.ts";

test("parseRoteiro aceita um roteiro válido e limpa espaços", () => {
  const roteiro = parseRoteiro(
    JSON.stringify({
      voice: " Luciana ",
      scenes: { intro: " Olá. ", "cena-2": "Tchau." },
    }),
  );
  assert.deepEqual(roteiro, {
    voice: "Luciana",
    scenes: { intro: "Olá.", "cena-2": "Tchau." },
  });
});

test("parseRoteiro rejeita JSON inválido", () => {
  assert.throws(() => parseRoteiro("{ nope"), /roteiro.json inválido/);
});

test("parseRoteiro exige voice e scenes", () => {
  assert.throws(
    () => parseRoteiro(JSON.stringify({ scenes: { a: "x" } })),
    /"voice"/,
  );
  assert.throws(
    () => parseRoteiro(JSON.stringify({ voice: "Luciana" })),
    /"scenes"/,
  );
  assert.throws(
    () => parseRoteiro(JSON.stringify({ voice: "Luciana", scenes: {} })),
    /vazio/,
  );
});

test("parseRoteiro valida nomes e textos das cenas", () => {
  assert.throws(
    () => parseRoteiro(JSON.stringify({ voice: "L", scenes: { Intro: "x" } })),
    /inválido/,
  );
  assert.throws(
    () => parseRoteiro(JSON.stringify({ voice: "L", scenes: { intro: "  " } })),
    /sem texto/,
  );
});
