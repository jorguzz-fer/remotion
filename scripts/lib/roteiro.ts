export type Roteiro = { voice: string; scenes: Record<string, string> };

const SCENE_KEY = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Valida o public/<slug>/voiceover/roteiro.json: { "voice": "...", "scenes": { "cena": "texto" } }.
export const parseRoteiro = (json: string): Roteiro => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (error) {
    throw new Error(`roteiro.json inválido: ${(error as Error).message}`);
  }
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error('roteiro.json deve ser um objeto com "voice" e "scenes"');
  }
  const { voice, scenes } = parsed as { voice?: unknown; scenes?: unknown };
  if (typeof voice !== "string" || voice.trim() === "") {
    throw new Error(
      'roteiro.json precisa de "voice" (nome da voz do macOS ou voiceId do ElevenLabs)',
    );
  }
  if (typeof scenes !== "object" || scenes === null || Array.isArray(scenes)) {
    throw new Error(
      'roteiro.json precisa de "scenes" como objeto { "nomeDaCena": "texto" }',
    );
  }
  const entries = Object.entries(scenes as Record<string, unknown>);
  if (entries.length === 0) {
    throw new Error('"scenes" está vazio');
  }
  const result: Record<string, string> = {};
  for (const [key, text] of entries) {
    if (!SCENE_KEY.test(key)) {
      throw new Error(
        `nome de cena inválido: "${key}" (use letras minúsculas, números e hífens)`,
      );
    }
    if (typeof text !== "string" || text.trim() === "") {
      throw new Error(`a cena "${key}" está sem texto`);
    }
    result[key] = text.trim();
  }
  return { voice: voice.trim(), scenes: result };
};
