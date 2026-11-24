import { BufferAttribute, BufferGeometry, CatmullRomCurve3, LatheGeometry, Matrix4, SphereGeometry, Vector2, Vector3 } from 'three';

/**
 * QA 2026-11-24 row 11 (J510, Jake: "it needs to be a proper 3D model ... i dont want any fukcing images"): the held
 * bullwhip as real geometry, built in code and lit like the rest of the kit. No scan, no painted texture, no plait tile:
 * the braid is three strands of tube plaited round the thong's line, the handle's overlay is a crossing lattice of strand
 * tubes, and the gloved fist is a palm, four curled fingers, a thumb and a cuff. Colour is per vertex.
 *
 * Every length is in metres in the hold's frame (the `grip` group; the eye sits at `-WHIP_VIEW.hold.hero`).
 */

type V3 = readonly [number, number, number];
type Rgb = readonly [number, number, number];

/** The model's rows: where the fist sits, the handle's line, the glove, the braid and the coil it holds. */
export interface WhipModelRow {
  /** the fist's centre on the handle, and the handle's direction (butt to keeper, normalised by the builder) */
  readonly fist: V3; readonly axis: V3;
  /** toward the wrist from the handle (made square to the axis by the builder) */
  readonly wrist: V3;
  /** the handle: length below and above the fist, radius at butt and keeper, the knob's radius */
  readonly handle: { readonly below: number; readonly above: number; readonly radius: readonly [number, number]; readonly knob: number; readonly strands: number; readonly strand: number };
  /** the glove: finger tube radius, the palm's half sizes (along the handle, toward the wrist, its thickness), the cuff */
  readonly glove: { readonly finger: number; readonly palm: V3; readonly cuff: { readonly length: number; readonly radius: readonly [number, number]; readonly forearm: V3 } };
  /** the plaited thong: its radius at the keeper and at the end, each strand's share of it, plaits per metre */
  readonly thong: { readonly radius: readonly [number, number]; readonly strand: number; readonly twist: number };
  /** the coil in the fist's frame (u along the handle, v toward the wrist, n the back of the hand): loops' centre, radii, turns, tilt, the fall */
  readonly coil: { readonly centre: V3; readonly radius: readonly [number, number]; readonly turns: number; readonly tilt: number; readonly yaw: number; readonly fall: readonly V3[] };
  /** the whole model's size about the fist (1 = the lengths above, a man's hand) */
  readonly scale: number;
  readonly colours: { readonly glove: Rgb; readonly seam: Rgb; readonly handleA: Rgb; readonly handleB: Rgb; readonly knob: Rgb; readonly thongA: Rgb; readonly thongB: Rgb; readonly thongC: Rgb };
}

/** Dark worn glove, a tan and saddle-brown braided handle, a black-brown knob, the thong in three browns. */
export const WHIP_MODEL: WhipModelRow = {
  fist: [-0.01, -0.035, 0.055], axis: [-0.3, 0.82, -0.48], wrist: [0.25, -0.45, 0.85], scale: 0.62,
  handle: { below: 0.055, above: 0.17, radius: [0.0145, 0.0115], knob: 0.019, strands: 8, strand: 0.0032 },
  glove: { finger: 0.0116, palm: [0.044, 0.04, 0.019], cuff: { length: 0.42, radius: [0.03, 0.047], forearm: [0.38, -0.55, 0.74] } },
  thong: { radius: [0.0095, 0.005], strand: 0.56, twist: 130 },
  coil: { centre: [-0.035, -0.1, -0.01], radius: [0.085, 0.072], turns: 2.3, tilt: 0.8, yaw: 0.45, fall: [[-0.02, -0.26, 0.0], [-0.01, -0.42, 0.02]] },
  colours: {
    glove: [0.085, 0.04, 0.018], seam: [0.04, 0.018, 0.008],
    handleA: [0.32, 0.165, 0.068], handleB: [0.13, 0.06, 0.025], knob: [0.06, 0.028, 0.012],
    thongA: [0.22, 0.1, 0.038], thongB: [0.095, 0.042, 0.016], thongC: [0.15, 0.068, 0.027],
  },
};

