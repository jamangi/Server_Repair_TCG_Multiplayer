function semanticControlKey(element) {
  if (!(element instanceof Element)) return null;
  if (element.dataset.continuityKey) return `key:${element.dataset.continuityKey}`;
  if (element.id) return `id:${element.id}`;
  const stableAttributes = [
    'data-card-instance-id',
    'data-ticket-id',
    'data-intent-id',
    'data-icon-id',
    'data-select-deck',
    'data-inspect-card',
  ];
  for (const attribute of stableAttributes) {
    const value = element.getAttribute(attribute);
    if (value) return `${attribute}:${value}`;
  }
  return null;
}

function findControl(root, key) {
  if (!key) return null;
  return [root, ...root.querySelectorAll('button, input, select, textarea, a[href], [tabindex]')]
    .find((element) => semanticControlKey(element) === key) ?? null;
}

function selectionSnapshot(element) {
  if (!('selectionStart' in element) || !Number.isInteger(element.selectionStart)) return null;
  return {
    start: element.selectionStart,
    end: element.selectionEnd,
    direction: element.selectionDirection ?? 'none',
  };
}

function restoreFocus(root, snapshot) {
  if (!snapshot?.key) return;
  const control = findControl(root, snapshot.key);
  if (!control || control.disabled || control.hidden) return;
  try {
    control.focus({ preventScroll: true });
  } catch {
    control.focus();
  }
  if (!snapshot.selection || typeof control.setSelectionRange !== 'function') return;
  const maximum = typeof control.value === 'string' ? control.value.length : 0;
  const start = Math.min(snapshot.selection.start, maximum);
  const end = Math.min(snapshot.selection.end, maximum);
  try {
    control.setSelectionRange(start, end, snapshot.selection.direction);
  } catch {
    // Some input types expose selection properties but reject setSelectionRange.
  }
}

/**
 * Preserve same-route UI state across deliberate DOM reconstruction. Scroll
 * surfaces are keyed by semantic data attributes rather than DOM position.
 */
export function createUiContinuity() {
  const scrollPositions = new Map();
  let activeControl = null;

  function capture(root, { scope = 'default' } = {}) {
    if (!root?.ownerDocument) return;
    const documentRef = root.ownerDocument;
    const windowRef = documentRef.defaultView;
    if (windowRef) {
      scrollPositions.set(`${scope}|document`, {
        left: windowRef.scrollX,
        top: windowRef.scrollY,
      });
    }
    root.querySelectorAll('[data-continuity-scroll]').forEach((surface) => {
      if (surface.hidden) return;
      scrollPositions.set(`${scope}|${surface.dataset.continuityScroll}`, {
        left: surface.scrollLeft,
        top: surface.scrollTop,
      });
    });

    const active = documentRef.activeElement;
    activeControl = root.contains(active) ? {
      scope,
      key: semanticControlKey(active),
      selection: selectionSnapshot(active),
    } : null;
  }

  function restore(root, { scope = 'default', restoreDocument = true } = {}) {
    if (!root?.ownerDocument) return;
    root.querySelectorAll('[data-continuity-scroll]').forEach((surface) => {
      if (surface.hidden) return;
      const position = scrollPositions.get(`${scope}|${surface.dataset.continuityScroll}`);
      if (!position) return;
      surface.scrollLeft = position.left;
      surface.scrollTop = position.top;
    });

    if (activeControl?.scope === scope) restoreFocus(root, activeControl);

    if (restoreDocument) {
      const position = scrollPositions.get(`${scope}|document`);
      root.ownerDocument.defaultView?.scrollTo({
        left: position?.left ?? 0,
        top: position?.top ?? 0,
        behavior: 'instant',
      });
    }
    activeControl = null;
  }

  return Object.freeze({ capture, restore });
}
