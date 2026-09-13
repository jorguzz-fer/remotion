import assert from "node:assert/strict";
import { test } from "node:test";
import { parseRenderRequest } from "./validate.ts";

const known = ["Exemplo-Vertical", "Exemplo-Square"];

test("parseRenderRequest aceita composition conhecida com inputProps opcionais", () => {
  assert.deepEqual(
    parseRenderRequest({ compositionId: "Exemplo-Square" }, known),
    {
      ok: true,
      value: { compositionId: "Exemplo-Square", inputProps: {} },
    },
  );
  assert.deepEqual(
    parseRenderRequest(
      { compositionId: "Exemplo-Square", inputProps: { title: "Oi" } },
      known,
    ),
    {
      ok: true,
      value: { compositionId: "Exemplo-Square", inputProps: { title: "Oi" } },
    },
  );
});

test("parseRenderRequest rejeita corpo, id e inputProps inválidos", () => {
  assert.equal(parseRenderRequest(null, known).ok, false);
  assert.equal(parseRenderRequest([], known).ok, false);
  assert.match(
    (parseRenderRequest({}, known) as { error: string }).error,
    /compositionId/,
  );
  assert.match(
    (parseRenderRequest({ compositionId: "Nada" }, known) as { error: string })
      .error,
    /desconhecida/,
  );
  assert.match(
    (
      parseRenderRequest(
        { compositionId: "Exemplo-Square", inputProps: [1] },
        known,
      ) as { error: string }
    ).error,
    /inputProps/,
  );
});
