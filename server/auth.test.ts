import assert from "node:assert/strict";
import { test } from "node:test";
import { extractApiKey, isAuthorized } from "./auth.ts";

test("extractApiKey lê x-api-key ou Bearer", () => {
  assert.equal(extractApiKey({ "x-api-key": "abc" }), "abc");
  assert.equal(extractApiKey({ authorization: "Bearer xyz" }), "xyz");
  assert.equal(extractApiKey({ authorization: "Basic xyz" }), null);
  assert.equal(extractApiKey({}), null);
});

test("isAuthorized compara com a chave esperada", () => {
  assert.equal(isAuthorized("segredo", "segredo"), true);
  assert.equal(isAuthorized("segred0", "segredo"), false);
  assert.equal(isAuthorized("curta", "segredo"), false);
  assert.equal(isAuthorized(null, "segredo"), false);
  assert.equal(isAuthorized("segredo", ""), false);
});