/** A tube along `points` with a radius per point and a colour per ring, framed by parallel transport (no twist flips). */
export function taperTube(points: readonly Vector3[], radii: readonly number[], radial: number, colour: (ring: number, side: number) => Rgb, caps = true): BufferGeometry {
  const n = points.length, pos: number[] = [], nor: number[] = [], col: number[] = [], index: number[] = [];
  const tangents = points.map((p, i) => (points[Math.min(n - 1, i + 1)] ?? p).clone().sub(points[Math.max(0, i - 1)] ?? p).normalize());
  const t0 = tangents[0] ?? new Vector3(0, 1, 0);
  let normal = Math.abs(t0.y) < 0.9 ? new Vector3(0, 1, 0).cross(t0).normalize() : new Vector3(1, 0, 0).cross(t0).normalize();
  for (let i = 0; i < n; i++) {
    const t = tangents[i] ?? t0, p = points[i] ?? new Vector3(), r = radii[i] ?? radii[radii.length - 1] ?? 0.01;
    normal = normal.clone().sub(t.clone().multiplyScalar(normal.dot(t))).normalize();
    const binormal = t.clone().cross(normal).normalize();
    for (let j = 0; j < radial; j++) {
      const a = (j / radial) * Math.PI * 2, d = normal.clone().multiplyScalar(Math.cos(a)).add(binormal.clone().multiplyScalar(Math.sin(a)));
      pos.push(p.x + d.x * r, p.y + d.y * r, p.z + d.z * r); nor.push(d.x, d.y, d.z);
      const c = colour(i, j); col.push(c[0], c[1], c[2]);
    }
  }
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < radial; j++) {
    const a = i * radial + j, b = i * radial + (j + 1) % radial, c = a + radial, d = b + radial;
    index.push(a, b, c, b, d, c);
  }
  if (caps) for (const [ring, sign] of [[0, -1], [n - 1, 1]] as const) {
    const p = points[ring] ?? new Vector3(), t = (tangents[ring] ?? t0).clone().multiplyScalar(sign), centre = pos.length / 3, c = colour(ring, 0);
    pos.push(p.x, p.y, p.z); nor.push(t.x, t.y, t.z); col.push(c[0], c[1], c[2]);
    for (let j = 0; j < radial; j++) {
      const a = ring * radial + j, b = ring * radial + (j + 1) % radial;
      if (sign < 0) index.push(centre, b, a); else index.push(centre, a, b);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute('normal', new BufferAttribute(new Float32Array(nor), 3));
  g.setAttribute('color', new BufferAttribute(new Float32Array(col), 3));
  g.setIndex(index);
  return g;
}

/** One colour over a whole geometry (a sphere, a lathe), dropping its uvs. */
function painted(g: BufferGeometry, c: Rgb, shade?: (p: Vector3) => number): BufferGeometry {
  const out = new BufferGeometry(), p = g.getAttribute('position'), colours = new Float32Array(p.count * 3), v = new Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const k = shade?.(v) ?? 1; colours[i * 3] = c[0] * k; colours[i * 3 + 1] = c[1] * k; colours[i * 3 + 2] = c[2] * k; }
  out.setAttribute('position', p.clone()); out.setAttribute('normal', g.getAttribute('normal').clone());
  out.setAttribute('color', new BufferAttribute(colours, 3));
  const index = g.getIndex(); if (index !== null) out.setIndex(index.clone());
  return out;
}

/** Indexed geometries with position, normal and colour, as one. */
export function mergeParts(parts: readonly BufferGeometry[]): BufferGeometry {
  const pos: number[] = [], nor: number[] = [], col: number[] = [], index: number[] = [];
  for (const g of parts) {
    const base = pos.length / 3, p = g.getAttribute('position'), nn = g.getAttribute('normal'), c = g.getAttribute('color'), ix = g.getIndex();
    for (let i = 0; i < p.count; i++) { pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(nn.getX(i), nn.getY(i), nn.getZ(i)); col.push(c.getX(i), c.getY(i), c.getZ(i)); }
    if (ix === null) for (let i = 0; i < p.count; i++) index.push(base + i); else for (let i = 0; i < ix.count; i++) index.push(base + ix.getX(i));
  }
  const out = new BufferGeometry();
  out.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  out.setAttribute('normal', new BufferAttribute(new Float32Array(nor), 3));
  out.setAttribute('color', new BufferAttribute(new Float32Array(col), 3));
  out.setIndex(index);
  return out;
}

