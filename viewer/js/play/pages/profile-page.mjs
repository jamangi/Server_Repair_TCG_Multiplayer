import { bindResolvedImage } from '../art-resolver.mjs';
import { deriveLevel } from '../data/client-data.mjs';
import { cloneJson, escapeHtml, formatDuration, formatInteger, setInlineNotice } from '../dom-utils.mjs';

function stat(label, value, detail = '') {
  return `<div class="stat-tile"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd>${detail ? `<small>${escapeHtml(detail)}</small>` : ''}</div>`;
}

export function renderProfile(root, context) {
  const records = context.snapshot.state.records;
  const saved = records.profile;
  if (!context.ui.profileDraft || context.ui.profileSavedId !== `${saved.display_name}\0${saved.icon_id}`) {
    context.ui.profileDraft = cloneJson(saved);
    context.ui.profileSavedId = `${saved.display_name}\0${saved.icon_id}`;
    context.ui.profileDirty = false;
  }
  const draft = context.ui.profileDraft;
  const totals = records.statistics.totals;
  const level = deriveLevel(totals.lifetime_service_points_gained);
  const activeDeck = records.decks.decks.find((deck) => deck.deck_id === records.decks.active_deck_id) ?? null;
  const icons = context.artResolver.listProfileIcons();

  root.innerHTML = `
    <section class="play-route profile-route" aria-labelledby="profile-heading">
      <header class="play-page-heading" data-route-reveal>
        <div><p class="play-eyebrow">Local technician record</p><h1 id="profile-heading">Profile</h1><p>Appearance is cosmetic. Level and statistics derive from validated local Match results.</p></div>
        <span class="local-data-label">Local · user-controlled</span>
      </header>
      <div class="profile-grid">
        <section class="profile-identity" data-route-reveal>
          <div class="profile-identity__summary">
            <div class="profile-token profile-token--large"><img id="profile-selected-icon" width="160" height="160" alt=""></div>
            <div><p class="play-eyebrow">Level ${level}</p><h2>${escapeHtml(saved.display_name)}</h2><p>${formatInteger(totals.lifetime_service_points_gained)} lifetime Service Points</p><p>Active deck: <strong>${activeDeck ? escapeHtml(activeDeck.display_name) : 'None'}</strong></p></div>
          </div>
          <form id="profile-form">
            <label>Display name<input id="profile-name" maxlength="40" required value="${escapeHtml(draft.display_name)}"></label>
            <fieldset class="profile-icons"><legend>Profile icon</legend>${icons.map((icon) => `<button type="button" class="profile-icon-choice${draft.icon_id === icon.assetId ? ' is-selected' : ''}" data-icon-id="${escapeHtml(icon.assetId)}" aria-pressed="${draft.icon_id === icon.assetId}"><img width="96" height="96" alt=""><span>${escapeHtml(icon.label)}</span></button>`).join('')}</fieldset>
            <div class="button-row"><button class="play-button play-button--primary" type="submit"${context.ui.profileDirty ? '' : ' disabled'}>Save profile</button><span id="profile-unsaved" class="unsaved-indicator">${context.ui.profileDirty ? 'Unsaved changes' : 'Saved'}</span></div>
          </form>
          <p data-inline-notice class="inline-notice" hidden></p>
        </section>

        <section class="profile-statistics" aria-labelledby="statistics-heading" data-route-reveal>
          <div class="section-heading"><div><p class="play-eyebrow">Lifetime aggregates</p><h2 id="statistics-heading">Statistics</h2></div><span>Level ${level}</span></div>
          <section><h3>Matches</h3><dl class="stats-grid">${stat('Started', formatInteger(totals.matches_started))}${stat('Completed', formatInteger(totals.matches_completed))}${stat('Solo wins', formatInteger(totals.solo_wins))}${stat('Losses', formatInteger(totals.solo_losses))}${stat('Stalemates', formatInteger(totals.solo_stalemates))}${stat('Invalid / capped', formatInteger(totals.invalid_or_capped_results))}</dl></section>
          <section><h3>Troubleshooting</h3><dl class="stats-grid">${stat('Tickets closed', formatInteger(totals.tickets_closed))}${stat('Tests', formatInteger(totals.tests))}${stat('Repairs', formatInteger(totals.repairs))}${stat('Verify attempts', formatInteger(totals.verify_attempts))}${stat('Verify passes', formatInteger(totals.verify_passes))}${stat('Verify failures', formatInteger(totals.verify_failures))}${stat('Inconclusive', formatInteger(totals.verify_inconclusive_results))}</dl></section>
          <section><h3>Contributions</h3><dl class="stats-grid">${stat('Starting Service Points', formatInteger(totals.starting_service_points_total))}${stat('Final Service Points', formatInteger(totals.final_service_points_total))}${stat('Service Points gained', formatInteger(totals.lifetime_service_points_gained))}${stat('Accepted Isolation', formatInteger(totals.accepted_isolations))}${stat('Rejected Isolation', formatInteger(totals.rejected_isolations))}${stat('Documentation', formatInteger(totals.documentation))}${stat('Assists', formatInteger(totals.assists))}</dl></section>
          <section><h3>Efficiency</h3><dl class="stats-grid">${stat('Failed Verify', formatInteger(totals.failed_verify))}${stat('Redundant / superseded', formatInteger(totals.redundant_or_superseded_actions))}${stat('Turns', formatInteger(totals.turns))}${stat('Elapsed', formatDuration(totals.authoritative_elapsed_seconds))}${stat('Search uses', formatInteger(totals.search_uses))}${stat('Refresh uses', formatInteger(totals.refresh_uses))}</dl></section>
          <p class="authority-note">Disconnect and concession statistics are omitted because solo-pages-v2 cannot produce them.</p>
        </section>
      </div>
    </section>`;

  const selectedIcon = icons.find((icon) => icon.assetId === draft.icon_id);
  bindResolvedImage(root.querySelector('#profile-selected-icon'), selectedIcon?.art, { eager: true });
  root.querySelectorAll('[data-icon-id]').forEach((button) => {
    const icon = icons.find((candidate) => candidate.assetId === button.dataset.iconId);
    bindResolvedImage(button.querySelector('img'), icon?.art);
  });

  const markDirty = () => {
    context.ui.profileDirty = JSON.stringify(draft) !== JSON.stringify(saved);
    root.querySelector('#profile-unsaved').textContent = context.ui.profileDirty ? 'Unsaved changes' : 'Saved';
    root.querySelector('#profile-form button[type="submit"]').disabled = !context.ui.profileDirty;
  };
  const onInput = (event) => {
    if (event.target.id !== 'profile-name') return;
    draft.display_name = event.target.value;
    markDirty();
  };
  const onClick = (event) => {
    const icon = event.target.closest('[data-icon-id]');
    if (!icon) return;
    draft.icon_id = icon.dataset.iconId;
    markDirty();
    context.rerender();
  };
  const onSubmit = (event) => {
    event.preventDefault();
    draft.display_name = root.querySelector('#profile-name').value.trim();
    try {
      context.storage.saveProfile(draft);
      context.ui.profileSavedId = `${draft.display_name}\0${draft.icon_id}`;
      context.ui.profileDirty = false;
      context.announce('Profile saved.');
      void context.sfx?.playInteraction('profile.save', { trustedEvent: event });
      context.rerender();
    } catch (error) {
      setInlineNotice(root, error.message, 'error');
      void context.sfx?.playInteraction('global.visible.rejection', { trustedEvent: event });
    }
  };
  root.addEventListener('input', onInput);
  root.addEventListener('click', onClick);
  root.querySelector('#profile-form').addEventListener('submit', onSubmit);
  return () => {
    root.removeEventListener('input', onInput);
    root.removeEventListener('click', onClick);
    root.querySelector('#profile-form')?.removeEventListener('submit', onSubmit);
  };
}
