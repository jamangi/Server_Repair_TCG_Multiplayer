let motionRuntime = null;
try {
  motionRuntime = await import('../../vendor/animejs/4.5.0/anime.esm.min.js');
} catch (error) {
  console.warn('Anime.js could not load; semantic motion is disabled.', error);
}

const animate = motionRuntime?.animate ?? (() => null);
const createTimeline = motionRuntime?.createTimeline ?? (() => ({ add() { return this; } }));
const spring = motionRuntime?.spring ?? (() => 'outQuad');
const stagger = motionRuntime?.stagger ?? (() => 0);

let getPreference = () => 'SYSTEM';
const systemReduced = typeof matchMedia === 'function'
  ? matchMedia('(prefers-reduced-motion: reduce)')
  : { matches: false };
const dialogStates = new WeakMap();

export function configureMotion(preferenceReader) {
  getPreference = typeof preferenceReader === 'function' ? preferenceReader : getPreference;
}

export function prefersReducedMotion() {
  const preference = getPreference();
  if (preference === 'REDUCED') return true;
  if (preference === 'FULL') return false;
  return systemReduced.matches;
}

function targets(root, selector) {
  return [...root.querySelectorAll(selector)];
}

function clearTransient(root) {
  root.querySelectorAll('[data-motion-state]').forEach((element) => element.removeAttribute('data-motion-state'));
}

const patterns = {
  route(root) {
    const sections = targets(root, '[data-route-reveal]');
    if (!sections.length) return null;
    return animate(sections, {
      opacity: { from: 0 },
      y: { from: 12 },
      duration: 420,
      delay: stagger(48),
      ease: 'outQuart',
    });
  },
  ticketSelected(root) {
    const selected = root.querySelector('.ticket-card[aria-current="true"], .ticket-sheet[aria-current="true"]');
    if (!selected) return null;
    return animate(selected, {
      scale: { from: .985, to: 1 },
      y: { from: 5, to: 0 },
      duration: 430,
      ease: spring({ bounce: .22, duration: 430 }),
    });
  },
  actionResolved(root) {
    const source = root.querySelector('[data-motion-source="card"]');
    const ticket = root.querySelector('.ticket-sheet');
    const draws = targets(root, '[data-new-draw="true"]');
    const log = targets(root, '.worklog-entry.is-new, .evidence-entry.is-new');
    const timeline = createTimeline({ defaults: { ease: 'outQuart' } });
    if (source) timeline.add(source, { scale: [.98, 1.025, 1], duration: 280 }, 0);
    if (ticket) timeline.add(ticket, { scale: [.997, 1.004, 1], duration: 260 }, 0);
    if (draws.length) timeline.add(draws, { opacity: { from: .45 }, x: { from: 26 }, rotate: { from: 2 }, duration: 430, delay: stagger(45) }, 40);
    if (log.length) timeline.add(log, { opacity: { from: 0 }, x: { from: 14 }, duration: 360, delay: stagger(55) }, 70);
    return timeline;
  },
  rejection(root) {
    const target = root.querySelector('.play-card[data-selected="true"], .candidate-tray, .ticket-sheet');
    if (!target) return null;
    return animate(target, {
      x: [0, -4, 4, -2, 0],
      duration: 300,
      ease: 'outQuad',
    });
  },
  failedVerify(root) {
    const ticket = root.querySelector('.ticket-sheet');
    const diagnosis = root.querySelector('[data-diagnosis-reopened="true"]');
    const timeline = createTimeline({ defaults: { ease: 'outQuad' } });
    if (ticket) timeline.add(ticket, { x: [0, -4, 4, -2, 0], duration: 360 }, 0);
    if (diagnosis) timeline.add(diagnosis, { opacity: [.45, 1], scale: [.98, 1], duration: 430 }, 110);
    return timeline;
  },
  ticketClosed(root) {
    const closed = targets(root, '.ticket-card.is-closing, .closure-chip.is-new');
    if (!closed.length) return null;
    return animate(closed, {
      opacity: { from: .55, to: 1 },
      scale: { from: .96, to: 1 },
      duration: 520,
      delay: stagger(70),
      ease: spring({ bounce: .18, duration: 520 }),
    });
  },
  result(root) {
    const items = targets(root, '.result-panel [data-result-reveal]');
    if (!items.length) return null;
    return animate(items, {
      opacity: { from: 0 },
      y: { from: 16 },
      duration: 520,
      delay: stagger(80),
      ease: 'outExpo',
    });
  },
};

export function runMotion(pattern, root = document) {
  if (!root || prefersReducedMotion()) {
    if (root) clearTransient(root);
    return null;
  }
  try {
    return patterns[pattern]?.(root) ?? null;
  } catch (error) {
    console.warn(`Motion pattern ${pattern} could not run.`, error);
    return null;
  } finally {
    requestAnimationFrame(() => clearTransient(root));
  }
}

function focusSurvivingOpener(opener) {
  if (!(opener instanceof HTMLElement) || !opener.isConnected || typeof opener.focus !== 'function') return;
  try {
    opener.focus({ preventScroll: true });
  } catch {
    opener.focus();
  }
}

