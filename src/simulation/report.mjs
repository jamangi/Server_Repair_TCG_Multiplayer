function round(value, places = 2) {
  const factor = 10 ** places;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function percentile(sorted, fraction) {
  if (sorted.length === 0) return null;
  const index = Math.max(0, Math.ceil(fraction * sorted.length) - 1);
  return sorted[index];
}

export function turnDistribution(values) {
  const sorted = [...values].sort((left, right) => left - right);
  if (sorted.length === 0) {
    return { count: 0, minimum: null, median: null, p95: null, maximum: null, mean: null };
  }
  const midpoint = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 1
    ? sorted[midpoint]
    : (sorted[midpoint - 1] + sorted[midpoint]) / 2;
  return {
    count: sorted.length,
    minimum: sorted[0],
    median: round(median),
    p95: percentile(sorted, 0.95),
    maximum: sorted.at(-1),
    mean: round(sorted.reduce((sum, value) => sum + value, 0) / sorted.length),
  };
}

function emptyCounts() {
  return {
    requested: 0,
    started: 0,
    succeeded: 0,
    failed: 0,
    invalidated: 0,
    proven_stalemate: 0,
    simulation_cap: 0,
    policy_stall: 0,
    builder_unsatisfiable: 0,
    no_legal_progress_move: 0,
  };
}

function accumulateCounts(counts, match) {
  counts.requested += 1;
  if (match.started) counts.started += 1;
  if (match.classification === 'SUCCEEDED') counts.succeeded += 1;
  else counts.failed += 1;
  if (match.classification === 'INVALIDATED') counts.invalidated += 1;
  if (match.classification === 'PROVEN_STALEMATE') counts.proven_stalemate += 1;
  if (match.classification === 'SIMULATION_CAP') counts.simulation_cap += 1;
  if (match.classification === 'POLICY_STALL') counts.policy_stall += 1;
  if (match.classification === 'BUILDER_UNSATISFIABLE') counts.builder_unsatisfiable += 1;
  if (match.no_legal_progress_move) counts.no_legal_progress_move += 1;
}

function servicePointTotals(matches) {
  const participants = new Map();
  const teams = new Map();
  for (const match of matches) {
    for (const record of match.player_service_points ?? []) {
      const key = `${match.setting_group_id}:${record.player_id}`;
      const total = participants.get(key) ?? {
        setting_group_id: match.setting_group_id,
        player_id: record.player_id,
        matches: 0,
        starting: 0,
        final: 0,
        net: 0,
      };
      total.matches += 1;
      total.starting += record.starting;
      total.final += record.final;
      total.net += record.net;
      participants.set(key, total);
    }
    for (const record of match.team_service_points ?? []) {
      const key = `${match.setting_group_id}:${record.team_id}`;
      const total = teams.get(key) ?? {
        setting_group_id: match.setting_group_id,
        team_id: record.team_id,
        matches: 0,
        starting: 0,
        final: 0,
        net: 0,
      };
      total.matches += 1;
      total.starting += record.starting;
      total.final += record.final;
      total.net += record.net;
      teams.set(key, total);
    }
  }
  const compare = (left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right));
  return {
    players: [...participants.values()].sort(compare),
    teams: [...teams.values()].sort(compare),
    player_profiles: servicePointProfiles(matches, 'player_service_points', 'player_id'),
    team_profiles: servicePointProfiles(matches, 'team_service_points', 'team_id'),
  };
}

function servicePointProfiles(matches, field, identityField) {
  const profiles = new Map();
  for (const match of matches) {
    for (const record of match[field] ?? []) {
      const key = JSON.stringify([
        match.setting_group_id,
        record[identityField],
        record.starting,
        record.final,
        record.net,
      ]);
      const profile = profiles.get(key) ?? {
        setting_group_id: match.setting_group_id,
        [identityField]: record[identityField],
        starting: record.starting,
        final: record.final,
        net: record.net,
        seeds: [],
      };
      profile.seeds.push(match.seed);
      profiles.set(key, profile);
    }
  }
  return [...profiles.values()]
    .map((profile) => ({ ...profile, seeds: [...profile.seeds].sort() }))
    .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
}

function resultSeedGroups(matches) {
  const groups = new Map();
  for (const match of matches) {
    const reasonCodes = [...match.terminal_reason_codes].sort();
    const key = JSON.stringify([match.classification, reasonCodes]);
    const group = groups.get(key) ?? {
      classification: match.classification,
      terminal_reason_codes: reasonCodes,
      seeds: [],
    };
    group.seeds.push(match.seed);
    groups.set(key, group);
  }
  return [...groups.values()]
    .map((group) => ({ ...group, seeds: [...group.seeds].sort() }))
    .sort((left, right) => left.classification.localeCompare(right.classification)
      || JSON.stringify(left.terminal_reason_codes).localeCompare(JSON.stringify(right.terminal_reason_codes)));
}

