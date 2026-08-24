export const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[character]));

export function formatInteger(value) {
  return new Intl.NumberFormat().format(Number(value) || 0);
}

export function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Number(totalSeconds) || 0);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = Math.floor(seconds % 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${remainder}s`;
  return `${remainder}s`;
}

export function downloadText(filename, text, type = 'application/json') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function dialogWithRestore(dialog, opener = document.activeElement) {
  const restore = opener instanceof HTMLElement ? opener : null;
  const onClose = () => {
    dialog.removeEventListener('close', onClose);
    restore?.focus?.();
  };
  dialog.addEventListener('close', onClose);
  dialog.showModal();
}

export function setInlineNotice(root, message, tone = 'info') {
  const notice = root.querySelector('[data-inline-notice]');
  if (!notice) return;
  notice.textContent = message;
  notice.dataset.tone = tone;
  notice.hidden = !message;
}

export function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}
