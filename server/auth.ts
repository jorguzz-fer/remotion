import { timingSafeEqual } from "node:crypto";

type HeaderBag = { "x-api-key"?: unknown; authorization?: unknown };

// Aceita a chave no header x-api-key ou em Authorization: Bearer <chave>.
export const extractApiKey = (headers: HeaderBag): string | null => {
  const direct = headers["x-api-key"];
  if (typeof direct === "string" && direct !== "") {
    return direct;
  }
  const authorization = headers.authorization;
  if (
    typeof authorization === "string" &&
    authorization.startsWith("Bearer ")
  ) {
    const token = authorization.slice("Bearer ".length).trim();
    return token === "" ? null : token;
  }
  return null;
};

// Comparação em tempo constante para não vazar o tamanho ou prefixo da chave.
export const isAuthorized = (
  provided: string | null,
  expected: string,
): boolean => {
  if (!provided || !expected) {
    return false;
  }
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
};
