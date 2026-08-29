import { bindResolvedImage } from '../art-resolver.mjs';
import { escapeHtml } from '../dom-utils.mjs';
import { closePlayDialog, openPlayDialog } from '../motion-coordinator.mjs';

function imageMarkup(art, className) {
  if (!art?.src) return `<span class="${className} story-art-placeholder" aria-hidden="true"></span>`;
  return `<img class="${className}" alt="" aria-hidden="true" decoding="async">`;
}

function decorativeArt(art) {
  if (!art) return art;
  return {
    ...art,
    alt: '',
    decorative: true,
    fallback: art.fallback ? { ...art.fallback, alt: '' } : null,
  };
}

function characterMarkup(character) {
  const initials = character.name.split(/\s+/).filter(Boolean).slice(0, 2)
    .map((part) => part[0]).join('').toUpperCase();
  return `<figure class="story-character story-position--${escapeHtml(character.position)}" data-story-character-tag="${escapeHtml(character.tag)}" data-story-pose="${escapeHtml(character.poseId)}">
    ${imageMarkup(character.art, 'story-character__image')}
    ${character.art?.src ? '' : `<span class="story-character__initials" aria-hidden="true">${escapeHtml(initials || '•')}</span>`}
    ${character.alternative ? `<figcaption class="visually-hidden" data-story-art-alternative="character">${escapeHtml(character.alternative)}</figcaption>` : ''}
  </figure>`;
}

function transientMarkup(item) {
  return `<figure class="story-transient story-position--${escapeHtml(item.position)}" data-story-transient-tag="${escapeHtml(item.tag)}">
    ${imageMarkup(item.art, 'story-transient__image')}
    ${item.alternative ? `<figcaption class="visually-hidden" data-story-art-alternative="transient">${escapeHtml(item.alternative)}</figcaption>` : ''}
  </figure>`;
}

function statementMarkup(statement) {
  if (!statement) return '';
  return `${statement.speaker ? `<p class="story-dialogue__speaker">${escapeHtml(statement.speaker)}</p>` : ''}
    <p class="story-dialogue__text" data-story-statement-id="${escapeHtml(statement.statementId)}">${escapeHtml(statement.text)}</p>`;
}

function choiceMarkup(choices, pending, prompt) {
  if (!choices.length) return '';
  return `<fieldset class="story-choices"${pending ? ' disabled' : ''}><legend>${escapeHtml(prompt || 'Choose your response')}</legend>${choices.map((choice, index) => `<button type="button" class="story-choice" data-story-choice="${escapeHtml(choice.optionId)}"><span>${index + 1}</span>${escapeHtml(choice.text)}</button>`).join('')}</fieldset>`;
}

function transcriptMarkup(transcript) {
  if (!transcript.length) return '<p>No completed statements in this segment yet.</p>';
  return `<ol class="story-transcript">${transcript.map((entry) => `<li>${entry.speaker ? `<strong>${escapeHtml(entry.speaker)}</strong>` : ''}<p>${escapeHtml(entry.text)}</p></li>`).join('')}</ol>`;
}

