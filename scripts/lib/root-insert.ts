export const ROOT_MARKER =
  "{/* new-video: registre vídeos acima desta linha */}";

export type RootInsertResult = {
  source: string;
  inserted: boolean;
  reason: "already-registered" | "marker-missing" | null;
};

// Registra <PascalCompositions /> no src/Root.tsx: JSX acima do marcador e import
// depois do último import existente.
export const insertVideoIntoRoot = (
  source: string,
  { slug, pascal }: { slug: string; pascal: string },
): RootInsertResult => {
  const importLine = `import { ${pascal}Compositions } from "./videos/${slug}";`;
  const jsxLine = `<${pascal}Compositions />`;
  if (source.includes(importLine)) {
    return { source, inserted: false, reason: "already-registered" };
  }
  const markerIndex = source.indexOf(ROOT_MARKER);
  if (markerIndex === -1) {
    return { source, inserted: false, reason: "marker-missing" };
  }
  const lineStart = source.lastIndexOf("\n", markerIndex) + 1;
  const indent = source.slice(lineStart, markerIndex);
  const withJsx =
    source.slice(0, lineStart) +
    indent +
    jsxLine +
    "\n" +
    source.slice(lineStart);

  const importRe = /^import .*;$/gm;
  let last: RegExpExecArray | null = null;
  let match: RegExpExecArray | null;
  while ((match = importRe.exec(withJsx)) !== null) {
    last = match;
  }
  const withImport = last
    ? withJsx.slice(0, last.index + last[0].length) +
      "\n" +
      importLine +
      withJsx.slice(last.index + last[0].length)
    : importLine + "\n" + withJsx;
  return { source: withImport, inserted: true, reason: null };
};
