import { dialogWithRestore, downloadText, escapeHtml, setInlineNotice } from './dom-utils.mjs';
import { deckCoverage } from './catalog-service.mjs';

let activeDialog = null;

function previewMarkup(preview) {
  return `
    <section class="import-preview" aria-labelledby="import-preview-heading">
      <div class="section-heading"><div><p class="play-eyebrow">Validated bundle</p><h3 id="import-preview-heading">Replacement preview</h3></div><span>${preview.replacement_allowed ? 'Ready to confirm' : 'Blocked'}</span></div>
      <dl class="preview-facts">
        <div><dt>Profile</dt><dd>${escapeHtml(preview.profile.display_name)}</dd></div>
        <div><dt>Icon</dt><dd><code>${escapeHtml(preview.profile.icon_id)}</code></dd></div>
        <div><dt>Decks</dt><dd>${preview.deck_count}</dd></div>
        <div><dt>Active deck</dt><dd>${preview.active_deck ? escapeHtml(preview.active_deck.display_name) : 'None'}</dd></div>
        <div><dt>Matches</dt><dd>${preview.statistics.matches_completed} completed</dd></div>
        <div><dt>Level</dt><dd>${preview.statistics.level}</dd></div>
      </dl>
      <details><summary>Version pins</summary><pre>${escapeHtml(JSON.stringify(preview.versions, null, 2))}</pre></details>
      <ul class="import-warnings">${preview.warnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join('')}</ul>
      <label class="confirmation-check"><input id="confirm-import-check" type="checkbox"> I understand this replaces every current local record.</label>
      <div class="button-row"><button type="button" class="play-button" data-download-current>Download current backup first</button><button type="button" class="play-button play-button--danger" data-confirm-import disabled>Replace local data</button></div>
    </section>`;
}

