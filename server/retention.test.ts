import assert from "node:assert/strict";
import { test } from "node:test";
import { selectExpired } from "./retention.ts";

const hour = 3600 * 1000;

test("selectExpired escolhe só mp4 mais velhos que o TTL", () => {
  const now = 100 * hour;
  const expired = selectExpired(
    [
      { name: "velho.mp4", mtimeMs: now - 80 * hour },
      { name: "recente.mp4", mtimeMs: now - 10 * hour },
      { name: "velho.txt", mtimeMs: now - 80 * hour },
    ],
    now,
    72 * hour,
  );
  assert.deepEqual(expired, ["velho.mp4"]);
});

test("selectExpired com lista vazia", () => {
  assert.deepEqual(selectExpired([], 0, 1), []);
});
