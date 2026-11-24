import * as SURFACES from './surfaces';
import { heldPlayback } from '../heldPlayback';

import { WHIP_ROW } from './equipment';
import { WHIP_PHASE } from './meleePhase';
import { WHIP_SCENE, WHIP_WRAP_SCENE } from './whip';

const playback: ReturnType<typeof heldPlayback> = heldPlayback();

const resources: { readonly reads: readonly []; readonly geometry: readonly [{ readonly id: "coil"; readonly from: { readonly owner: "world"; readonly path: readonly ["geometry"]; }; readonly args: readonly ["lash", "coil", { readonly index: "array"; }]; }, { readonly id: "loop"; readonly from: { readonly owner: "world"; readonly path: readonly ["geometry"]; }; readonly args: readonly ["lash", "loop", { readonly index: "array"; }]; }, { readonly id: "cord"; readonly from: { readonly owner: "world"; readonly path: readonly ["geometry"]; }; readonly args: readonly ["lash", "cord", { readonly index: "array"; }]; }, { readonly id: "wrap"; readonly from: { readonly owner: "world"; readonly path: readonly ["geometry"]; }; readonly args: readonly ["lash", "wrap", { readonly index: "array"; }]; }, { readonly id: "crack"; readonly from: { readonly owner: "world"; readonly path: readonly ["geometry"]; }; readonly args: readonly ["lash", "crack", { readonly index: "array"; }]; }, { readonly id: "hand"; readonly from: { readonly owner: "world"; readonly path: readonly ["geometry"]; }; readonly args: readonly ["lash", "hand", { readonly index: "array"; }]; }]; readonly objects: readonly []; readonly textures: readonly []; } = {reads:[],geometry:[
    {id:'coil',from:{owner:'world',path:['geometry']},args:['lash','coil',{index:'array'}]},
    {id:'loop',from:{owner:'world',path:['geometry']},args:['lash','loop',{index:'array'}]},
    {id:'cord',from:{owner:'world',path:['geometry']},args:['lash','cord',{index:'array'}]},
    {id:'wrap',from:{owner:'world',path:['geometry']},args:['lash','wrap',{index:'array'}]},
    {id:'crack',from:{owner:'world',path:['geometry']},args:['lash','crack',{index:'array'}]},
    {id:'hand',from:{owner:'world',path:['geometry']},args:['lash','hand',{index:'array'}]},
  ],objects:[],textures:[]} as const;
const decorators: readonly [{ readonly id: 'leather'; readonly from: { readonly owner: 'surface'; readonly path: readonly ['decorate'] }; readonly args: readonly [typeof SURFACES.HELD_LEATHER] }] = [{id:'leather',from:{owner:'surface',path:['decorate']},args:[SURFACES.HELD_LEATHER]}] as const;
const caught: { readonly row: typeof WHIP_WRAP_SCENE; readonly part: 'wrap' } = {row:WHIP_WRAP_SCENE,part:'wrap'} as const;
/** Original held rows, including the caller's exact baked lash dimensions. */
export interface WhipHeldRecipe {
  readonly equipment: typeof WHIP_ROW; readonly phases: typeof WHIP_PHASE; readonly playback: typeof playback; readonly scene: typeof WHIP_SCENE;
  readonly resources: typeof resources & { readonly repeats: readonly []; readonly decorators: typeof decorators };
  readonly tip: readonly [number, number, number]; readonly caught: typeof caught;
}
/** One held/Explorer assembly and caught-wrap recipe. */
export function whipHeldRecipe(dimensions: { readonly along: number; readonly tip: readonly number[] }): WhipHeldRecipe {
  return {equipment:WHIP_ROW,phases:WHIP_PHASE,playback,scene:WHIP_SCENE,
    resources:{...resources,repeats:[],decorators},
    tip:[dimensions.tip[0]??0,dimensions.tip[1]??0,dimensions.tip[2]??0],caught};
}
