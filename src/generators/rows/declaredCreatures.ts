import { programSpawnPhase, speciesProgramToRows, type ConvertedSpecies } from '@wildshard/sharddev/species/toRows';
import rows from '../../data/physicsRows.json' with { type: 'json' };
import { signalHeightAt } from '../landscape';
import { SIGNAL_PHYSICS } from '../physics';
import { SIGNAL_SPECIES, SIGNAL_STRIKES } from './brains';
import { SIGNAL_OWNER_ROWS } from './hostOwners';
import { SIGNAL_SPAWNS } from './spawns';

// ONE-FORMAT OF19b: the dune's creatures are rows. The ray, the skitterer packs and the striders leave the runtime plan's
// keeper for declared spawns the engine's declared host runs beside it (OF19b0); the Matriarch stays the keeper's boss
// until OF19c. `speciesProgramToRows` turns the program into species, brains and plain strikes (the exact strikes stay in
// `actors/strikes`); each home becomes a spawn with its respawn, the keeper's scale and circle phase; the skitterers name
// their decision row's spawn group (format 0.46.2), and the first ray keeps its hold until the scout (format 0.47.0).

type Kind = keyof typeof rows.species;
const homeKinds = new Set<string>(SIGNAL_SPAWNS.homes.map(home => home.kind));
const program = { species: SIGNAL_SPECIES.filter(row => homeKinds.has(row.kind)), strikes: SIGNAL_STRIKES };
const looks = new Map(program.species.map(row => [row.kind, { look: `sunscar.look.${row.kind}`, dims: rows.species[row.kind as Kind].spec.dims }] as const));
/** The home kinds' rows: species with their layers, the brains they name and the plain strikes. */
export const SIGNAL_DECLARED_ROWS: ConvertedSpecies = speciesProgramToRows(program, looks);

/** One look row per species, naming the shard's rig recipe; the page draws the bodies through its `species.program`
 *  feature until declared looks can name a rig library (the server never reads a look). */
export const SIGNAL_DECLARED_LOOKS = SIGNAL_DECLARED_ROWS.species.map(row => ({ id: `sunscar.look.${row.kind}`, species: row.id,
  recipe: 'sunscar.rig', material: null, parameters: {}, animation: { recipe: 'sunscar.clips', parameters: {} } }));

const SKITTERER_GROUP = 'sunscar.skitterers';
const keeperBodies = new Map((SIGNAL_PHYSICS['actors'] as { id: string; seed: number; scale: number }[]).map(row => [row.id, row]));
const heightAt = signalHeightAt();
/** Each home as a declared spawn, in authored order: the keeper's scale and circle phase, its respawn, its pack, its hold. */
export const SIGNAL_DECLARED_SPAWNS = SIGNAL_SPAWNS.homes.map((home, index) => {
  const brained = program.species.find(row => row.kind === home.kind), species = SIGNAL_DECLARED_ROWS.species.find(row => row.kind === home.kind);
  const body = keeperBodies.get(home.id), brain = species?.temperament?.brain;
  if (brained === undefined || species === undefined || body === undefined || brain === undefined) throw new Error(`Missing declared Signal home ${home.id}`);
  const phaseOffset = programSpawnPhase(brained.brain, body.seed);
  const hold = SIGNAL_OWNER_ROWS.homes.holds.find(row => row.home === index);
  const spawn: { id: string; species: string; variant: string; brain: string | null; strike: null; seed: number; scale: number;
    at: [number, number, number]; yaw: number; respawn: number; phaseOffset?: number; group?: string; hold?: { field: string; until: string } } = {
    id: home.id, species: species.id, variant: species.variants[0]?.id ?? 'dusk', brain: brain === 'none' ? null : brain, strike: null,
    seed: index + 1, scale: body.scale, at: [home.at[0], heightAt(home.at[0], home.at[1]), home.at[1]], yaw: home.yaw, respawn: home.respawn };
  if (phaseOffset !== undefined) spawn.phaseOffset = phaseOffset;
  if (brain === 'none') spawn.group = SKITTERER_GROUP;
  if (hold !== undefined) spawn.hold = { field: hold.field, until: hold.until };
  return spawn;
});