export function openSettingsDialog(context) {
  activeDialog?.remove();
  const snapshot = context.refreshSnapshot();
  const settings = snapshot.state.records.settings;
  const activeDeck = snapshot.state.records.decks.decks.find(
    (deck) => deck.deck_id === snapshot.state.records.decks.active_deck_id,
  ) ?? null;
  const eligibleUniqueCount = activeDeck
    ? deckCoverage(context.catalog, activeDeck.card_definition_ids).eligible_unique_count
    : 0;
  const dialog = document.createElement('dialog');
  dialog.className = 'play-dialog settings-dialog';
  dialog.setAttribute('aria-labelledby', 'settings-heading');
  dialog.innerHTML = `
    <button type="button" class="dialog-close" data-close-settings aria-label="Close Settings">×</button>
    <header><p class="play-eyebrow">Solo Pages v2</p><h2 id="settings-heading">Settings &amp; local data</h2><p>Presentation choices do not change engine legality or frozen gameplay.</p></header>
    ${snapshot.diagnostic ? `<div class="storage-diagnostic" role="status" data-code="${escapeHtml(snapshot.diagnostic.code)}"><strong>${snapshot.persistence === 'MEMORY' ? 'Memory-only session' : 'Local data notice'}</strong><p>${escapeHtml(snapshot.diagnostic.message)}</p></div>` : ''}
    <form id="settings-form">
      <section class="settings-section"><h3>Match setup</h3><label>Starting Tickets<select id="settings-ticket-count">${Array.from({ length: 10 }, (_, index) => index + 1).map((count) => `<option value="${count}"${count === settings.starting_ticket_count ? ' selected' : ''}>${count}</option>`).join('')}</select></label><p class="field-note">The active deck can reach ${eligibleUniqueCount} distinct causal fingerprint${eligibleUniqueCount === 1 ? '' : 's'} at once. The Builder uses each eligible fingerprint before balanced deterministic repetition.</p></section>
      <section class="settings-section"><h3>Interaction</h3><label>Preferred Bench View<select id="settings-bench-view"><option value="RELEVANT"${settings.preferred_bench_view === 'RELEVANT' ? ' selected' : ''}>Relevant</option><option value="GLOBAL"${settings.preferred_bench_view === 'GLOBAL' ? ' selected' : ''}>Global</option></select></label><p class="field-note">This is an organization preference, not a difficulty setting. You can switch during play.</p><label>Motion<select id="settings-motion"><option value="SYSTEM"${settings.motion_preference === 'SYSTEM' ? ' selected' : ''}>Follow system</option><option value="FULL"${settings.motion_preference === 'FULL' ? ' selected' : ''}>Full explanatory motion</option><option value="REDUCED"${settings.motion_preference === 'REDUCED' ? ' selected' : ''}>Reduced motion</option></select></label><label class="switch-row"><input id="settings-drag" type="checkbox"${settings.drag_enabled ? ' checked' : ''}><span>Enable optional Card drag affordances</span></label><p class="field-note">Click and keyboard actions always remain available.</p><button type="submit" class="play-button play-button--primary">Save settings</button></section>
    </form>
    <section class="settings-section data-portability"><h3>Data portability</h3><p>Backups contain profile, decks, settings, processed result IDs, and local aggregates. Active Match state is never exported.</p><div class="button-row"><button type="button" class="play-button" data-export-backup>Export backup</button><label class="play-button file-button">Choose backup<input id="import-file" type="file" accept="application/json,.json"></label></div><div data-import-preview></div></section>
    <section class="settings-section danger-zone"><h3>Reset local data</h3><p>Restore the canonical starter profile and deck. This also clears local lifetime statistics.</p><button type="button" class="play-button play-button--danger" data-reset-local>Reset local data</button></section>
    <p data-inline-notice class="inline-notice" role="status" hidden></p>`;
  document.body.append(dialog);
  activeDialog = dialog;
  let preparedImport = null;

  const saveSettings = (event) => {
    event.preventDefault();
    const next = structuredClone(settings);
    next.starting_ticket_count = Number(dialog.querySelector('#settings-ticket-count').value);
    next.motion_preference = dialog.querySelector('#settings-motion').value;
    next.drag_enabled = dialog.querySelector('#settings-drag').checked;
    next.preferred_bench_view = dialog.querySelector('#settings-bench-view').value;
    try {
      context.storage.saveSettings(next);
      context.onSettingsSaved(next);
      setInlineNotice(dialog, 'Settings saved.', 'success');
      context.announce('Settings saved.');
    } catch (error) {
      setInlineNotice(dialog, error.message, 'error');
    }
  };

  const exportCurrent = () => {
    try {
      const backup = context.storage.exportBackup();
      downloadText(backup.filename, backup.json);
      setInlineNotice(dialog, 'Backup download prepared.', 'success');
    } catch (error) {
      setInlineNotice(dialog, error.message, 'error');
    }
  };

  const readImport = async (file) => {
    if (!file) return;
    try {
      preparedImport = context.storage.prepareImport(await file.text());
      dialog.querySelector('[data-import-preview]').innerHTML = previewMarkup(preparedImport.preview);
      setInlineNotice(dialog, 'Backup validated. Review the replacement preview.', 'success');
      context.announce('Backup validated. Replacement preview ready.');
    } catch (error) {
      preparedImport = null;
      dialog.querySelector('[data-import-preview]').innerHTML = '';
      const details = Array.isArray(error.details) ? ` ${error.details.map((item) => item.message).join(' ')}` : '';
      setInlineNotice(dialog, `${error.message}${details}`, 'error');
      context.announce('Backup rejected. No local data changed.');
    }
  };

  const replaceImport = () => {
    if (!preparedImport || !dialog.querySelector('#confirm-import-check')?.checked) return;
    if (!confirm('Replace all current local profile, deck, settings, and statistics records?')) return;
    try {
      context.storage.replaceFromImport(preparedImport, { confirmed: true });
      context.onDataReplaced();
      dialog.close();
      context.announce('Local data replaced from the validated backup.');
    } catch (error) {
      setInlineNotice(dialog, error.message, 'error');
    }
  };

  const resetData = () => {
    if (!confirm('Reset all local profile, decks, settings, and statistics? This cannot be undone.')) return;
    try {
      context.storage.reset({ confirmed: true });
      context.onDataReplaced();
      dialog.close();
      context.announce('Local data reset to defaults.');
    } catch (error) {
      setInlineNotice(dialog, error.message, 'error');
    }
  };

  const onClick = (event) => {
    if (event.target.closest('[data-close-settings]')) dialog.close();
    if (event.target.closest('[data-export-backup]') || event.target.closest('[data-download-current]')) exportCurrent();
    if (event.target.closest('[data-confirm-import]')) replaceImport();
    if (event.target.closest('[data-reset-local]')) resetData();
  };
  const onChange = (event) => {
    if (event.target.id === 'import-file') readImport(event.target.files?.[0]);
    if (event.target.id === 'confirm-import-check') dialog.querySelector('[data-confirm-import]').disabled = !event.target.checked;
  };
  const cleanup = () => {
    dialog.removeEventListener('click', onClick);
    dialog.removeEventListener('change', onChange);
    dialog.querySelector('#settings-form')?.removeEventListener('submit', saveSettings);
    if (activeDialog === dialog) activeDialog = null;
    dialog.remove();
  };
  dialog.addEventListener('click', onClick);
  dialog.addEventListener('change', onChange);
  dialog.querySelector('#settings-form').addEventListener('submit', saveSettings);
  dialog.addEventListener('close', cleanup, { once: true });
  dialogWithRestore(dialog);
  context.motion('dialog', dialog);
}

export function closeSettingsDialog() {
  activeDialog?.close();
}
