export function toTensor(rgba: Uint8ClampedArray, nhwc = false) {
  const n = rgba.length / 4,
    out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++)
    for (let c = 0; c < 3; c++)
      out[nhwc ? i * 3 + c : c * n + i] = rgba[4 * i + c] / 127.5 - 1;
  return out;
}
export function fromTensor(rgb: ArrayLike<number>, nhwc = false) {
  const n = rgb.length / 3,
    out = new Uint8ClampedArray(n * 4);
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < 3; c++)
      out[4 * i + c] = (rgb[nhwc ? i * 3 + c : c * n + i] + 1) * 127.5;
    out[4 * i + 3] = 255;
  }
  return out;
}
