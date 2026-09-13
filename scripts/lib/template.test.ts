import assert from "node:assert/strict";
import { test } from "node:test";
import { renderTemplate } from "./template.ts";

test("renderTemplate substitui todos os placeholders", () => {
  const out = renderTemplate(
    'id="__Slug__-Vertical" src="__slug__" title="__Titulo__"',
    {
      slug: "meu-video",
      Slug: "MeuVideo",
      Titulo: "Meu vídeo",
    },
  );
  assert.equal(out, 'id="MeuVideo-Vertical" src="meu-video" title="Meu vídeo"');
});

test("renderTemplate falha em placeholder desconhecido", () => {
  assert.throws(
    () => renderTemplate("__Nada__", { slug: "x" }),
    /Placeholder desconhecido: __Nada__/,
  );
});
