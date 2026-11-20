import { programSpawnPhase, speciesProgramToRows, type ConvertedSpecies } from '@wildshard/sharddev/species/toRows';
import rows from '../../data/physicsRows.json' with { type: 'json' };
import { signalHeightAt } from '../landscape';
import { SIGNAL_PHYSICS } from '../physics';
import { SIGNAL_SPECIES, SIGNAL_STRIKES } from './brains';
import { SIGNAL_OWNER_ROWS } from './hostOwners';
import { SIGNAL_SPAWNS } from './spawns';
import { MAW_DATA, TAIL_SWEEP_DATA, BUFFET_DATA } from './species/matriarch';
import type { StrikeData } from '@wildshard/sharddev/species';
import * as LAYOUT from '../layout';

/** A decision strike as a species ability, as `speciesProgramToRows` writes one. */
function ability(strike: StrikeData): { use: string; range: number; cooldown: number; weight: number; damage: number; windup: number } {
  return { use: strike.id, range: strike.range ?? 0, cooldown: strike.cooldown, weight: strike.weight.kind === 'constant' ? strike.weight.value : 1,
    damage: strike.damage, windup: strike.windup };
}

// ONE-FORMAT OF19b: the dune's creatures are rows. The ray, the skitterer packs and the striders leave the runtime plan's
// keeper for declared spawns the engine's declared host runs beside it (OF19b0); the Matriarch stays the keeper's boss
// until OF19c. `speciesProgramToRows` turns the program into species, brains and plain strikes (the exact strikes stay in
// `actors/strikes`); each home becomes a spawn with its respawn, the keeper's scale and circle phase; the skitterers name
// their decision row's spawn group (format 0.46.2), and the first ray keeps its hold until the scout (format 0.47.0).

type Kind = keyof typeof rows.species;
// OF19c1: the Matriarch's species joins them; her decision row (`sim/scripts`) is her declared boss encounter's
const MATRIARCH_KIND = 'duneMatriarch';
const homeKinds = new Set<string>([...SIGNAL_SPAWNS.homes.map(home => home.kind), MATRIARCH_KIND]);
const program = { species: SIGNAL_SPECIES.filter(row => homeKinds.has(row.kind)), strikes: SIGNAL_STRIKES };
const looks = new Map(program.species.map(row => [row.kind, { look: `sunscar.look.${row.kind}`, dims: rows.species[row.kind as Kind].spec.dims }] as const));
/** The home kinds' rows: species with their layers, the brains they name and the plain strikes. */
const converted = speciesProgramToRows(program, looks);
/** Her decision strikes all three (the dive's maw, the grounded tail sweep and buffet), so all three are her abilities; the
 *  maw aims 1.2 m up the player as the keeper's strike effect did (format 0.49.0 ability `aimHeight`). */
const MATRIARCH_ABILITIES = [{ ...ability(MAW_DATA), aimHeight: 1.2 }, ability(TAIL_SWEEP_DATA), ability(BUFFET_DATA)];
export const SIGNAL_DECLARED_ROWS: ConvertedSpecies = { ...converted,
  species: converted.species.map(row => row.kind === MATRIARCH_KIND ? Object.assign(structuredClone(row), { abilities: MATRIARCH_ABILITIES }) : row) };

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

const matriarch = SIGNAL_SPAWNS.bosses[0], matriarchSpecies = SIGNAL_DECLARED_ROWS.species.find(row => row.kind === MATRIARCH_KIND);
if (matriarch === undefined || matriarchSpecies === undefined) throw new Error('Missing declared Dune Matriarch');
/** OF19c1: the Dune Matriarch is a declared spawn in the basin, out of the world until her declared boss encounter's fight
 *  begins (`start: 'spawned'`); no brain (her encounter's decision row flies her) and no respawn (her fight brings her back). */
export const MATRIARCH_SPAWN = { id: matriarch.id, species: matriarchSpecies.id, variant: matriarchSpecies.variants[0]?.id ?? 'matriarch', brain: null, strike: null,
  seed: SIGNAL_SPAWNS.homes.length + 1, scale: 3.6, at: [matriarch.at[0], heightAt(matriarch.at[0], matriarch.at[1]), matriarch.at[1]] as [number, number, number], yaw: matriarch.yaw };
/** Her declared spawn's ground: below it (plus a margin) her decision rises before it circles. */
export const MATRIARCH_GROUND = heightAt(LAYOUT.BASIN.x, LAYOUT.BASIN.z);
