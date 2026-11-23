import { ClientChannels } from '@wildshard/sdk/clientChannels';
import { LASH_CORD, WHIP_VIEW, type Keys } from './rows/whip';

/**
 * The held whip's playback groups on the lash weapon's delayed phase (engine `HeldMeleeWeapon`): `root` (the view spring
 * and the holster), `active` (the fist's stroke), `rest` (the fist home, the crack hidden) and `cord` (the thrown lash and
 * its crack). QA 11-23-b row 13 rebuilt the stroke: one phase `p` runs 0 to 1 while the lash unrolls to the 0.12 s land
 * (`ext`) and 1 to 2 while it falls slack (`slack`); every pose is a key on it. The contact clock is the weapon's own.
 */
export function heldPlayback(): Record<string, ReturnType<ClientChannels['build']>[]> {
  const stroke = WHIP_VIEW.stroke, hold = WHIP_VIEW.hold.hero;
  const root = new ClientChannels('lash.root');
  root.output('yaw', root.read('spring')); root.bind('yaw', 'root');
  root.output('visible', root.binary('gt', root.constant(0.5), root.read('holster'))); root.bind('visible', 'root');

  // The fist: each pose key on p, bigger on a heavy (its 8 m reach), eased so the heavy's second crack re-cocks smoothly.
  const grip = new ClientChannels('lash.grip');
  const phase = grip.binary('add', grip.read('ext'), grip.read('slack'));
  const heavy = grip.binary('gt', grip.read('reach'), grip.constant(7.5));
  const gain = grip.binary('add', grip.constant(1), grip.binary('mul', heavy, grip.constant(stroke.hand.heavy - 1)));
  const k = grip.binary('min', grip.constant(1), grip.binary('mul', grip.clock('delta'), grip.constant(stroke.hand.ease)));
  const eased = (keys: Keys): number => {
    const target = grip.binary('mul', grip.sample(phase, keys, 'smoothstep'), gain), was = grip.local(0);
    const next = grip.binary('add', was, grip.binary('mul', grip.binary('sub', target, was), k));
    grip.retain(was, next); return next;
  };
  grip.output('x', grip.constant(0));
  grip.output('y', eased(stroke.hand.lift));
  grip.output('z', eased(stroke.hand.push));
  grip.output('pitch', eased(stroke.hand.pitch));
  grip.output('roll', eased(stroke.hand.roll));
  for (const property of ['x', 'y', 'z', 'pitch', 'roll'] as const) grip.bind(property, 'grip');

  const reset = new ClientChannels('lash.rest');
  for (const property of ['x', 'y', 'z', 'pitch', 'roll'] as const) { reset.output(property, reset.constant(0)); reset.bind(property, 'grip'); }
  reset.output('visible', reset.constant(0)); reset.bind('visible', 'crack');

  // The lash: from where it leaves the fist to its end, keyed on p in the eye's frame (the hold sits at `hold` from the
  // eye): up over the fist on the wind-up, rolling out flat to the crosshair at the land, then dropping and drawn back.
  const cord = new ClientChannels('lash.cord');
  const c = (n: number): number => cord.constant(n), read = (key: string): number => cord.read(key);
  const add = (a: number, b: number): number => cord.binary('add', a, b), sub = (a: number, b: number): number => cord.binary('sub', a, b);
  const mul = (a: number, b: number): number => cord.binary('mul', a, b), key = (p: number, keys: Keys): number => cord.sample(p, keys, 'smoothstep');
  const p = add(read('ext'), read('slack')), taut = read('taut'), reach = read('reach');
  const big = cord.binary('gt', reach, c(7.5));
  const fromX = add(read('tipX'), read('gripX')), fromY = add(read('tipY'), read('gripY')), fromZ = add(read('tipZ'), read('gripZ'));
  const toX = cord.select(taut, read('caughtX'), sub(key(p, stroke.right), read('modelX')));
  const toY = cord.select(taut, read('caughtY'), sub(key(p, stroke.up), read('modelY')));
  const toZ = cord.select(taut, read('caughtZ'), add(cord.unary('neg', mul(reach, key(p, stroke.far))), c(-hold[2])));
  const extent = cord.select(taut, c(1), cord.binary('max', c(0.02), cord.binary('min', c(1), key(p, stroke.extent))));
  const wave = cord.select(taut, c(WHIP_VIEW.flick.tautSag), mul(key(p, stroke.wave), add(c(1), mul(big, c(stroke.heavyWave - 1)))));
  const tube = WHIP_VIEW.tube;
  cord.deformTube({ kind: 'tubeCurve', target: 'cord', segments: LASH_CORD.segments, radial: LASH_CORD.radial,
    from: [fromX, fromY, fromZ], to: [toX, toY, toZ], extent, wave,
    bend: [...tube.bend], ripple: [...tube.ripple], drop: [...tube.drop], radius: [...tube.radius] });
  // The crack: a flash at the lash's end as it snaps straight (twice on a heavy), spun so its rays flicker.
  const size = mul(key(p, stroke.flash), add(c(1), mul(big, c(stroke.heavyFlash - 1))));
  const lit = mul(cord.binary('gt', size, c(0.01)), cord.binary('gt', c(0.5), taut));
  cord.output('x', add(fromX, mul(sub(toX, fromX), extent)));
  cord.output('y', add(fromY, mul(sub(toY, fromY), extent)));
  cord.output('z', add(fromZ, mul(sub(toZ, fromZ), extent)));
  cord.output('scaleX', size); cord.output('scaleY', size); cord.output('scaleZ', size);
  cord.output('yaw', mul(p, c(11))); cord.output('visible', lit);
  for (const property of ['x', 'y', 'z', 'scaleX', 'scaleY', 'scaleZ', 'yaw', 'visible'] as const) cord.bind(property, 'crack');
  return { root: [root.build()], active: [grip.build()], rest: [reset.build()], cord: [cord.build()] };
}