/** The fist's frame: `u` along the handle (butt to keeper), `v` toward the wrist, `n` out of the back of the hand. */
export function fistFrame(row: WhipModelRow = WHIP_MODEL): { o: Vector3; u: Vector3; v: Vector3; n: Vector3; at: (a: number, b: number, c: number) => Vector3 } {
  const o = new Vector3(...row.fist), u = new Vector3(...row.axis).normalize();
  const v = new Vector3(...row.wrist); v.sub(u.clone().multiplyScalar(v.dot(u))).normalize();
  const n = u.clone().cross(v).normalize();
  return { o, u, v, n, at: (a, b, c) => o.clone().add(u.clone().multiplyScalar(a)).add(v.clone().multiplyScalar(b)).add(n.clone().multiplyScalar(c)) };
}

/** Where the thong leaves the handle (the keeper at its top), in the hold's frame: the lash's `tip`. */
export function whipKeeper(row: WhipModelRow = WHIP_MODEL): [number, number, number] {
  return fistFrame(row).at(row.handle.above, 0, 0).toArray();
}

/** The handle: a core, a lattice of strands crossing round it, a knob at the butt, turk's-head rings at the fist and the keeper. */
function handleParts(row: WhipModelRow): BufferGeometry[] {
  const f = fistFrame(row), h = row.handle, c = row.colours, parts: BufferGeometry[] = [];
  const length = h.below + h.above, steps = 90, radius = (s: number): number => h.radius[0] + (h.radius[1] - h.radius[0]) * s;
  const line = (s: number): Vector3 => f.at(-h.below + s * length, 0, 0);
  // the core, dark under the lattice
  const core = Array.from({ length: 12 }, (_, i) => line(i / 11)), coreR = core.map((_, i) => radius(i / 11) * 0.86);
  parts.push(taperTube(core, coreR, 14, () => c.handleB));
  // the lattice: `strands` each way, leaning opposite, one turn every 9 cm
  for (let k = 0; k < h.strands * 2; k++) {
    const dir = k < h.strands ? 1 : -1, phase = (k % h.strands) / h.strands * Math.PI * 2, pts: Vector3[] = [], radii: number[] = [];
    for (let i = 0; i <= steps; i++) {
      const s = i / steps, a = phase + dir * s * length / 0.09 * Math.PI * 2, r = radius(s) * 0.9;
      pts.push(line(s).add(f.v.clone().multiplyScalar(Math.cos(a) * r)).add(f.n.clone().multiplyScalar(Math.sin(a) * r)));
      radii.push(h.strand);
    }
    parts.push(taperTube(pts, radii, 5, i => ((Math.floor(i / 10) + k) % 2 === 0 ? c.handleA : c.handleB), false));
  }
  // the knob: a lathe on the axis, below the butt
  const profile = [[0.0, 0], [0.012, 0.002], [0.019, 0.01], [0.02, 0.02], [0.016, 0.03], [0.0125, 0.038]].map(([r, y]) => new Vector2((r ?? 0) * h.knob / 0.02, (y ?? 0) - 0.038));
  const knob = painted(new LatheGeometry(profile, 16), c.knob, p => 0.85 + 0.6 * Math.max(0, -p.y / 0.04));
  knob.applyMatrix4(basis(f.u, f.v, f.n, f.at(-h.below, 0, 0)));
  parts.push(knob);
  // turk's-head rings: above the fist and at the keeper
  for (const [at, r] of [[0.06, radius((h.below + 0.06) / length) + 0.003], [h.above - 0.004, h.radius[1] + 0.0035]] as const) {
    const pts: Vector3[] = [];
    for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 2; pts.push(f.at(at + Math.sin(a * 3) * 0.003, Math.cos(a) * r, Math.sin(a) * r)); }
    parts.push(taperTube(pts, pts.map(() => 0.0034), 6, i => (i % 8 < 4 ? c.handleA : c.knob), false));
  }
  return parts;
}

/** Columns of `m` as a basis (x, y, z) placed at `at`: a lathe's +Y becomes `y`. */
function basis(x: Vector3, y: Vector3, z: Vector3, at: Vector3): Matrix4 {
  // the lathe stands on +Y: map +Y to the handle's axis, +X to the wrist side, +Z to the back of the hand
  return new Matrix4().makeBasis(y, x, z.clone().negate()).setPosition(at);
}

