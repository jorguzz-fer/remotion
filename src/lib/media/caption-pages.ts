export type PageLike = { startMs: number; tokens: { toMs: number }[] };
export type PageTiming = { from: number; durationInFrames: number };

// Cada página de legenda fica visível por switchEveryMs (ou até seu último token
// terminar, se for mais tarde), mas nunca depois do início da página seguinte.
export const getPageTimings = ({
  pages,
  fps,
  switchEveryMs,
}: {
  pages: PageLike[];
  fps: number;
  switchEveryMs: number;
}): PageTiming[] => {
  const switchFrames = (switchEveryMs / 1000) * fps;
  return pages.map((page, index) => {
    const next = pages[index + 1] ?? null;
    const from = (page.startMs / 1000) * fps;
    const lastToken = page.tokens[page.tokens.length - 1];
    const tokensEnd = lastToken ? (lastToken.toMs / 1000) * fps : from;
    const naturalEnd = Math.max(from + switchFrames, tokensEnd);
    const end = next
      ? Math.min((next.startMs / 1000) * fps, naturalEnd)
      : naturalEnd;
    const roundedFrom = Math.round(from);
    return {
      from: roundedFrom,
      durationInFrames: Math.max(0, Math.round(end) - roundedFrom),
    };
  });
};
