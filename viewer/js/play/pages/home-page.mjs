import { bindResolvedImage } from '../art-resolver.mjs';
import { deckComposition, deckCoverage } from '../catalog-service.mjs';
import { deriveLevel } from '../data/client-data.mjs';
import { escapeHtml } from '../dom-utils.mjs';

function compositionMarkup(composition) {
  const families = [
    ['test', 'Test'],
    ['command', 'Command'],
    ['repair', 'Repair'],
    ['verify', 'Verify'],
  ];
  return families.map(([key, label]) => `<span class="composition-chip composition-chip--${key}"><b>${composition[key] || 0}</b>${label}</span>`).join('');
}

export function renderHome(root, context) {
  const { records } = context.snapshot.state;
  const profile = records.profile;
  const settings = records.settings;
  const totals = records.statistics.totals;
  const activeDeck = records.decks.decks.find((deck) => deck.deck_id === records.decks.active_deck_id) ?? null;
  const composition = activeDeck ? deckComposition(context.catalog, activeDeck.card_definition_ids.map((id) => ({ card_definition_id: id, quantity: 1 }))) : null;
  const coverage = activeDeck ? deckCoverage(context.catalog, activeDeck.card_definition_ids) : null;
  const level = deriveLevel(totals.lifetime_service_points_gained);
  const repetitionBeginsAt = (coverage?.eligible_unique_count ?? 0) + 1;
  const duplicateDisclosure = Boolean(coverage && settings.starting_ticket_count >= repetitionBeginsAt);
  const matchCompatible = Boolean(activeDeck && coverage?.eligible_unique_count > 0);

  root.innerHTML = `
    <section class="play-route home-route" aria-labelledby="home-heading">
      <div class="home-grid">
        <section class="home-anchor" data-route-reveal>
          <div class="home-anchor__art play-art-slot">
            <img id="home-anchor-art" width="1100" height="780" alt="">
            <div class="home-anchor__scan" aria-hidden="true"></div>
          </div>
          <div class="home-anchor__copy">
            <p class="play-eyebrow">Local cooperative training · Night shift</p>
            <h1 id="home-heading">Take the next repair queue</h1>
            <p>Observe the symptoms, test competing explanations, isolate an actionable fault, repair the machine, verify recovery, and preserve the path in the Worklog.</p>
            <ol class="evidence-loop" aria-label="Iterative troubleshooting loop">
              <li>Observe</li><li>Hypothesize ↔ Test</li><li>Isolate</li><li>Repair</li><li>Verify</li><li>Document</li>
            </ol>
          </div>
        </section>

        <aside class="shift-panel" data-route-reveal>
          <header class="shift-panel__profile">
            <div class="profile-token"><img id="home-profile-icon" width="96" height="96" alt=""></div>
            <div class="play-level-badge" aria-label="Level ${level}"><span><b class="play-level-badge__value">${level}</b><small class="play-level-badge__label">Level</small></span></div>
            <div><p class="play-eyebrow">On duty</p><h2>${escapeHtml(profile.display_name)}</h2><p>Level ${level} · ${totals.lifetime_service_points_gained} lifetime Service Points</p></div>
          </header>
          <section class="active-deck-summary" aria-labelledby="active-deck-heading">
            <p class="play-eyebrow">Active deck</p>
            <h3 id="active-deck-heading">${activeDeck ? escapeHtml(activeDeck.display_name) : 'No active legal deck'}</h3>
            ${activeDeck ? `<p>${activeDeck.card_definition_ids.length} Cards · legal response deck</p><div class="composition-row">${compositionMarkup(composition)}</div><p class="${matchCompatible ? '' : 'status-warning'}"><strong>${coverage.eligible_unique_count} of ${coverage.supported_unique_count}</strong> supported causal fingerprints have a complete path with this deck. ${coverage.eligible_unique_count ? `Repetition can begin at Ticket ${repetitionBeginsAt}.` : 'No Match can start until at least one complete Repair/Verify path is available.'}</p>` : '<p class="status-warning">Choose or build a legal 30-card deck before starting.</p>'}
            <a class="play-link" href="#/play/decks">Review decks</a>
          </section>
          <label class="ticket-count-control" for="ticket-count">
            Starting Tickets
            <select id="ticket-count">${Array.from({ length: 10 }, (_, index) => index + 1).map((count) => `<option value="${count}"${count === settings.starting_ticket_count ? ' selected' : ''}>${count} Ticket${count === 1 ? '' : 's'}</option>`).join('')}</select>
          </label>
          <p id="duplicate-disclosure" class="duplicate-disclosure"${duplicateDisclosure ? '' : ' hidden'}><strong>Repeat-scenario disclosure:</strong> this request exceeds the ${coverage?.eligible_unique_count ?? 0} unique fingerprints reachable by the active deck. The Builder uses every eligible fingerprint before balanced deterministic repetition; every Ticket remains a separate machine instance and closure.</p>
          <button id="start-solo" class="play-button play-button--primary play-button--large" type="button"${matchCompatible && !context.snapshot.recovery_required ? '' : ' disabled'}>
            <span>Begin solo shift</span><small>${settings.starting_ticket_count} Ticket${settings.starting_ticket_count === 1 ? '' : 's'} · finite queue</small>
          </button>
          ${context.snapshot.recovery_required ? '<p class="status-error">Local data needs recovery in Settings before a Match can start.</p>' : ''}
          <p class="authority-note">This browser is the local authority. Active Match state is not saved or resumable.</p>
        </aside>
      </div>
      <nav class="home-shortcuts" aria-label="Shift preparation" data-route-reveal>
        <a href="#/play/decks"><span>Decks</span><strong>Prepare a 30-card response kit</strong></a>
        <a href="#/play/profile"><span>Profile</span><strong>Review Level and local statistics</strong></a>
        <button type="button" data-open-settings><span>Settings</span><strong>Motion and data portability</strong></button>
      </nav>
    </section>`;

  bindResolvedImage(root.querySelector('#home-anchor-art'), context.artResolver.resolveAssetById('decorative.home.night_shift_desk', { decorative: true }), { eager: true });
  const profileIcon = context.artResolver.listProfileIcons().find((icon) => icon.assetId === profile.icon_id);
  bindResolvedImage(root.querySelector('#home-profile-icon'), profileIcon?.art, { eager: true });

  const onChange = (event) => {
    if (event.target.id !== 'ticket-count') return;
    const next = structuredClone(records.settings);
    next.starting_ticket_count = Number(event.target.value);
    context.saveSettings(next);
    context.rerender();
    context.announce(`Starting queue set to ${next.starting_ticket_count} Tickets.`);
  };
  const onClick = (event) => {
    if (event.target.closest('[data-open-settings]')) {
      context.openSettings();
      return;
    }
    if (event.target.closest('#start-solo')) context.beginMatch();
  };
  root.addEventListener('change', onChange);
  root.addEventListener('click', onClick);
  return () => {
    root.removeEventListener('change', onChange);
    root.removeEventListener('click', onClick);
  };
}