/** The gloved fist round the handle: palm block, four fingers curled round, knuckles, the thumb over them, the cuff. */
function gloveParts(row: WhipModelRow): BufferGeometry[] {
  const f = fistFrame(row), g = row.glove, c = row.colours, parts: BufferGeometry[] = [], wrap = row.handle.radius[0] + g.finger * 0.95;
  const sphere = (centre: Vector3, half: Vector3, axes: readonly [Vector3, Vector3, Vector3], colour: Rgb, segs = 14): BufferGeometry => {
    const s = painted(new SphereGeometry(1, segs, Math.round(segs * 0.7)), colour);
    const m = new Matrix4().makeBasis(axes[0].clone().multiplyScalar(half.x), axes[1].clone().multiplyScalar(half.y), axes[2].clone().multiplyScalar(half.z)).setPosition(centre);
    s.applyMatrix4(m); s.deleteAttribute('normal'); s.computeVertexNormals();
    return s;
  };
  // the palm and back of the hand, on the wrist side of the handle, its back toward n
  parts.push(sphere(f.at(0, wrap + g.palm[1] * 0.55, 0.004), new Vector3(g.palm[0], g.palm[1], g.palm[2]), [f.u, f.v, f.n], c.glove, 18));
  // four fingers, index at the top: each leaves the knuckle on the back (n), curls over the far side (-v), under the
  // front (-n) and tucks into the palm (+v); a little smaller toward the little finger
  const fingers = [0.032, 0.0105, -0.0105, -0.0305];
  fingers.forEach((u, k) => {
    const r = g.finger * (1 - k * 0.06), pts: Vector3[] = [];
    const start = Math.PI * 0.62, sweep = Math.PI * 1.55;
    for (let i = 0; i <= 26; i++) {
      const a = start + i / 26 * sweep, rr = wrap + (i > 20 ? (i - 20) * 0.0012 : 0);
      pts.push(f.at(u + Math.sin(i / 26 * Math.PI) * 0.002, Math.cos(a) * rr, Math.sin(a) * rr));
    }
    // the knuckle back to the palm's edge, so the finger grows from the hand
    pts.unshift(f.at(u, wrap * 0.55 + 0.012, wrap * 0.95), f.at(u * 0.92, wrap * 0.2 + 0.022, wrap * 0.9));
    const radii = pts.map((_, i) => r * (i < 2 ? 1.12 : 1 - 0.18 * (i / pts.length)));
    parts.push(taperTube(pts, radii, 10, (i, j) => (j === 5 && i > 3 ? c.seam : c.glove)));
    parts.push(sphere(f.at(u, wrap * 0.55 + 0.01, wrap * 0.98), new Vector3(r * 1.15, r * 1.05, r * 1.05), [f.u, f.v, f.n], c.glove, 10));
  });
  // the thumb: from the palm's front (-n) over the index finger's middle joint, along the handle toward the keeper
  const thumb = [f.at(0.006, wrap + 0.03, -0.012), f.at(0.03, wrap + 0.006, -wrap - 0.004), f.at(0.046, -0.004, -wrap - 0.006), f.at(0.054, -wrap * 0.6, -wrap * 0.75)];
  const curve = new CatmullRomCurve3(thumb, false, 'centripetal').getPoints(18);
  parts.push(taperTube(curve, curve.map((_, i) => g.finger * (1.3 - 0.4 * i / 18)), 10, () => c.glove));
  // the cuff: a flared leather tube from the palm's end toward the wrist (off frame), a seam ring at its mouth
  const wristAt = f.at(0, wrap + g.palm[1] * 0.85, 0.002), arm = new Vector3(...g.cuff.forearm).normalize();
  const cuffPts = Array.from({ length: 12 }, (_, i) => wristAt.clone().add(arm.clone().multiplyScalar(g.cuff.length * i / 11)));
  parts.push(taperTube(cuffPts, cuffPts.map((_, i) => (i === 0 ? g.cuff.radius[0] : i <= 3 ? g.cuff.radius[1] : g.cuff.radius[1] * 0.84)), 16, i => (i === 3 || i === 4 ? c.seam : c.glove), false));
  return parts;
}

