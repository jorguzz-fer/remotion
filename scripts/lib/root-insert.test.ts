import assert from "node:assert/strict";
import { test } from "node:test";
import { insertVideoIntoRoot, ROOT_MARKER } from "./root-insert.ts";

const root = `import { ExemploCompositions } from "./videos/exemplo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <ExemploCompositions />
      ${ROOT_MARKER}
    </>
  );
};
`;

test("insertVideoIntoRoot adiciona import e JSX acima do marcador", () => {
  const result = insertVideoIntoRoot(root, {
    slug: "meu-video",
    pascal: "MeuVideo",
  });
  assert.equal(result.inserted, true);
  assert.equal(result.reason, null);
  assert.equal(
    result.source,
    `import { ExemploCompositions } from "./videos/exemplo";
import { MeuVideoCompositions } from "./videos/meu-video";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <ExemploCompositions />
      <MeuVideoCompositions />
      ${ROOT_MARKER}
    </>
  );
};
`,
  );
});

test("insertVideoIntoRoot não duplica um vídeo já registrado", () => {
  const once = insertVideoIntoRoot(root, {
    slug: "meu-video",
    pascal: "MeuVideo",
  }).source;
  const twice = insertVideoIntoRoot(once, {
    slug: "meu-video",
    pascal: "MeuVideo",
  });
  assert.equal(twice.inserted, false);
  assert.equal(twice.reason, "already-registered");
  assert.equal(twice.source, once);
});

test("insertVideoIntoRoot avisa quando o marcador sumiu", () => {
  const result = insertVideoIntoRoot(root.replace(ROOT_MARKER, ""), {
    slug: "x",
    pascal: "X",
  });
  assert.equal(result.inserted, false);
  assert.equal(result.reason, "marker-missing");
});
