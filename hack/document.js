// The editor holds text; edited code only enters the opaque preview frame.
export const MAX_PROJECT_BYTES = 1024 * 1024;
const escapeText = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
export function validateProject(value) {
  if (!value || value.format !== 'foolzone-remix@1' || !value.files || typeof value.name !== 'string') throw new Error('Choose a Foolzone project JSON file.');
  const files = {};
  for (const key of ['html', 'css', 'js']) {
    if (typeof value.files[key] !== 'string') throw new Error('The project needs HTML, CSS, and JavaScript text.');
    files[key] = value.files[key];
  }
  const result = { format: 'foolzone-remix@1', name: value.name.slice(0, 120), bodyClass: typeof value.bodyClass === 'string' ? value.bodyClass.slice(0, 100) : '', files };
  if (new TextEncoder().encode(JSON.stringify(result, null, 2)).length > MAX_PROJECT_BYTES) throw new Error('This project is larger than 1 MiB.');
  return result;
}
export function makeDocument(project, { preview = false, channel = '', parentOrigin = '' } = {}) {
  const {name, bodyClass, files} = validateProject(project);
  const bridge = preview ? `
(() => {
 const channel = ${JSON.stringify(channel)};
 const send = (kind, text) => parent.postMessage({channel, kind, text: String(text).slice(0, 2000)}, ${JSON.stringify(parentOrigin)});
 for (const kind of ['log', 'warn', 'error']) {
  const original = console[kind].bind(console);
  console[kind] = (...args) => { original(...args); send(kind, args.map(x => {try {return typeof x === 'string' ? x : JSON.stringify(x);} catch {return '[unprintable value]';}}).join(' ')); };
 }
 addEventListener('error', e => send('error', e.message + (e.lineno ? ' (line ' + e.lineno + ')' : '')));
 addEventListener('unhandledrejection', e => send('error', 'Unhandled promise: ' + String(e.reason)));
 addEventListener('click', e => { const a = e.target.closest?.('a'); if (a && !a.getAttribute('href')?.startsWith('#')) {e.preventDefault();send('link', 'Link preview: ' + a.getAttribute('href'));}}, true);
 addEventListener('submit', e => {e.preventDefault();send('info', 'Form submission is paused in the preview.');}, true);
})();` : '';
  const safeScript = value => value.replace(/<\/script/gi, '<\\/script');
  const safeStyle = files.css.replace(/<\/style/gi, '<\\/style');
  const policy = preview ? `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; connect-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'">` : '';
  return `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${policy}<title>${escapeText(name)}</title>${bridge ? '<script>' + safeScript(bridge) + '</script>' : ''}<style>\n${safeStyle}\n</style></head><body class="${escapeText(bodyClass)}">\n${files.html}\n<script>\n${safeScript(files.js)}\n</script></body></html>\n`;
}
