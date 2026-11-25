import { BufferAttribute, BufferGeometry, CatmullRomCurve3, InstancedMesh, MeshStandardMaterial, TubeGeometry, Vector3, Euler } from 'three';
import { bakePiece, signalPiece, type SignalPieceBake } from './kinds';
import { whipModel } from './whipModel';
import { CRACK, WHIP_HOLD, WHIP_VIEW, type CoilPath, type CordRgb, type CordStyle, type LashHoldRow, type LashView } from './rows/whip';

/**
 * Build-time only (G345, the lash's graphical port): the bullwhip's held geometry, baked offline
 * (`generators/bake-signal-world.mjs` → `baked/lash.glb` + `data/lash.json`). The client builds no tube or braid: it
 * reads five kinds, `coil` (the braided rest coil the Model Explorer shows), `loop` (the plaited coil in the hero
 * glove's frame), `cord` (the thrown cord's rings, its braid painted, its positions rewritten every frame by
 * `runtime/items/lashView.ts`) and `wrap` (the helix a heavy lash winds round a caught lever) and `crack` (the popper's flash), and the two numbers the generated glove's fit gives: where the lash leaves the hand
 * (`tip`) and the plait tile's repeat along the loop (`along`). The glove's fit is a frozen row (`LASH_TIP`, which
 * whip-view.test.ts recomputes from the generated glove); neither the bake nor the client loads the glove. QA 11-24 row 50 (J510): no plait texture ships; the held whip is code geometry.
 */

/** Paints a tube's rings with two strands laid in a spiral (the plait), so the braid reads without a texture; the last `popperRings` are the popper. */
export function braidColours(geometry: BufferGeometry, rings: number, sides: number, popperRings: number, a: CordRgb, b: CordRgb, popper: CordRgb): void {
  const count = geometry.getAttribute('position').count, colors = new Float32Array(count * 3);
  for (let v = 0; v < count; v++) {
    const i = Math.floor(v / sides), j = v % sides;
    const c = i >= rings - popperRings ? popper : (i * 2 + j) % 4 < 2 ? a : b;
    colors[v * 3] = c[0]; colors[v * 3 + 1] = c[1]; colors[v * 3 + 2] = c[2];
  }
  geometry.setAttribute('color', new BufferAttribute(colors, 3));
}

/** The thrown cord's rest geometry: `segments + 1` rings of `radial` vertices at the origin, their braid painted. */
export function cordGeometry(style: CordStyle): BufferGeometry {
  const geometry = new BufferGeometry(), { segments, radial } = style, rings = segments + 1, index: number[] = [];
  for (let s = 0; s < segments; s++) for (let r = 0; r < radial; r++) {
    const a = s * radial + r, b = s * radial + (r + 1) % radial, c = a + radial, d = b + radial;
    index.push(a, c, b, b, c, d);
  }
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(rings * radial * 3), 3));
  geometry.setIndex(index);
  braidColours(geometry, rings, radial, style.popperRings, style.strandA, style.strandB, style.popper);
  return geometry;
}

/**
 * A held coil's centre line: the cord leaves the handle's top straight into the ellipse at `start`, turns counter-clockwise
 * as the camera sees it (up the right side, over the top, down the left), ends at its foot and drops through the fall, so
 * no stretch of cord crosses the coil's middle.
 */
export function coilPoints(c: CoilPath): Vector3[] {
  const [fx, fy, fz] = c.from, a0 = c.start;
  // the ellipse placed so its point at `start` is the handle's top (in the plane turned by `face`)
  const cx = fx - Math.cos(a0) * c.rx * Math.cos(c.face), cy = fy - Math.sin(a0) * c.ry, cz = fz - Math.cos(a0) * c.rx * Math.sin(c.face);
  const pts: Vector3[] = [], n = 40 * c.turns, sweep = Math.PI * 2 * c.turns - (a0 + Math.PI * 0.5);
  for (let i = 0; i <= n; i++) {
    const t = i / n, a = a0 + t * sweep, k = t * (c.turns - 1);
    const wob = 1 - 0.04 * Math.sin(a * 3 + 0.7), ex = Math.cos(a) * c.rx * wob;
    pts.push(new Vector3(cx + ex * Math.cos(c.face) + c.step[0] * k, cy + Math.sin(a) * c.ry * wob + c.step[1] * k, cz + ex * Math.sin(c.face) + c.step[2] * k + Math.sin(a) * 0.05));
  }
  for (const q of c.tail) pts.push(new Vector3(q[0], q[1], q[2]));
  return pts;
}

/** The plaited loop along the hero coil's path, and the plait tile's repeat along it (true UVs, the tile at 45 deg). */
export function loopGeometry(row: LashHoldRow): { geometry: TubeGeometry; along: number } {
  const curve = new CatmullRomCurve3(coilPoints(row.loop), false, 'centripetal'), length = curve.getLength(), { cord } = row.loop, p = row.plait;
  return { geometry: new TubeGeometry(curve, 360, cord, 12, false), along: length / (p.rows * (2 * Math.PI * cord) / p.columns) };
}

/** The braided rest coil: `turns` shrinking loops beside the generated glove's fist, then the fall. */
export function restCoilGeometry(row: LashHoldRow): TubeGeometry {
  const c = row.made.coil, W = row.coil, points: Vector3[] = [];
  for (let i = 0; i <= W.points; i++) {
    const s = i / W.points, a = -Math.PI / 2 + s * Math.PI * 2 * c.turns / 2, r = c.loopR * (1 - W.shrink * s);
    points.push(new Vector3(W.origin[0] + Math.cos(a) * r * W.squash - s * W.drift[0], W.origin[1] + (Math.sin(a) + 1) * r, W.origin[2] - s * W.drift[1]));
  }
  points.push(...W.fall.map(([x, y, z]) => new Vector3(x, y, z)));
  const geometry = new TubeGeometry(new CatmullRomCurve3(points), W.tubular, c.cord, row.radial, false);
  braidColours(geometry, W.tubular + 1, row.radial + 1, 0, W.a, W.b, row.braid.popper);
  return geometry;
}