export function renderStoryScene(root, context) {
  const model = context.story.sceneModel();
  if (model.error) {
    root.innerHTML = `<section class="play-route"><div class="route-error" role="alert"><p class="play-eyebrow">Story recovery</p><h1>This scene could not continue</h1><p>${escapeHtml(model.error)}</p><p>No Story progress was fabricated. Return to the last durable checkpoint.</p><div class="button-row"><button type="button" class="play-button play-button--primary" data-story-recover>Restart checkpoint</button><a class="play-button" href="#/play/story">Story Home</a></div></div></section>`;
    const recover = async () => {
      try {
        await context.story.recover();
        context.rerender({ focus: '[data-story-advance]' });
      } catch (error) {
        context.announce(error.message || 'Story recovery failed.');
        void context.sfx?.playInteraction('global.visible.rejection');
      }
    };
    root.querySelector('[data-story-recover]')?.addEventListener('click', recover);
    return () => root.querySelector('[data-story-recover]')?.removeEventListener('click', recover);
  }

  root.innerHTML = `
    <section class="play-route story-scene-route" aria-labelledby="story-scene-heading" data-story-pending="${model.pending}">
      <h1 id="story-scene-heading" class="visually-hidden">${escapeHtml(model.location)} Story scene</h1>
      ${model.review ? `<aside class="play-global-notice" data-tone="warning" role="status"><strong>Practice review · ${escapeHtml(model.review.label)}</strong><p>Choices and the upcoming Match are temporary. Canonical Story progress, rewards, and Profile statistics will not change.</p><a class="play-button play-button--quiet" href="#/play/story">Exit to Chapter history</a></aside>` : ''}
      <div class="story-stage" data-story-scene-id="${escapeHtml(model.sceneId)}">
        <div class="story-layer story-layer--background">${imageMarkup(model.background, 'story-background__image')}${model.backgroundAlternative ? `<p class="visually-hidden" data-story-art-alternative="background">${escapeHtml(model.backgroundAlternative)}</p>` : ''}</div>
        <div class="story-layer story-layer--characters">${model.characters.map(characterMarkup).join('')}</div>
        <div class="story-layer story-layer--transient">${model.transient.map(transientMarkup).join('')}</div>
        <div class="story-layer story-layer--screens">
          <header class="story-location"><span>${escapeHtml(model.time)}</span><strong>${escapeHtml(model.location)}</strong></header>
          ${choiceMarkup(model.choices, model.pending, model.choicePrompt)}
          <section class="story-dialogue" aria-live="polite" aria-atomic="true">
            ${statementMarkup(model.statement)}
            <div class="story-dialogue__controls">
              ${model.controls.transcript ? '<button type="button" class="play-button play-button--quiet" data-story-history>History</button>' : ''}
              ${model.controls.auto ? `<button type="button" class="play-button play-button--quiet" data-story-auto aria-pressed="${model.auto}">${model.auto ? 'Auto on' : 'Auto'}</button>` : ''}
              <button type="button" class="play-button play-button--primary" data-story-advance${model.controls.advance ? '' : ' disabled'}>${model.pending ? 'Settling…' : 'Continue'}</button>
            </div>
          </section>
        </div>
      </div>
      <p class="story-scene__access-summary">Location: ${escapeHtml(model.location)}.${model.characters.length ? ` Present: ${escapeHtml(model.characters.map((character) => character.name).join(', '))}.` : ''}</p>
      <dialog class="play-dialog story-history-dialog" aria-labelledby="story-transcript-heading"><button type="button" class="dialog-close" data-story-history-close aria-label="Close Story history">×</button><h2 id="story-transcript-heading">Story history</h2>${transcriptMarkup(model.transcript)}</dialog>
    </section>`;

  const cleanups = [];
  const backgroundImage = root.querySelector('.story-background__image');
  if (backgroundImage && model.background?.src) {
    cleanups.push(bindResolvedImage(backgroundImage, decorativeArt(model.background), { eager: true }));
    if (model.background.focalPoint) {
      backgroundImage.style.objectPosition = `${model.background.focalPoint.x * 100}% ${model.background.focalPoint.y * 100}%`;
    }
  }
  root.querySelectorAll('.story-character').forEach((figure, index) => {
    const image = figure.querySelector('img');
    if (image && model.characters[index]?.art?.src) cleanups.push(bindResolvedImage(image, decorativeArt(model.characters[index].art)));
  });
  root.querySelectorAll('.story-transient').forEach((figure, index) => {
    const image = figure.querySelector('img');
    if (image && model.transient[index]?.art?.src) cleanups.push(bindResolvedImage(image, decorativeArt(model.transient[index].art)));
  });

  let submitted = false;
  const submit = async (operation, successInteractionId = null) => {
    if (submitted || model.pending) return;
    submitted = true;
    root.querySelectorAll('[data-story-choice], [data-story-advance]').forEach((button) => { button.disabled = true; });
    try {
      await operation();
      if (successInteractionId) void context.sfx?.playInteraction(successInteractionId);
    } catch (error) {
      submitted = false;
      context.announce(error.message || 'Story intent was rejected. No branch was selected.');
      context.rerender();
      void context.sfx?.playInteraction('global.visible.rejection');
    }
  };
  const history = root.querySelector('.story-history-dialog');
  const onClick = (event) => {
    const choice = event.target.closest('[data-story-choice]');
    if (choice) {
      submit(() => context.story.choose(choice.dataset.storyChoice), 'story.scene.choice');
      return;
    }
    if (event.target.closest('[data-story-advance]')) {
      submit(() => context.story.advance(), 'story.scene.advance');
      return;
    }
    if (event.target.closest('[data-story-history]')) {
      openPlayDialog(history, event.target.closest('[data-story-history]'));
      scheduleAuto();
    }
    if (event.target.closest('[data-story-history-close]')) closePlayDialog(history);
    if (event.target.closest('[data-story-auto]')) context.story.setAuto(!model.auto);
  };
  const onKeyDown = (event) => {
    if (history?.open) return;
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (!/^[1-9]$/.test(event.key) || event.target.closest('input, select, textarea, a, [contenteditable="true"]')) return;
    const choice = model.choices[Number(event.key) - 1];
    if (!choice) return;
    event.preventDefault();
    submit(() => context.story.choose(choice.optionId), 'story.scene.choice');
  };
  root.addEventListener('click', onClick);
  root.addEventListener('keydown', onKeyDown);

  let autoTimer = null;
  const scheduleAuto = () => {
    if (autoTimer) clearTimeout(autoTimer);
    autoTimer = null;
    if (!model.auto || !model.controls.advance || model.choices.length || document.hidden || history?.open) return;
    autoTimer = setTimeout(() => {
      autoTimer = null;
      if (!document.hidden && !history?.open) submit(() => context.story.advance());
    }, 5000);
  };
  const onVisibilityChange = () => scheduleAuto();
  const onHistoryClosed = () => scheduleAuto();
  document.addEventListener('visibilitychange', onVisibilityChange);
  history?.addEventListener('close', onHistoryClosed);
  scheduleAuto();
  requestAnimationFrame(() => {
    const target = model.choices[0]
      ? root.querySelector('[data-story-choice]')
      : root.querySelector('[data-story-advance]');
    target?.focus({ preventScroll: true });
  });

  return () => {
    if (autoTimer) clearTimeout(autoTimer);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    history?.removeEventListener('close', onHistoryClosed);
    cleanups.forEach((cleanup) => cleanup());
    root.removeEventListener('click', onClick);
    root.removeEventListener('keydown', onKeyDown);
    if (history?.open) closePlayDialog(history, { restoreFocus: false, immediate: true });
  };
}