/** The coil's centre line, in the hold's frame: from the keeper down the handle's far side into the fist, round the loops, then the fall. */
export function thongLine(row: WhipModelRow = WHIP_MODEL): Vector3[] {
  const f = fistFrame(row), k = row.coil, wrap = row.handle.radius[0] + row.glove.finger * 2;
  const pts: Vector3[] = [f.at(row.handle.above, 0, 0), f.at(row.handle.above - 0.02, -0.004, -0.012), f.at(0.06, -wrap * 0.3, -wrap - 0.004)];
  // the loops hang below the fist in the hold's own frame: their plane holds the vertical and a level line turned `yaw`
  // from the eye's right toward the eye, tipped `tilt` so the near side of each loop sits lower (QA 11-24 row 11)
  const centre = f.o.clone().add(new Vector3(...k.centre));
  const down = new Vector3(0, -1, 0), across = new Vector3(Math.cos(k.yaw), 0, Math.sin(k.yaw)), side = across.clone().cross(down).normalize();
  const steps = Math.round(48 * k.turns), top = f.at(-0.045, -wrap * 0.2, -wrap * 0.4);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps, a = Math.PI + t * Math.PI * 2 * k.turns, r = k.radius[0] + (k.radius[1] - k.radius[0]) * t;
    const p = centre.clone().add(down.clone().multiplyScalar(-Math.cos(a) * r)).add(across.clone().multiplyScalar(Math.sin(a) * r * k.tilt))
      .add(side.clone().multiplyScalar(t * 0.03 - 0.015 + Math.cos(a) * 0.012));
    const pull = Math.max(0, -Math.cos(a)) ** 6; // near the top of a loop, pinch into the fist
    pts.push(p.lerp(top, pull * 0.7));
  }
  // the fall: straight down from the last loop's foot, off the bottom of the frame
  for (const q of k.fall) pts.push(f.o.clone().add(new Vector3(...q)));
  return new CatmullRomCurve3(pts, false, 'centripetal').getSpacedPoints(Math.round(260 * k.turns));
}

/** Three strands plaited round a centre line: each a tube circling the line a third of a turn apart, its radius tapering. */
export function plaitedThong(line: readonly Vector3[], row: WhipModelRow = WHIP_MODEL): BufferGeometry {
  const n = line.length, th = row.thong, c = row.colours, strands: BufferGeometry[] = [];
  const tangents = line.map((p, i) => (line[Math.min(n - 1, i + 1)] ?? p).clone().sub(line[Math.max(0, i - 1)] ?? p).normalize());
  let normal = new Vector3(0, 1, 0).cross(tangents[0] ?? new Vector3(1, 0, 0)).normalize();
  const frames: { nrm: Vector3; bin: Vector3 }[] = [];
  for (let i = 0; i < n; i++) {
    const t = tangents[i] ?? new Vector3(1, 0, 0);
    normal = normal.clone().sub(t.clone().multiplyScalar(normal.dot(t))).normalize();
    frames.push({ nrm: normal, bin: t.clone().cross(normal).normalize() });
  }
  let along = 0; const dist = line.map((p, i) => (along += i === 0 ? 0 : p.distanceTo(line[i - 1] ?? p)));
  const total = along || 1;
  for (let k = 0; k < 3; k++) {
    const pts: Vector3[] = [], radii: number[] = [];
    for (let i = 0; i < n; i++) {
      const s = (dist[i] ?? 0) / total, R = th.radius[0] + (th.radius[1] - th.radius[0]) * s, fr = frames[i];
      const a = (dist[i] ?? 0) * th.twist * Math.PI * 2 / 3 + k * Math.PI * 2 / 3, off = R * (1 - th.strand) * 1.15;
      const p = (line[i] ?? new Vector3()).clone();
      if (fr !== undefined) p.add(fr.nrm.clone().multiplyScalar(Math.cos(a) * off)).add(fr.bin.clone().multiplyScalar(Math.sin(a) * off));
      pts.push(p); radii.push(R * th.strand);
    }
    const colour = [c.thongA, c.thongB, c.thongC][k] ?? c.thongA;
    strands.push(taperTube(pts, radii, 5, (i, j) => { const w = 0.86 + 0.14 * Math.cos(j / 5 * Math.PI * 2 - 1); const g = (i % 7 === 0 ? 0.8 : 1) * w; return [colour[0] * g, colour[1] * g, colour[2] * g]; }));
  }
  return mergeParts(strands);
}

/** The held whip's two meshes: `hand` (handle, knob, rings and the gloved fist, on the moving grip) and `loop` (the plaited coil, hidden while the lash is out). */
export function whipModel(row: WhipModelRow = WHIP_MODEL): { hand: BufferGeometry; loop: BufferGeometry; tip: [number, number, number] } {
  const o = new Vector3(...row.fist), size = new Matrix4().makeTranslation(o.x, o.y, o.z).multiply(new Matrix4().makeScale(row.scale, row.scale, row.scale)).multiply(new Matrix4().makeTranslation(-o.x, -o.y, -o.z));
  const hand = mergeParts([...handleParts(row), ...gloveParts(row)]).applyMatrix4(size), loop = plaitedThong(thongLine(row), row).applyMatrix4(size);
  return { hand, loop, tip: new Vector3(...whipKeeper(row)).applyMatrix4(size).toArray() };
}