/** The helix a heavy lash winds round a caught lever (`runtime/items/lashWeapon.ts` shows it at the lever while the wrap holds). */
export function wrapGeometry(w: LashView['wrap']): TubeGeometry {
  const pts: Vector3[] = [];
  for (let i = 0; i <= w.samples; i++) { const a = (i / w.samples) * Math.PI * 2 * w.turns; pts.push(new Vector3(Math.cos(a) * w.r, (i / w.samples - 0.5) * w.h, Math.sin(a) * w.r)); }
  return new TubeGeometry(new CatmullRomCurve3(pts), w.segments, w.cord, w.sides, false);
}

/**
 * Where the lash leaves the hand, in the hold's frame, as the client always fitted the generated glove: its handle's axis
 * (the mean of the vertices between `collar[0]` and `collar[1]` short of its far end) and its fist (`fist` of the way
 * along) moved to the origin, stood on +Y, turned by `turn` and scaled; the keeper `keeper` short of the far end as the
 * fitted bounds' +X reads it (three refits a geometry's bounds in place on every transform), turned by the grip's pose.
 */
export function lashTip(row: LashHoldRow, glove: BufferGeometry): [number, number, number] {
  glove.computeBoundingBox();
  const b = glove.boundingBox, fit = row.glove, p = glove.getAttribute('position');
  if (b === null) throw new Error('whip-glove has no bounds');
  const x1 = b.max.x - fit.collar[0], x2 = b.max.x - fit.collar[1]; let n = 0, y = 0, z = 0;
  for (let i = 0; i < p.count; i++) if (p.getX(i) > x1 && p.getX(i) < x2) { y += p.getY(i); z += p.getZ(i); n++; }
  const fist = b.min.x + (b.max.x - b.min.x) * fit.fist;
  glove.translate(-fist, n > 0 ? -y / n : -(b.min.y + b.max.y) / 2, n > 0 ? -z / n : -(b.min.z + b.max.z) / 2);
  glove.rotateZ(Math.PI / 2); glove.rotateY(fit.turn); glove.scale(fit.scale, fit.scale, fit.scale);
  const top = (b.max.x - fist - fit.keeper) * fit.scale;
  return new Vector3(0, top, 0).applyEuler(new Euler(...row.made.grip)).toArray();
}

/**
 * The whip crack's flash (QA 11-23-b row 13): `spikes` thin three-sided rays out of a unit ball, spread evenly on a
 * golden spiral and every other one half length, so the scaled flash reads as a burst of light at the popper.
 */
export function crackGeometry(row: typeof CRACK = CRACK): BufferGeometry {
  const positions: number[] = [], up = new Vector3(), side = new Vector3(), other = new Vector3(), dir = new Vector3();
  for (let i = 0; i < row.spikes; i++) {
    const y = 1 - 2 * (i + 0.5) / row.spikes, r = Math.sqrt(1 - y * y), a = i * Math.PI * (3 - Math.sqrt(5));
    dir.set(Math.cos(a) * r, y, Math.sin(a) * r);
    up.set(Math.abs(dir.y) > 0.9 ? 1 : 0, Math.abs(dir.y) > 0.9 ? 0 : 1, 0);
    side.crossVectors(dir, up).normalize(); other.crossVectors(dir, side).normalize();
    const tip = dir.clone().multiplyScalar(i % 2 === 0 ? 1 : 0.55), w = row.width;
    const base = [0, 1, 2].map(k => { const t = k / 3 * Math.PI * 2; return side.clone().multiplyScalar(Math.cos(t) * w).add(other.clone().multiplyScalar(Math.sin(t) * w)); });
    for (let k = 0; k < 3; k++) { const b0 = base[k], b1 = base[(k + 1) % 3]; if (b0 === undefined || b1 === undefined) throw new Error('crack ray');
      positions.push(b0.x, b0.y, b0.z, b1.x, b1.y, b1.z, tip.x, tip.y, tip.z); }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  geometry.computeVertexNormals();
  return geometry;
}

const kind = (geometry: BufferGeometry): InstancedMesh => new InstancedMesh(geometry, new MeshStandardMaterial(), 1);

/** The lash's bake: its four kinds (no colliders), the hand's `tip` (the generated glove's fit, `LASH_TIP`) and the loop's `along`. */
export function bakeSignalLash(tip?: readonly [number, number, number], row: LashHoldRow = WHIP_HOLD, view: LashView = WHIP_VIEW): SignalPieceBake {
  // QA 11-24 row 11 (J510): the held whip is real geometry (`whipModel.ts`): `hand` the braided handle and gloved fist,
  // `loop` the three-strand plaited coil; the lash leaves the handle's keeper.
  const model = whipModel(), along = loopGeometry(row).along;
  return bakePiece(signalPiece('lash', [['coil', kind(restCoilGeometry(row))], ['loop', kind(model.loop)], ['hand', kind(model.hand)], ['cord', kind(cordGeometry(row.lash))], ['wrap', kind(wrapGeometry(view.wrap))], ['crack', kind(crackGeometry())]], [],
    { tip: [...(tip ?? model.tip)], along }));
}
