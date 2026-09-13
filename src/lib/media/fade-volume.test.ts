import assert from "node:assert/strict";
import { test } from "node:test";
import { fadeVolume } from "./fade-volume.ts";

const base = {
  durationInFrames: 300,
  fadeInFrames: 30,
  fadeOutFrames: 60,
  volume: 0.5,
};

test("fadeVolume sobe no início, mantém no meio e desce no fim", () => {
  assert.equal(fadeVolume({ ...base, frame: 0 }), 0);
  assert.equal(fadeVolume({ ...base, frame: 15 }), 0.25);
  assert.equal(fadeVolume({ ...base, frame: 30 }), 0.5);
  assert.equal(fadeVolume({ ...base, frame: 150 }), 0.5);
  assert.equal(fadeVolume({ ...base, frame: 270 }), 0.25);
  assert.equal(fadeVolume({ ...base, frame: 300 }), 0);
});

test("fadeVolume sem fades devolve o volume cheio", () => {
  assert.equal(
    fadeVolume({ ...base, fadeInFrames: 0, fadeOutFrames: 0, frame: 0 }),
    0.5,
  );
});