export function summarizeCampaign(settings, matches) {
  const overall = emptyCounts();
  for (const match of matches) accumulateCounts(overall, match);

  const bySettingGroup = settings.setting_groups.map((group) => {
    const groupMatches = matches.filter((match) => match.setting_group_id === group.setting_group_id);
    const counts = emptyCounts();
    for (const match of groupMatches) accumulateCounts(counts, match);
    return {
      setting_group_id: group.setting_group_id,
      counts,
      turn_distribution: turnDistribution(groupMatches.filter((match) => match.started).map((match) => match.turns)),
      terminal_reasons: [...new Set(groupMatches.flatMap((match) => match.terminal_reason_codes))].sort(),
      seeds: groupMatches.map((match) => match.seed),
      results_by_seed: resultSeedGroups(groupMatches),
    };
  });

  const mismatchRows = matches
    .filter((match) => !match.determinism.identical)
    .map((match) => ({
      match_id: match.match_id,
      setting_group_id: match.setting_group_id,
      seed: match.seed,
      mismatch_fields: match.determinism.mismatch_fields,
    }));

  return {
    campaign_id: settings.campaign_id,
    generated_by: settings.harness_version,
    version_pins: settings.version_pins,
    overall,
    by_setting_group: bySettingGroup,
    overall_turn_distribution: turnDistribution(matches.filter((match) => match.started).map((match) => match.turns)),
    service_points: servicePointTotals(matches),
    progress_move_audit: {
      any_no_legal_progress_move: overall.no_legal_progress_move > 0,
      affected_match_ids: matches.filter((match) => match.no_legal_progress_move).map((match) => match.match_id),
      pass_is_always_legal_and_not_counted_as_progress: true,
    },
    determinism: {
      identical_input_reruns: matches.length,
      mismatches: mismatchRows.length,
      mismatch_rows: mismatchRows,
      compared_fields: ['ticket_snapshot_digest', 'replay_digest', 'outcome', 'scores', 'turns'],
    },
  };
}

export function renderSummaryMarkdown(summary) {
  const counts = summary.overall;
  const turns = summary.overall_turn_distribution;
  const lines = [
    `# ${summary.campaign_id} automated-game summary`,
    '',
    `This committed campaign requested **${counts.requested}** runs. **${counts.started}** matches started; **${counts.succeeded}** succeeded and **${counts.failed}** were retained as deliberate or unexpected exception cases.`,
    '',
    '## Outcomes',
    '',
    `- Invalidated: ${counts.invalidated}`,
    `- Proven stalemate: ${counts.proven_stalemate}`,
    `- Simulation cap: ${counts.simulation_cap}`,
    `- Policy stall: ${counts.policy_stall}`,
    `- Builder unsatisfiable before match start: ${counts.builder_unsatisfiable}`,
    `- No legal progress move (Pass excluded): ${counts.no_legal_progress_move}`,
    '',
    '## Turn distribution',
    '',
    `Across started matches: minimum ${turns.minimum}, median ${turns.median}, p95 ${turns.p95}, maximum ${turns.maximum}, mean ${turns.mean}. The p95 uses the nearest-rank definition.`,
    '',
    '| Setting group | Requested | Started | Succeeded | Failed | Min | Median | P95 | Max | Mean |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
  ];
  for (const group of summary.by_setting_group) {
    const distribution = group.turn_distribution;
    lines.push(`| ${group.setting_group_id} | ${group.counts.requested} | ${group.counts.started} | ${group.counts.succeeded} | ${group.counts.failed} | ${distribution.minimum ?? '—'} | ${distribution.median ?? '—'} | ${distribution.p95 ?? '—'} | ${distribution.maximum ?? '—'} | ${distribution.mean ?? '—'} |`);
  }
  lines.push(
    '',
    '## Results by setting and seed',
    '',
    '| Setting group | Classification | Terminal reasons | Seeds |',
    '| --- | --- | --- | --- |',
  );
  for (const group of summary.by_setting_group) {
    for (const result of group.results_by_seed) {
      lines.push(`| ${group.setting_group_id} | ${result.classification} | ${result.terminal_reason_codes.join(' + ') || '—'} | ${result.seeds.join(', ')} |`);
    }
  }
  lines.push(
    '',
    '## Service Points',
    '',
    'Rows with identical starting/final/net values are grouped by seed. Competitive Player scores and cooperative team scores are gameplay totals; cooperative Player rows remain attributable individual statistics.',
    '',
    '| Setting group | Scope | Participant | Start | Final | Net | Seeds |',
    '| --- | --- | --- | ---: | ---: | ---: | --- |',
  );
  for (const profile of summary.service_points.player_profiles) {
    lines.push(`| ${profile.setting_group_id} | Player | ${profile.player_id} | ${profile.starting} | ${profile.final} | ${profile.net} | ${profile.seeds.join(', ')} |`);
  }
  for (const profile of summary.service_points.team_profiles) {
    lines.push(`| ${profile.setting_group_id} | Team | ${profile.team_id} | ${profile.starting} | ${profile.final} | ${profile.net} | ${profile.seeds.join(', ')} |`);
  }
  lines.push(
    '',
    '## Reproducibility',
    '',
    `${summary.determinism.identical_input_reruns} identical-input reruns were compared across Ticket snapshots, replay digests, outcomes, scores, and turn counts. Mismatches: **${summary.determinism.mismatches}**.`,
    '',
    'Successful rows are reproducible from one setting-group reference plus their seed. Expanded files in `exceptions/` cover only Builder failure, invalidation, stalemate, policy stall, cap, nondeterminism, or another failed classification.',
  );
  return `${lines.join('\n')}\n`;
}