function dialogState(dialog) {
  let state = dialogStates.get(dialog);
  if (state) return state;
  state = {
    generation: 0,
    phase: 'closed',
    opener: null,
    restoreFocus: true,
    openingAnimation: null,
    closingAnimation: null,
    onCancel: null,
    onClick: null,
    onClose: null,
  };
  state.onCancel = (event) => {
    event.preventDefault();
    closePlayDialog(dialog);
  };
  state.onClick = (event) => {
    if (event.target === dialog) closePlayDialog(dialog);
  };
  state.onClose = () => {
    neutralizeDialogMotion(dialog, state);
    state.phase = 'closed';
    const opener = state.opener;
    const shouldRestore = state.restoreFocus;
    state.opener = null;
    state.restoreFocus = true;
    if (shouldRestore) focusSurvivingOpener(opener);
  };
  dialog.addEventListener('cancel', state.onCancel);
  dialog.addEventListener('click', state.onClick);
  dialog.addEventListener('close', state.onClose);
  dialogStates.set(dialog, state);
  return state;
}

function neutralizeDialogMotion(dialog, state = dialogStates.get(dialog)) {
  if (!state) return;
  state.generation += 1;
  const animations = new Set([
    state.openingAnimation,
    state.closingAnimation,
    ...(typeof dialog.getAnimations === 'function' ? dialog.getAnimations() : []),
  ]);
  for (const animation of animations) {
    try {
      animation?.cancel?.();
    } catch {
      // A stale browser animation may already have detached its effect.
    }
  }
  state.openingAnimation = null;
  state.closingAnimation = null;
  delete dialog.dataset.motionClosing;
}

function completeOpening(dialog, state, animation, generation) {
  if (state.generation !== generation || state.openingAnimation !== animation) return;
  try {
    animation.cancel();
  } catch {
    // The finished animation may already have been removed by the browser.
  }
  state.openingAnimation = null;
  state.phase = 'open';
}

/**
 * Own the complete lifecycle for a reusable Play dialog. Every opening starts
 * from neutral visual state, even when it interrupts a closing animation.
 */
export function openPlayDialog(dialog, opener = document.activeElement) {
  if (!(dialog instanceof HTMLDialogElement)) return null;
  const state = dialogState(dialog);
  neutralizeDialogMotion(dialog, state);
  state.opener = opener instanceof HTMLElement && opener.isConnected ? opener : null;
  state.restoreFocus = true;
  state.phase = 'opening';
  if (!dialog.open) dialog.showModal();
  if (prefersReducedMotion() || typeof dialog.animate !== 'function') {
    state.phase = 'open';
    return null;
  }
  try {
    const generation = state.generation;
    const animation = dialog.animate([
      { opacity: 0, transform: 'translateY(8px) scale(.97)' },
      { opacity: 1, transform: 'translateY(0) scale(1)' },
    ], {
      duration: 260,
      easing: 'cubic-bezier(.22, .76, .25, 1)',
      fill: 'none',
    });
    state.openingAnimation = animation;
    animation.addEventListener('finish', () => completeOpening(dialog, state, animation, generation), { once: true });
    return animation;
  } catch (error) {
    neutralizeDialogMotion(dialog, state);
    state.phase = 'open';
    console.warn('Play dialog opening motion could not run.', error);
    return null;
  }
}

export function closePlayDialog(dialog, { restoreFocus = true, immediate = false } = {}) {
  if (!(dialog instanceof HTMLDialogElement)) return null;
  const state = dialogState(dialog);
  neutralizeDialogMotion(dialog, state);
  state.restoreFocus = restoreFocus;
  if (!dialog.open) {
    state.phase = 'closed';
    return null;
  }
  state.phase = 'closing';
  if (immediate || prefersReducedMotion() || typeof dialog.animate !== 'function') {
    dialog.close();
    return null;
  }
  try {
    dialog.dataset.motionClosing = 'true';
    const generation = state.generation;
    const animation = dialog.animate([
      { opacity: 1, transform: 'translateY(0) scale(1)' },
      { opacity: 0, transform: 'translateY(6px) scale(.975)' },
    ], {
      duration: 160,
      easing: 'cubic-bezier(.4, 0, 1, 1)',
      fill: 'none',
    });
    state.closingAnimation = animation;
    animation.addEventListener('finish', () => {
      if (state.generation !== generation || state.closingAnimation !== animation) return;
      try {
        animation.cancel();
      } catch {
        // The browser may already have discarded the completed effect.
      }
      state.closingAnimation = null;
      delete dialog.dataset.motionClosing;
      if (dialog.open) dialog.close();
    }, { once: true });
    return animation;
  } catch (error) {
    neutralizeDialogMotion(dialog, state);
    dialog.close();
    console.warn('Play dialog closing motion could not run.', error);
    return null;
  }
}

function dialogsWithin(root) {
  if (!root) return [];
  return [
    ...(root instanceof HTMLDialogElement ? [root] : []),
    ...(typeof root.querySelectorAll === 'function' ? root.querySelectorAll('dialog') : []),
  ];
}

/** Close and detach lifecycle listeners without focusing controls that the
 * route is about to remove. */
export function teardownPlayDialogs(root) {
  for (const dialog of dialogsWithin(root)) {
    const state = dialogStates.get(dialog);
    if (state) {
      state.restoreFocus = false;
      state.opener = null;
      neutralizeDialogMotion(dialog, state);
      dialog.removeEventListener('cancel', state.onCancel);
      dialog.removeEventListener('click', state.onClick);
      dialog.removeEventListener('close', state.onClose);
      dialogStates.delete(dialog);
    }
    if (dialog.open) dialog.close();
    delete dialog.dataset.motionClosing;
  }
}
