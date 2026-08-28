import { escapeHtml, setInlineNotice } from '../dom-utils.mjs';

function deckMarkup(deck) {
  if (!deck) {
    return '<p>No active deck is available. Choose a legal 30-card response deck before a Story Match.</p><a class="play-button" href="#/play/decks">Review Decks</a>';
  }
  return `<dl class="story-home__facts">
    <div><dt>Active deck</dt><dd>${escapeHtml(deck.name)}</dd></div>
    <div><dt>Preflight</dt><dd>${deck.legal ? 'Ready for Story preflight' : 'Deck review required'}</dd></div>
  </dl>
  ${deck.summary ? `<p>${escapeHtml(deck.summary)}</p>` : ''}
  ${deck.legal ? '' : '<a class="play-button" href="#/play/decks">Review Deck</a>'}`;
}

function historyMarkup(history) {
  if (!history.length) return '<p>No chapter history is available yet.</p>';
  return `<ol class="story-history-list">${history.map((entry) => `<li><span>${escapeHtml(entry.label)}</span>${entry.replayable ? `<button type="button" class="play-button play-button--quiet" data-story-replay="${escapeHtml(entry.id)}">Replay</button>` : '<small>Recorded</small>'}</li>`).join('')}</ol>`;
}

export function renderStoryHome(root, context) {
  const model = context.story.homeModel();
  root.innerHTML = `
    <section class="play-route story-home-route" aria-labelledby="story-home-heading">
      <header class="play-page-heading story-home__heading" data-route-reveal>
        <div><p class="play-eyebrow">Illustrated night-shift chronicle</p><h1 id="story-home-heading">Story</h1><p>Carry an explanation across the people, places, and handoffs of Trinity Hub.</p></div>
        <span class="story-home__status">${escapeHtml(model.status.replaceAll('_', ' ').toLowerCase())}</span>
      </header>
      ${model.error ? `<div class="play-global-notice" data-tone="error" role="alert">${escapeHtml(model.error)}</div>` : ''}
      <div class="story-home-grid">
        <article class="story-home__continuity" data-route-reveal>
          <p class="play-eyebrow">${escapeHtml(model.chapter)}</p>
          <h2>${escapeHtml(model.shift)}</h2>
          <p>${escapeHtml(model.progress)}</p>
          <dl class="story-home__facts"><div><dt>Last durable checkpoint</dt><dd>${escapeHtml(model.checkpoint)}</dd></div></dl>
          <p class="story-restart-note">${escapeHtml(model.explanation)}</p>
          <div class="button-row"><button type="button" class="play-button play-button--primary" data-story-primary${!model.canOpen || model.activeDeck?.legal === false ? ' disabled' : ''}>${escapeHtml(model.primaryLabel)}</button></div>
        </article>
        <aside class="story-home__preflight" data-route-reveal aria-labelledby="story-deck-heading">
          <p class="play-eyebrow">Match readiness</p><h2 id="story-deck-heading">Deck preflight</h2>
          ${deckMarkup(model.activeDeck)}
          <p class="authority-note">Story Matches use the same Worker-authoritative engine and active legal Player deck as Local solo. Story context grants no gameplay authority.</p>
        </aside>
        <section class="story-home__history" data-route-reveal aria-labelledby="story-history-heading">
          <div class="section-heading"><div><p class="play-eyebrow">Durable record</p><h2 id="story-history-heading">Chapter history</h2></div></div>
          ${historyMarkup(model.history)}
        </section>
        <aside class="story-home__controls" data-route-reveal aria-labelledby="story-controls-heading">
          <p class="play-eyebrow">Story-only data</p><h2 id="story-controls-heading">Replay &amp; reset</h2>
          <p>Replay and reset affect Story progress only. Decks, Profile statistics, Library data, and rules content remain unchanged.</p>
          <button type="button" class="play-button play-button--danger" data-story-reset>Reset Story progress</button>
        </aside>
      </div>
      <p class="inline-notice" data-inline-notice role="status" hidden></p>
    </section>`;

  let busy = false;
  const run = async (operation, successInteractionId = null) => {
    if (busy) return;
    busy = true;
    root.querySelectorAll('button').forEach((button) => { button.disabled = true; });
    try {
      await operation();
      if (successInteractionId) void context.sfx?.playInteraction(successInteractionId);
    } catch (error) {
      setInlineNotice(root, error.message || 'Story progress could not be updated.', 'error');
      context.announce('Story progress could not be updated.');
      void context.sfx?.playInteraction('global.visible.rejection');
      busy = false;
      root.querySelectorAll('button').forEach((button) => { button.disabled = false; });
    }
  };

  const onClick = (event) => {
    if (event.target.closest('[data-story-primary]')) {
      run(async () => {
        const result = await context.story.openPrimary();
        context.navigate(result?.route || '#/play/story/scene');
      }, 'story.home.primary');
      return;
    }
    const replay = event.target.closest('[data-story-replay]');
    if (replay) {
      if (!confirm('Replay this Story boundary? Current later Story progress will be replaced. Profile statistics and decks will not change.')) return;
      run(async () => {
        await context.story.replay(replay.dataset.storyReplay);
        context.navigate('#/play/story/scene');
      });
      return;
    }
    if (event.target.closest('[data-story-reset]')) {
      if (!confirm('Reset Story progress only? This removes Story choices, checkpoints, and accepted Story Match results. It does not reset decks or Profile statistics.')) return;
      run(async () => {
        await context.story.reset();
        context.announce('Story progress reset. Other local records were preserved.');
        context.rerender({ focus: '[data-story-primary]' });
      });
    }
  };
  root.addEventListener('click', onClick);
  return () => root.removeEventListener('click', onClick);
}
