import stages from '../../data/bossStages.json' with { type: 'json' };
import { MATRIARCH_PRESENTATION } from './matriarchPresentation';
import { SIGNAL_MODULES, SIGNAL_SPECIES, SIGNAL_STRIKES, SIGNAL_PAGE_ROWS } from './brains';
import { SIGNAL_HEADLESS } from './headlessOwners';

/** Authored population policy, retaining preparation-time module admission and home order. */
const program: { species: typeof SIGNAL_SPECIES; strikes: typeof SIGNAL_STRIKES; modules: typeof SIGNAL_MODULES } = { species: SIGNAL_SPECIES, strikes: SIGNAL_STRIKES, modules: SIGNAL_MODULES };
export const SIGNAL_PAGE_PROGRAM: { readonly species: { readonly program: typeof program; readonly page: typeof SIGNAL_PAGE_ROWS }; readonly population: { readonly system: 'sunscar.creatures'; readonly witness: { readonly kinds: readonly ['duneRay', 'duneStrider'] } }; readonly inspect: { readonly actors: { readonly ray: { readonly home: 0 } }; readonly roster: 'creatures'; readonly boss: 'matriarch' }; readonly fight: { readonly id: typeof SIGNAL_HEADLESS.boss.row.id; readonly definition: typeof SIGNAL_HEADLESS.boss.definition; readonly stages: typeof stages; readonly profile: typeof SIGNAL_HEADLESS.boss.profile; readonly presentation: typeof MATRIARCH_PRESENTATION; readonly reward: typeof SIGNAL_HEADLESS.boss.reward; readonly record: { readonly kind: 'flags'; readonly actor: typeof SIGNAL_HEADLESS.boss.row.id; readonly names: typeof SIGNAL_HEADLESS.boss.record }; readonly victory: Readonly<Omit<typeof SIGNAL_HEADLESS.boss.victory, 'once'>> & { readonly once: false } } } = { species: { program, page: SIGNAL_PAGE_ROWS },
  population: { system: 'sunscar.creatures', witness: { kinds: ['duneRay', 'duneStrider'] } },
  inspect: { actors: { ray: { home: 0 } }, roster: 'creatures', boss: 'matriarch' },
  fight: { id: SIGNAL_HEADLESS.boss.row.id, definition: SIGNAL_HEADLESS.boss.definition, stages, profile: SIGNAL_HEADLESS.boss.profile,
    presentation: MATRIARCH_PRESENTATION, reward: SIGNAL_HEADLESS.boss.reward,
    record: { kind: 'flags', actor: SIGNAL_HEADLESS.boss.row.id, names: SIGNAL_HEADLESS.boss.record },
    victory: { ...SIGNAL_HEADLESS.boss.victory, once: false } },
} as const;
// ONE-FORMAT OF19b/OF19c1: the ray, the packs, the striders and the Matriarch are declared spawns (`declaredCreatures.ts`)
// and her fight a declared boss encounter, so the plan's keeper stands nothing: no home, no hold, no boss. The plan keeps
// its owner row, which names her declared spawn (engine OF20c/OF19c1: flag, fact, coins, record, marks and storm).
const { holds: _holds, rows: _rows, ...keeper } = SIGNAL_HEADLESS.homes;
const keeperProgram = { ...program, species: [] as typeof program.species };
export const SIGNAL_NATIVE_POPULATION: Readonly<typeof keeper> & { readonly program: typeof keeperProgram; readonly admission: 'prepare'; readonly homes: readonly never[] } = { program: keeperProgram, ...keeper, admission: 'prepare',
  homes: [] } as const;
