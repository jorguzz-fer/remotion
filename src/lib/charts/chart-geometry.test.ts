import assert from "node:assert/strict";
import { test } from "node:test";
import {
  layoutBars,
  layoutLinePoints,
  pointsToPath,
} from "./chart-geometry.ts";

test("layoutBars distribui as barras e escala pelo maior valor", () => {
  const bars = layoutBars({
    data: [
      { label: "a", value: 50 },
      { label: "b", value: 100 },
    ],
    width: 100,
    height: 200,
    gapRatio: 0.5,
  });
  assert.equal(bars.length, 2);
  assert.equal(bars[0].width, 25);
  assert.equal(bars[0].x, 12.5);
  assert.equal(bars[0].height, 100);
  assert.equal(bars[0].y, 100);
  assert.equal(bars[1].x, 62.5);
  assert.equal(bars[1].height, 200);
  assert.equal(bars[1].y, 0);
});

test("layoutBars com dados vazios ou zerados", () => {
  assert.deepEqual(layoutBars({ data: [], width: 100, height: 100 }), []);
  const zero = layoutBars({
    data: [{ label: "a", value: 0 }],
    width: 100,
    height: 100,
  });
  assert.equal(zero[0].height, 0);
  assert.equal(zero[0].y, 100);
});

test("layoutLinePoints e pointsToPath", () => {
  const points = layoutLinePoints({
    data: [
      { label: "a", value: 0 },
      { label: "b", value: 10 },
      { label: "c", value: 5 },
    ],
    width: 200,
    height: 100,
  });
  assert.deepEqual(
    points.map((p) => [p.x, p.y]),
    [
      [0, 100],
      [100, 0],
      [200, 50],
    ],
  );
  assert.equal(pointsToPath(points), "M 0 100 L 100 0 L 200 50");
});
