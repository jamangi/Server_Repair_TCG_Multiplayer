import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function filesBelow(relativeDirectory, extension) {
  const directory = path.join(repositoryRoot, relativeDirectory);
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = path.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) return filesBelow(relativePath, extension);
    return entry.isFile() && entry.name.endsWith(extension) ? [relativePath] : [];
  });
}

const taskDocuments = [
  'README.md',
  ...fs.readdirSync(path.join(repositoryRoot, 'docs/design'))
    .filter((name) => name.endsWith('.md'))
    .map((name) => path.join('docs/design', name)),
  'docs/design/decisions/DECISION_INDEX.md',
  'docs/design/decisions/FROZEN_RULES.md',
  'docs/design/decisions/UNFROZEN_RULES.md',
  ...filesBelow('docs/schema-notes', '.md'),
  ...filesBelow('docs/candidate_flows', '.md'),
  ...filesBelow('docs/story', '.md'),
  ...filesBelow('docs/ui-plan', '.md'),
  'docs/tasks/INDEX.md',
  'docs/tasks/TASK-007-synchronize-approved-gameplay-rules.md',
];

function githubSlug(value) {
  return value
    .replace(/!??\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/[`*_~]/g, '')
    .trim()
    .toLocaleLowerCase('en-US')
    .replace(/[^\p{Letter}\p{Number}\p{Mark}\s_-]/gu, '')
    .replace(/\s/g, '-');
}

function markdownAnchors(source) {
  const anchors = new Set();
  for (const match of source.matchAll(/<a\s+(?:[^>]*?\s)?id=["']([^"']+)["'][^>]*>/gi)) {
    anchors.add(match[1]);
  }

  const slugCounts = new Map();
  for (const line of source.split(/\r?\n/)) {
    const heading = /^(?: {0,3})#{1,6}\s+(.+?)\s*#*\s*$/.exec(line);
    if (!heading) continue;
    const base = githubSlug(heading[1]);
    const count = slugCounts.get(base) ?? 0;
    slugCounts.set(base, count + 1);
    anchors.add(count === 0 ? base : `${base}-${count}`);
  }
  return anchors;
}

function markdownTargets(source) {
  const targets = [];
  for (const match of source.matchAll(/!?\[[^\]]*\]\((<[^>]+>|[^\s)]+)(?:\s+["'][^)]*["'])?\)/g)) {
    targets.push(match[1]);
  }
  for (const match of source.matchAll(/^\s*\[[^\]]+\]:\s*(<[^>]+>|\S+)/gm)) {
    targets.push(match[1]);
  }
  return targets;
}

test('TASK-007 repository-relative Markdown links and fragments resolve', (t) => {
  const uniqueDocuments = [...new Set(taskDocuments)].sort();
  let localLinkCount = 0;
  let fragmentCount = 0;

  for (const relativePath of uniqueDocuments) {
    const sourcePath = path.join(repositoryRoot, relativePath);
    assert.ok(fs.existsSync(sourcePath), `${relativePath} exists`);
    const source = fs.readFileSync(sourcePath, 'utf8');

    for (let rawTarget of markdownTargets(source)) {
      rawTarget = rawTarget.replace(/^<|>$/g, '');
      if (/^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(rawTarget)) continue;

      const hashIndex = rawTarget.indexOf('#');
      const rawFile = hashIndex === -1 ? rawTarget : rawTarget.slice(0, hashIndex);
      const rawFragment = hashIndex === -1 ? '' : rawTarget.slice(hashIndex + 1);
      const decodedFile = decodeURIComponent(rawFile.split('?')[0]);
      const targetPath = decodedFile
        ? path.resolve(path.dirname(sourcePath), decodedFile)
        : sourcePath;

      localLinkCount += 1;
      assert.ok(fs.existsSync(targetPath), `${relativePath} -> ${rawTarget}`);

      if (rawFragment) {
        fragmentCount += 1;
        const fragment = decodeURIComponent(rawFragment);
        const targetSource = fs.readFileSync(targetPath, 'utf8');
        assert.ok(markdownAnchors(targetSource).has(fragment), `${relativePath} -> ${rawTarget}`);
      }
    }
  }

  assert.ok(localLinkCount >= 150, `expected broad local-link coverage, found ${localLinkCount}`);
  assert.ok(fragmentCount >= 25, `expected fragment coverage, found ${fragmentCount}`);
  t.diagnostic(`${localLinkCount} local paths and ${fragmentCount} fragments resolved`);
});

test('candidate replays retain six zero-Action, non-scoring closures and reconciled final ledgers', () => {
  const replay = fs.readFileSync(
    path.join(repositoryRoot, 'docs/candidate_flows/v0.0_ex1_cards_gameplay_examples.md'),
    'utf8',
  );
  const closureLines = replay.split(/\r?\n/).filter((line) => line.includes('Immediate Document Close window'));
  assert.equal(closureLines.length, 6);
  assert.ok(closureLines.every((line) => /cost 0/i.test(line)));
  assert.ok(closureLines.every((line) => /statistics only|closer statistic/i.test(line)));
  assert.ok(closureLines.every((line) => /no point|awards no/i.test(line)));

  for (const requiredAudit of [
    '6 + 17 + 7 = 30',
    '3 + 18 + 9 = 30',
    '8 + 18 + 4 = 30',
    '5 + 18 + 7 = 30',
    'All three Tickets are closed.',
    'Exactly three Tickets close.',
    'Worklog order is G1-W01 through G1-W27.',
    'Worklog order is G2-W01 through G2-W21.',
    '12 + 4 = 16; 13 + 1 = 14',
    '6 + 8 = 14; 11 + 3 = 14',
    '3 + 1 + 1 + 1, capped = 5',
    'Each game settles six causal-contribution points across exactly three closes',
    'A 3 / B 3',
  ]) {
    assert.ok(replay.includes(requiredAudit), requiredAudit);
  }

  const decisions = fs.readFileSync(
    path.join(repositoryRoot, 'docs/candidate_flows/v0.0_ex1_decisions.md'),
    'utf8',
  );
  assert.doesNotMatch(decisions, /CANDIDATE_DECISIONS\.md#(?:hyp|tst|iso|rep|doc|obs|cross)-/i);
  assert.doesNotMatch(decisions, /FUTURE-SYNC-/);
  assert.match(decisions, /not\s+(?:<code>)?SCORE-001/i);
  assert.match(decisions, /zero-Action, non-scoring/i);

  const candidatePackage = filesBelow('docs/candidate_flows', '.md')
    .map((relativePath) => fs.readFileSync(path.join(repositoryRoot, relativePath), 'utf8'))
    .join('\n');
  assert.doesNotMatch(candidatePackage, /Current runtime schemas do not yet represent/i);
  assert.doesNotMatch(candidatePackage, /known migration subjects rather than present contracts/i);
  assert.doesNotMatch(candidatePackage, /SelectDeck\(campaign,\s*deckId,\s*variantId/i);
  assert.match(candidatePackage, /TASK-007 supplies generic runtime contracts/i);
  assert.match(candidatePackage, /Deterministic replay variants are not deck-construction state/i);
});

test('account Equipment is absent and Qualifications remain honor-only in synchronized surfaces', () => {
  const candidateText = filesBelow('docs/candidate_flows', '.md')
    .map((relativePath) => fs.readFileSync(path.join(repositoryRoot, relativePath), 'utf8'))
    .join('\n');
  const storyUiText = [
    ...filesBelow('docs/story', '.md'),
    ...filesBelow('docs/ui-plan', '.md'),
    ...filesBelow('docs/ui-plan/wireframes', '.svg'),
  ].map((relativePath) => fs.readFileSync(path.join(repositoryRoot, relativePath), 'utf8')).join('\n');
  const wireframeText = filesBelow('docs/ui-plan/wireframes', '.svg')
    .map((relativePath) => fs.readFileSync(path.join(repositoryRoot, relativePath), 'utf8'))
    .join('\n');

  for (const forbidden of [
    /EX1-EQUIP-/i,
    /Installed Equipment/i,
    /Equipment Store/i,
    /Ready Equipment/i,
    /Equipment compatibility/i,
    /CURRENT LOADOUT/i,
  ]) {
    assert.doesNotMatch(candidateText, forbidden);
    assert.doesNotMatch(storyUiText, forbidden);
  }
  assert.doesNotMatch(wireframeText, /Ability slots?/i);

  assert.match(candidateText, /Qualifications are recognition-only honor badges/i);
  assert.match(storyUiText, /Qualifications?[^\n]{0,100}honor/i);
  assert.match(candidateText, /Quiet Cascade[^\n]{0,100}(?:remains|remain)[^\n]{0,30}unresolved/i);
});
