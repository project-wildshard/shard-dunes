import * as LAYOUT from '../layout';
import { MATRIARCH_BOSS_PROFILE } from './matriarchBoss';
import STRINGS from '../../data/strings.json' with { type: 'json' };
import { MATRIARCH_DEFEATED_FLAG, MATRIARCH_PAID_FLAG } from './signalQuest';
import { signalHeightAt } from '../landscape';

/** The declared boss, encounter and saved actor share this stable identity. */
export const MATRIARCH_ID = 'sunscar.matriarch';
/** Coins paid once, on her first fall, through the carried paid flag. */
export const MATRIARCH_REWARD = 20;
/** The encounter's intro and three native health checkpoints, with their authored captions. */
export const MATRIARCH_DEFINITION: { id: string; name: string; title: string; retryTitle: string; intro: number; introShort: number; phases: { at: number; caption: string; name: string; }[]; reward: NonNullable<unknown>; } = { id: MATRIARCH_ID, name: STRINGS.matriarch, title: STRINGS.matriarchTitle, retryTitle: STRINGS.retry,
  intro: MATRIARCH_BOSS_PROFILE.fight.riseSeconds + 0.6, introShort: 1.2,
  phases: [{ at: 1, caption: STRINGS.phaseDives, name: STRINGS.phaseDives }, { at: 0.66, caption: STRINGS.phaseStorm, name: STRINGS.phaseStorm },
    { at: 0.33, caption: STRINGS.phaseGrounded, name: STRINGS.phaseGrounded }], reward: {} };
/** Current-save defeated and paid flags used by both native encounter owners. */
export const MATRIARCH_RECORD: { readonly defeated: "sunscar.matriarch.defeated"; readonly paid: "sunscar.matriarch.paid"; } = { defeated: MATRIARCH_DEFEATED_FLAG, paid: MATRIARCH_PAID_FLAG } as const;

/** The native arena floor and death return at the south rim, shared by both fight owners. */
export const MATRIARCH_ARENA: { floor: number; respawn: { x: number; z: number; yaw: number; }; } = { floor: 0.8, respawn: { x: LAYOUT.BASIN.x, z: LAYOUT.BASIN.z + LAYOUT.BASIN.r + 4, yaw: 0 } };

const heightAt = signalHeightAt();
/** Her boss bar: the declared ui panel the page mounts off her encounter's wire row. */
export const MATRIARCH_PANEL: { kind: 'bossPanel'; id: string; encounter: string; name: string; title: string; retry: string } = {
  kind: 'bossPanel', id: `${MATRIARCH_ID}.panel`, encounter: MATRIARCH_ID, name: MATRIARCH_DEFINITION.name, title: MATRIARCH_DEFINITION.title, retry: MATRIARCH_DEFINITION.retryTitle };
/**
 * ONE-FORMAT OF19c1: the Dune Matriarch's declared boss encounter. Spawned: she is out of the world until a player enters the
 * basin's arena once the quest's lit stage summons her (`signalStages`' `{ spawn }`); her three phases are the native
 * checkpoints at full, 0.66 and 0.33 of her health with their captions, standing still (speed 0) because her decision row
 * (`sim/scripts`, bound to this encounter) flies her. A death returns the player to the south rim. The plan's owner row
 * names her spawn, so this fight files its flag and fact, pays its 20 coins as a claim and keeps its record flags, and its
 * spawned profile keeps her marks and storm (engine OF19c1).
 */
export const MATRIARCH_ENCOUNTER: { id: string; entity: string; kind: 'boss'; panel: string; name: string; title: string; retry: string; start: 'spawned'; capExempt: true;
  arena: { at: [number, number, number]; radius: number }; intro: number; introShort: number; respawn: { at: [number, number, number]; yaw: number };
  phases: { at: number; name: string; caption: string; speed: number; stopDistance: number; turnRate: number }[] } = {
  id: MATRIARCH_ID, entity: MATRIARCH_ID, kind: 'boss', panel: MATRIARCH_PANEL.id, name: MATRIARCH_DEFINITION.name, title: MATRIARCH_DEFINITION.title,
  retry: MATRIARCH_DEFINITION.retryTitle, start: 'spawned', capExempt: true,
  arena: { at: [LAYOUT.BASIN.x, heightAt(LAYOUT.BASIN.x, LAYOUT.BASIN.z), LAYOUT.BASIN.z], radius: MATRIARCH_BOSS_PROFILE.fight.arena.r },
  intro: MATRIARCH_DEFINITION.intro, introShort: MATRIARCH_DEFINITION.introShort,
  respawn: { at: [MATRIARCH_ARENA.respawn.x, heightAt(MATRIARCH_ARENA.respawn.x, MATRIARCH_ARENA.respawn.z), MATRIARCH_ARENA.respawn.z], yaw: MATRIARCH_ARENA.respawn.yaw },
  phases: MATRIARCH_DEFINITION.phases.map(phase => ({ at: phase.at, name: phase.name, caption: phase.caption, speed: 0, stopDistance: 0, turnRate: 0 })),
};
