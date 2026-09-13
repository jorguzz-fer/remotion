import assert from "node:assert/strict";
import { test } from "node:test";
import { captionsPathFor, isInside, isTranscribable } from "./media-files.ts";

test("isTranscribable aceita áudio e vídeo, ignora o resto", () => {
  assert.equal(isTranscribable("a.MP3"), true);
  assert.equal(isTranscribable("pasta/b.mov"), true);
  assert.equal(isTranscribable("roteiro.json"), false);
  assert.equal(isTranscribable("foto.png"), false);
});

test("captionsPathFor troca a extensão por .json", () => {
  assert.equal(
    captionsPathFor("public/exemplo/voiceover/intro.mp3"),
    "public/exemplo/voiceover/intro.json",
  );
  assert.equal(
    captionsPathFor("public/x/clipe.final.mov"),
    "public/x/clipe.final.json",
  );
});

test("isInside só aceita caminhos dentro da pasta", () => {
  assert.equal(isInside("public/exemplo/a.mp3", "public"), true);
  assert.equal(isInside("src/a.mp3", "public"), false);
  assert.equal(isInside("public", "public"), false);
  assert.equal(isInside("public/../src/a.mp3", "public"), false);
});
