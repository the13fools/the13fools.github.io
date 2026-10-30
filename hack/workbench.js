import {makeDocument, validateProject, MAX_PROJECT_BYTES} from './document.js';
const $ = id => document.getElementById(id);
const tabs = [...document.querySelectorAll('[data-file]')];
const labels = {html:'HTML is the page’s body.', css:'CSS gives the page its look.', js:'JavaScript runs when you press Run preview.'};
const storagePrefix = 'foolzone-remix@1/';
let project, original, activeFile = 'html', projectId = 'homepage', editor, sessions = {}, plain = false, channel = '', logLines = [], booting = true, dirty = false;
let frame = $('preview');
const setStatus = text => { $('status').textContent = text; };
function confirmChange(message) {
  return new Promise(resolve => {
    const dialog = $('confirm-change');
    $('confirm-text').textContent = message; dialog.returnValue = 'cancel';
    dialog.addEventListener('close', () => resolve(dialog.returnValue === 'continue'), {once:true});
    dialog.showModal();
  });
}
function serialize() { return validateProject(project); }
function download(name, contents, type) {
  const url = URL.createObjectURL(new Blob([contents], {type}));
  const a = document.createElement('a'); a.href = url; a.download = name;
  a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function changed() {
  if (booting) return;
  dirty = true; setStatus('Code changed. Run preview to see it; Save draft to keep it in this browser.');
}
function selectFile(key, focus = false) {
  activeFile = key;
  for (const tab of tabs) {
    const selected = tab.dataset.file === key;
    tab.setAttribute('aria-selected', String(selected)); tab.tabIndex = selected ? 0 : -1;
  }
  $('source-panel').setAttribute('aria-labelledby', 'tab-' + key);
  $('file-note').textContent = labels[key];
  $('fallback').value = project?.files[key] || '';
  if (editor && sessions[key]) editor.setSession(sessions[key]);
  if (focus) { if (editor && !plain) editor.focus(); else $('fallback').focus(); }
}
function install(next) {
  booting = true; project = validateProject(next);
  for (const session of Object.values(sessions)) session.destroy();
  sessions = {};
  if (editor) for (const key of ['html','css','js']) {
    const session = window.ace.createEditSession(project.files[key], 'ace/mode/' + (key === 'js' ? 'javascript' : key));
    session.setUseWorker(false); session.setUseWrapMode(true); session.setTabSize(2);
    session.on('change', () => { project.files[key] = session.getValue(); changed(); });
    sessions[key] = session;
  }
  selectFile(activeFile); dirty = false; booting = false;
}
function log(kind, text) {
  logLines.push('[' + kind + '] ' + text);
  if (logLines.length > 80) logLines.shift();
  $('logs').textContent = logLines.join('\n'); $('log-count').textContent = '(' + logLines.length + ')';
}
function clearPreview() {
  // Replacing the frame drops its running document and event handlers.
  const next = frame.cloneNode(false); next.removeAttribute('srcdoc'); next.removeAttribute('src'); frame.replaceWith(next); frame = next;
  channel = crypto.randomUUID();
}
function run(reveal = false) {
  if (!project) return;
  clearPreview(); logLines = []; $('logs').textContent = 'Preview started.'; $('log-count').textContent = '(0)';
  frame.srcdoc = makeDocument(serialize(), {preview:true, channel, parentOrigin:location.origin});
  setStatus('Preview running. Changes are yours; the original page is untouched.');
  if (reveal && innerWidth <= 850) document.querySelector('.preview-pane').scrollIntoView({block:'start'});
}
addEventListener('message', event => {
  if (event.source !== frame.contentWindow || event.origin !== 'null' || event.data?.channel !== channel) return;
  if (typeof event.data.text === 'string') log(String(event.data.kind).slice(0,20), event.data.text.slice(0,2000));
});
async function text(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Could not load ' + url + ' (' + response.status + ').');
  return response.text();
}
async function starter(id) {
  if (id === 'imported') return validateProject(JSON.parse(localStorage.getItem(storagePrefix + id)));
  if (id === 'homepage') {
    const [html, css, splash, behavior] = await Promise.all([text('../play/index.html'), text('../css/play.css'), text('../css/splash.css'), text('../js/play-secret.js')]);
    const doc = new DOMParser().parseFromString(html, 'text/html');
    for (const link of doc.querySelectorAll('a[href^="/"]')) link.href = new URL(link.getAttribute('href'), 'https://foolzone.com/').href;
    return {format:'foolzone-remix@1', name:'My Foolzone remix', bodyClass:doc.body.className, files:{html:doc.body.innerHTML.trim(), css:'/* The real Foolzone styles. Search for #b1f35d to change the green. */\n' + css + '\n' + splash, js:behavior}};
  }
  const base = id === 'corner' ? 'corner' : 'spring';
  const [html, css, js] = await Promise.all([text('./' + base + '.html'), text('./' + base + '.css'), text('./' + base + '.js')]);
  return {format:'foolzone-remix@1', name:id === 'corner' ? 'My little corner' : 'My spring sketch', bodyClass:'', files:{html,css,js}};
}
let loading = 0;
async function load(id) {
  const ticket = ++loading;
  $('run').disabled = true; setStatus('Opening the source…');
  try {
    const next = await starter(id); if (ticket !== loading) return;
    projectId = id; original = structuredClone(next);
    let saved;
    try { const raw = localStorage.getItem(storagePrefix + id); if (raw) saved = validateProject(JSON.parse(raw)); } catch { /* The original remains available when storage is disabled or invalid. */ }
    install(saved || next);
    for (const key of ['run','save','download','export','original']) $(key).disabled = false;
    $('hint').textContent = id === 'homepage' ? 'Try CSS: find #b1f35d, choose another color, and run the preview.' : id === 'corner' ? 'Try HTML: replace Your name here. Then make the CSS colors your own.' : 'Try JavaScript: change stiffness from 22 to 60, then run the spring again.';
    run(); if (saved) setStatus('Opened your saved browser draft. Run preview again after editing.');
  } catch (error) { if (project) { $('run').disabled = false; $('project').value = projectId; } setStatus(error.message + ' You can still open an exported project JSON.'); }
}
for (const tab of tabs) {
  tab.addEventListener('click', () => selectFile(tab.dataset.file));
  tab.addEventListener('keydown', event => {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (step) { event.preventDefault(); const index = tabs.indexOf(tab); const next = tabs[(index + step + tabs.length) % tabs.length]; selectFile(next.dataset.file); next.focus(); }
  });
}
$('fallback').addEventListener('input', () => {
  if (!project) return;
  project.files[activeFile] = $('fallback').value;
  if (sessions[activeFile] && sessions[activeFile].getValue() !== $('fallback').value) sessions[activeFile].setValue($('fallback').value);
  changed();
});
$('run').addEventListener('click', () => run(true));
$('back-to-code').addEventListener('click', () => { document.querySelector('.code-pane').scrollIntoView({block:'start'}); selectFile(activeFile, true); });
$('stop').addEventListener('click', () => { clearPreview(); setStatus('Preview stopped. Your code is still here.'); });
$('project').addEventListener('change', async () => {
  if (dirty && !await confirmChange('Open another example? Export or save your edits first if you want to keep them.')) { $('project').value = projectId; return; }
  load($('project').value);
});
$('save').addEventListener('click', () => {
  try { localStorage.setItem(storagePrefix + projectId, JSON.stringify(serialize())); localStorage.setItem(storagePrefix + 'last', projectId); dirty = false; setStatus('Draft saved in this browser. Download or export to keep a portable copy.'); }
  catch { setStatus('Browser storage is unavailable or full. Use Download HTML or Export project JSON instead.'); }
});
$('download').addEventListener('click', () => { download('my-foolzone-remix.html', makeDocument(serialize()), 'text/html;charset=utf-8'); setStatus('Downloaded a standalone HTML page with your HTML, CSS, and JavaScript.'); });
$('export').addEventListener('click', () => { download('my-foolzone-project.json', JSON.stringify(serialize(), null, 2), 'application/json'); setStatus('Exported the project. Open this JSON here to keep editing later.'); });
$('import').addEventListener('change', async event => {
  const file = event.target.files?.[0]; if (!file) return;
  try {
    if (file.size > MAX_PROJECT_BYTES) throw new Error('Choose a project smaller than 1 MiB.');
    const next = validateProject(JSON.parse(await file.text()));
    if (dirty && !await confirmChange('Replace the current edits with this project?')) return;
    ++loading;
    if (!$('project').querySelector('option[value="imported"]')) $('project').add(new Option('Imported project', 'imported'));
    projectId = 'imported'; $('project').value = projectId; original = structuredClone(next); install(next);
    for (const key of ['run','save','download','export','original']) $(key).disabled = false;
    clearPreview(); setStatus('Opened ' + next.name + '. Press Run preview when you’re ready.');
  } catch(error) { setStatus('Could not open project: ' + error.message); }
  finally { event.target.value = ''; }
});
$('original').addEventListener('click', async () => {
  if (!original || !await confirmChange('Restore the original code? Your last saved browser draft stays available until you save over it.')) return;
  install(original); run(); setStatus('Original restored. Your saved browser draft has not been overwritten.');
});
$('plain').addEventListener('click', () => {
  plain = !plain; $('plain').setAttribute('aria-pressed', String(plain));
  $('plain').textContent = plain ? 'Use Ace editor' : 'Use a plain text editor';
  $('editor').hidden = plain || !editor; $('fallback').hidden = !plain && !!editor;
  $('fallback').value = project?.files[activeFile] || '';
  if (editor && !plain) editor.resize();
});
$('show-hint').addEventListener('click', () => {
  const key = projectId === 'spring' ? 'js' : projectId === 'corner' ? 'html' : 'css'; selectFile(key, true);
  const needle = key === 'js' ? 'const stiffness = 22' : key === 'html' ? 'Your name here' : '#b1f35d';
  if (editor && !plain) editor.find(needle, {wrap:true, caseSensitive:false});
  else { const index = $('fallback').value.indexOf(needle); if(index >= 0) $('fallback').setSelectionRange(index, index + needle.length); }
});
addEventListener('keydown', event => { if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') { event.preventDefault(); run(true); } });
if (window.ace) {
  window.ace.config.set('basePath', '../vendor/ace-1.45.2');
  editor = window.ace.edit('editor', {theme:'ace/theme/monokai', fontSize:13, showPrintMargin:false});
  editor.setOption('enableKeyboardAccessibility', true);
  $('editor').hidden = false; $('fallback').hidden = true;
  new ResizeObserver(() => editor.resize()).observe($('source-panel'));
}
let first = new URLSearchParams(location.search).get('example');
try {
  const imported = localStorage.getItem(storagePrefix + 'imported');
  if (imported) { validateProject(JSON.parse(imported)); $('project').add(new Option('Imported project', 'imported')); }
  first ||= localStorage.getItem(storagePrefix + 'last');
} catch { /* Storage is optional. */ }
if (!['homepage','spring','corner','imported'].includes(first)) first = 'homepage';
$('project').value = first;
load(first);
