// Independent original author leaves, never a copied product snapshot.
import {parseShardfileField} from '@wildshard/format/shardSchema';
import {SIGNAL_QUESTS} from '../../src/generators/quests.ts';
export function questSource(slug){return parseShardfileField('quests',SIGNAL_QUESTS);}
