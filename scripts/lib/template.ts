// Substitui placeholders no formato __nome__ pelos valores de vars.
export const renderTemplate = (
  source: string,
  vars: Record<string, string>,
): string =>
  source.replace(/__([A-Za-z]+)__/g, (match, key: string) => {
    if (!(key in vars)) {
      throw new Error(`Placeholder desconhecido: ${match}`);
    }
    return vars[key];
  });
