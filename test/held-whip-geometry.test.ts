import { describe, expect, it } from 'vitest';
import { Box3, Vector3 } from 'three';
import { WHIP_SCENE } from '../src/generators/rows/whip';
import { whipModel, WHIP_MODEL } from '../src/generators/whipModel';

// QA 2026-11-24 row 11 (J510, Jake: "it needs to be a proper 3D model ... i dont want any fukcing images"): the held
// whip is code-built geometry. No scanned object, no texture maps standing in for its braid, and every part has depth.
describe('held whip is real geometry', () => {
  it('draws no loaded object and no textured material', () => {
    expect(WHIP_SCENE.nodes.filter(node => node.kind === 'object')).toEqual([]);
    expect(WHIP_SCENE.textures ?? []).toEqual([]);
    for (const material of WHIP_SCENE.materials) expect('maps' in material ? material.maps : undefined).toBeUndefined();
  });

  it('builds the hand and plaited coil with depth on every axis', () => {
    const model = whipModel();
    for (const geometry of [model.hand, model.loop]) {
      const size = new Box3().setFromBufferAttribute(geometry.getAttribute('position') as never).getSize(new Vector3());
      expect(Math.min(size.x, size.y, size.z)).toBeGreaterThan(0.03);
      expect(geometry.getAttribute('color').count).toBe(geometry.getAttribute('position').count);
    }
    // the coil's strands are round tubes: a ring's vertices sit a strand's radius from their centre in two directions
    const p = model.loop.getAttribute('position'), ring: Vector3[] = [];
    for (let j = 0; j < 5; j++) ring.push(new Vector3().fromBufferAttribute(p, 500 + j));
    const centre = ring.reduce((a, b) => a.add(b), new Vector3()).multiplyScalar(1 / ring.length);
    const radii = ring.map(v => v.distanceTo(centre));
    expect(Math.min(...radii) / Math.max(...radii)).toBeGreaterThan(0.8);
  });

  it('starts the thrown lash at the handle keeper', () => {
    const model = whipModel(), keeper = new Vector3(...model.tip), fist = new Vector3(...WHIP_MODEL.fist);
    expect(keeper.distanceTo(fist)).toBeCloseTo(WHIP_MODEL.handle.above * WHIP_MODEL.scale, 5);
  });
});
