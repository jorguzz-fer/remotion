export type RenderRequest = {
  compositionId: string;
  inputProps: Record<string, unknown>;
};

export type ParseResult =
  | { ok: true; value: RenderRequest }
  | { ok: false; error: string };

// Valida o corpo do POST /renders contra a lista de compositions do bundle.
export const parseRenderRequest = (
  body: unknown,
  knownCompositionIds: string[],
): ParseResult => {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, error: "o corpo deve ser um objeto JSON" };
  }
  const { compositionId, inputProps } = body as {
    compositionId?: unknown;
    inputProps?: unknown;
  };
  if (typeof compositionId !== "string" || compositionId.trim() === "") {
    return { ok: false, error: "compositionId é obrigatório" };
  }
  if (!knownCompositionIds.includes(compositionId)) {
    return {
      ok: false,
      error: `composition desconhecida: ${compositionId}. Disponíveis: ${knownCompositionIds.join(", ")}`,
    };
  }
  if (
    inputProps !== undefined &&
    (typeof inputProps !== "object" ||
      inputProps === null ||
      Array.isArray(inputProps))
  ) {
    return { ok: false, error: "inputProps deve ser um objeto" };
  }
  return {
    ok: true,
    value: {
      compositionId,
      inputProps: (inputProps as Record<string, unknown> | undefined) ?? {},
    },
  };
};
