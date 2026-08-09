export function finiteOr(value: number, fallback = 0): number {
  return Number.isFinite(value) ? value : fallback;
}

export function isFiniteVec(x: number, y: number, z: number): boolean {
  return Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z);
}
