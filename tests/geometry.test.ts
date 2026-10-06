import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ShapeTracker,
  windowRegion,
  fitRect,
  mirror,
  usable,
  type Hand,
  type Quad,
} from "../src/geometry.ts";
import { toTensor, fromTensor } from "../src/tensors.ts";
const hand = (x: number, label: string): Hand => ({
  wrist: { x, y: 0.8 },
  index: { x, y: 0.2 },
  thumb: { x: x + (x < 0.5 ? 0.15 : -0.15), y: 0.6 },
  label,
});
test("stable vertices when detector order reverses", () => {
  const s = new ShapeTracker();
  const a = s.update([hand(0.2, "Left"), hand(0.8, "Right")], 0);
  assert.deepEqual(s.update([hand(0.8, "Right"), hand(0.2, "Left")], 33), a);
});
test("loss holds briefly, hides at deadline, reacquires without stale smoothing", () => {
  const s = new ShapeTracker();
  assert.ok(s.update([hand(0.2, "Left"), hand(0.8, "Right")], 0));
  assert.ok(s.update([], 150));
  assert.equal(s.update([], 161), null);
  assert.equal(
    s.update([hand(0.1, "Left"), hand(0.9, "Right")], 500)?.[0].x,
    0.1,
  );
});
test("gentle smoothing approaches target without overshoot", () => {
  const s = new ShapeTracker();
  s.update([hand(0.2, "Left"), hand(0.8, "Right")], 0);
  const q = s.update([hand(0.3, "Left"), hand(0.9, "Right")], 33)!;
  assert.ok(q[0].x > 0.2 && q[0].x < 0.3);
});
test("bow-tie valid, collinear and invalid shapes hidden", () => {
  assert.ok(
    usable([
      { x: 0.2, y: 0.2 },
      { x: 0.8, y: 0.8 },
      { x: 0.2, y: 0.8 },
      { x: 0.8, y: 0.2 },
    ]),
  );
  assert.equal(
    usable([
      { x: 0, y: 0.5 },
      { x: 0.2, y: 0.5 },
      { x: 0.7, y: 0.5 },
      { x: 1, y: 0.5 },
    ]),
    false,
  );
  assert.equal(
    usable([
      { x: NaN, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
    ]),
    false,
  );
});
test("letterbox and mirroring coordinate roundtrip for wide/tall sources", () => {
  for (const [w, h] of [
    [640, 480],
    [1920, 1080],
    [480, 640],
  ]) {
    const r = fitRect(w, h, 512);
    assert.equal(r.width / r.height, w / h);
    for (const p of [
      { x: 0, y: 0 },
      { x: 0.23, y: 0.72 },
      { x: 1, y: 1 },
    ]) {
      const input = { x: r.x + p.x * r.width, y: r.y + p.y * r.height };
      assert.ok(Math.abs((input.x - r.x) / r.width - p.x) < 1e-10);
      assert.ok(Math.abs(mirror(mirror(p)).x - p.x) < 1e-10);
    }
  }
});
test("tensor RGB plane ordering, normalization and clamping", () => {
  const pixels = new Uint8ClampedArray([0, 127, 255, 255, 255, 0, 127, 255]);
  const tensor = toTensor(pixels);
  assert.equal(tensor[0], -1);
  assert.equal(tensor[1], 1);
  assert.deepEqual(fromTensor(tensor), pixels);
  assert.deepEqual([...fromTensor([-2, 0, 2])], [0, 128, 255, 255]);
});
test("invalid landmarks cannot poison smoothing after recovery", () => {
  const s = new ShapeTracker();
  const good = [hand(0.2, "Left"), hand(0.8, "Right")];
  s.update(good, 0);
  s.update([hand(NaN, "Left"), good[1]], 30);
  const q = s.update(good, 60)!;
  assert.ok(usable(q));
});

test("inference crop covers vertices and stays within camera bounds", () => {
  for (const q of [
    [
      { x: 0, y: 0 },
      { x: 0.1, y: 0 },
      { x: 0.1, y: 0.1 },
      { x: 0, y: 0.1 },
    ],
    [
      { x: 0.7, y: 0.3 },
      { x: 1, y: 0.2 },
      { x: 0.9, y: 1 },
      { x: 0.5, y: 0.9 },
    ],
  ]) {
    const r = windowRegion(q as Quad, 640, 480);
    assert.ok(
      r.x >= 0 && r.y >= 0 && r.x + r.width <= 640 && r.y + r.height <= 480,
    );
    for (const p of q) {
      assert.ok(p.x * 640 >= r.x && p.x * 640 <= r.x + r.width);
      assert.ok(p.y * 480 >= r.y && p.y * 480 <= r.y + r.height);
    }
  }
});

test("AnimeGANv3 uses interleaved RGB (NHWC), not v2 channel planes", () => {
  const pixels = new Uint8ClampedArray([0, 127, 255, 255, 255, 0, 127, 255]);
  const tensor = toTensor(pixels, true);
  assert.equal(tensor[0], -1);
  assert.equal(tensor[2], 1);
  assert.equal(tensor[3], 1);
  assert.deepEqual(fromTensor(tensor, true), pixels);
});
