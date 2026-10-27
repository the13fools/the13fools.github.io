import { readFileSync } from 'node:fs';
import { resolve, basename } from 'node:path';

type Reference = { id: string; group: string; authors: string; title: string; date: string; url: string | null; note: string };
const escape = (text: string) => text.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));

// Stable keys in source; one registry supplies labels, metadata, and backlinks.
export function renderReferences(html: string, filename: string, root: string, pages: string[]) {
  const refs = JSON.parse(readFileSync(resolve(root, 'references.json'), 'utf8')) as Reference[];
  const byId = new Map(refs.map((ref, i) => [ref.id, { ...ref, number: i + 1 }]));
  if (byId.size !== refs.length) throw new Error('Duplicate bibliography keys');
  const counts = new Map<string, number>();
  const page = basename(filename);
  html = html.replace(/\{cite:([a-z0-9-]+)\}/g, (_, id: string) => {
    const ref = byId.get(id);
    if (!ref) throw new Error(`Unknown citation ${id} in ${page}`);
    const count = (counts.get(id) ?? 0) + 1; counts.set(id, count);
    return `<sup class="citation"><a id="cite-${id}-${count}" href="./appendix.html#ref-${id}" aria-label="Reference ${ref.number}: ${escape(ref.title)}">[${ref.number}]</a></sup>`;
  });
  if (!html.includes('{bibliography}')) return html;
  const pageLabels = ['Overview', 'Part I', 'Part II', 'Part III', 'Part IV', 'Appendix'];
  const sources = pages.map((p, i) => ({page:p,label:pageLabels[i],source:readFileSync(resolve(root,p),'utf8')}));
  let group = '';
  const entries = refs.map((ref, i) => {
    const heading = ref.group === group ? '' : `${group ? '</ol>' : ''}<h3>${escape(ref.group)}</h3><ol class="reference-list" start="${i+1}">`;
    group = ref.group;
    const title = ref.url ? `<a href="${escape(ref.url)}">${escape(ref.title)}</a>` : `<i>${escape(ref.title)}</i>`;
    const stop = /[.!?]$/.test(ref.title) ? '' : '.';
    const uses = sources.filter(p => p.source.includes(`{cite:${ref.id}}`));
    const backlinks = uses.length ? `<p class="reference-uses">Used in ${uses.map(p=>`<a href="./${p.page}#cite-${ref.id}-1">${p.label}</a>`).join(', ')}.</p>` : '<p class="reference-uses">Further reading.</p>';
    return `${heading}<li id="ref-${ref.id}"><p>${escape(ref.authors)}. ${title}${stop} <span class="reference-date">${escape(ref.date)}.</span></p>${ref.note?`<p class="reference-note">${escape(ref.note)}</p>`:''}${backlinks}</li>`;
  }).join('\n') + '</ol>';
  return html.replace('{bibliography}', `<p class="cap">Bracketed numbers beside claims lead here. Each entry gives its source, publication status, and links back to the passages that use it. The original paper links in the text remain directly usable.</p>${entries}`);
}
