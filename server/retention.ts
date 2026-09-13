import fs from "node:fs";
import path from "node:path";

export type FileEntry = { name: string; mtimeMs: number };

export const selectExpired = (
  entries: FileEntry[],
  nowMs: number,
  ttlMs: number,
): string[] =>
  entries
    .filter(
      (entry) => entry.name.endsWith(".mp4") && nowMs - entry.mtimeMs > ttlMs,
    )
    .map((e) => e.name);

// Apaga os mp4 mais velhos que ttlHours dentro de dir e devolve os nomes removidos.
export const cleanupRenders = (dir: string, ttlHours: number): string[] => {
  if (!fs.existsSync(dir)) {
    return [];
  }
  const entries = fs.readdirSync(dir).map((name) => ({
    name,
    mtimeMs: fs.statSync(path.join(dir, name)).mtimeMs,
  }));
  const expired = selectExpired(entries, Date.now(), ttlHours * 3600 * 1000);
  for (const name of expired) {
    fs.rmSync(path.join(dir, name), { force: true });
  }
  return expired;
};
