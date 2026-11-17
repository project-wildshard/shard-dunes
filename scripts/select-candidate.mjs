// Ring 3 overrides the entire dependency graph, not only the direct edge.
// An empty input keeps the checked-in frozen install. Candidates are exact
// commit hashes, never executable shell fragments or moving branches.
import { readFileSync, writeFileSync } from 'node:fs';
const choices = [['engine', process.env.CANDIDATE_ENGINE], ['sharddev', process.env.CANDIDATE_SHARDDEV]];
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
for (const [name, sha] of choices) {
  if (!sha) continue;
  if (!/^[a-f0-9]{40}$/u.test(sha)) throw new Error(`${name}: candidate must be a full commit hash`);
  const spec = `github:project-wildshard/${name}#${sha}`;
  pkg.dependencies[`@wildshard/${name}`] = spec;
  pkg.pnpm ??= {}; pkg.pnpm.overrides ??= {};
  pkg.pnpm.overrides[`@wildshard/${name}`] = spec;
}
// Keep the candidate engine's declared schema dependency. A root format
// override belongs to the ordinary pinned graph and can hide required exports.
if (choices[0][1]) delete pkg.pnpm.overrides['@wildshard/format'];
if (choices.some(([, value]) => value)) writeFileSync('package.json', `${JSON.stringify(pkg, null, 2)}\n`);
