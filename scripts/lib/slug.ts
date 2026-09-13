const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const isValidSlug = (slug: string): boolean => SLUG_RE.test(slug);

// "lancamento-app" -> "LancamentoApp" (usado em IDs de composition e nomes de componente)
export const toPascalCase = (slug: string): string =>
  slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
