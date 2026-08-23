import { renderSummaryMarkdown, summarizeCampaign } from './report.mjs';

const DETERMINISM_FIELDS = Object.freeze([
  'ticket_snapshot_digest',
  'replay_digest',
  'outcome',
  'scores',
  'turns',
]);

function normalize(value) {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, normalize(value[key])]));
  }
  return value;
}

function same(left, right) {
  return JSON.stringify(normalize(left)) === JSON.stringify(normalize(right));
}

function compareRerun(first, second) {
  const mismatchFields = DETERMINISM_FIELDS.filter((field) => !same(first[field], second[field]));
  return { identical: mismatchFields.length === 0, mismatch_fields: mismatchFields };
}

function validateSettings(settings) {
  if (!settings || typeof settings !== 'object') throw new Error('Campaign settings must be an object');
  if (typeof settings.campaign_id !== 'string' || settings.campaign_id.length === 0) {
    throw new Error('Campaign settings require campaign_id');
  }
  if (!Array.isArray(settings.setting_groups) || settings.setting_groups.length === 0) {
    throw new Error('Campaign settings require at least one setting group');
  }
  const ids = new Set();
  for (const group of settings.setting_groups) {
    if (!group.setting_group_id || ids.has(group.setting_group_id)) {
      throw new Error(`Duplicate or missing setting_group_id ${group.setting_group_id ?? ''}`);
    }
    ids.add(group.setting_group_id);
    if (!Array.isArray(group.seeds) || group.seeds.length === 0) {
      throw new Error(`${group.setting_group_id} requires at least one seed`);
    }
  }
}

export async function executeCampaign(settings, runOne) {
  validateSettings(settings);
  if (typeof runOne !== 'function') throw new Error('executeCampaign requires a runOne callback');

  const matches = [];
  const exceptions = new Map();
  for (const group of settings.setting_groups) {
    for (const seed of group.seeds) {
      const input = {
        campaign_id: settings.campaign_id,
        version_pins: structuredClone(settings.version_pins),
        setting_group: structuredClone(group),
        seed: String(seed),
      };
      const first = await runOne(structuredClone(input));
      const rerun = await runOne(structuredClone(input));
      const determinism = compareRerun(first, rerun);
      const row = { ...first, determinism };
      matches.push(row);
      if (row.classification !== 'SUCCEEDED' || !determinism.identical) {
        exceptions.set(`${row.match_id}.json`, {
          match_id: row.match_id,
          setting_group_id: row.setting_group_id,
          seed: row.seed,
          version_pins: settings.version_pins,
          classification: row.classification,
          first_run: first,
          identical_input_rerun: rerun,
          determinism,
        });
      }
    }
  }

  const summary = summarizeCampaign(settings, matches);
  return {
    matches,
    summary,
    summary_markdown: renderSummaryMarkdown(summary),
    exceptions,
  };
}

export function deterministicMismatchFields(first, second) {
  return compareRerun(first, second).mismatch_fields;
}
