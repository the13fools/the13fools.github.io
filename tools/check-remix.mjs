import assert from 'node:assert/strict';
import {makeDocument, validateProject, MAX_PROJECT_BYTES} from '../hack/document.js';
// Code containing closing tags must survive as code, without ending its element.
const project = {format:'foolzone-remix@1', name:'<a title="x">', bodyClass:'splash" data-x="y', files:{html:'<h1>My page</h1>', css:'p::after{content:"</style>"}', js:'console.log("</script>")'}};
const preview = makeDocument(project, {preview:true, channel:'test', parentOrigin:'http://localhost'});
assert.ok(preview.includes('<\\/script>'));
assert.ok(preview.includes('<\\/style>'));
assert.ok(preview.includes('splash&quot; data-x=&quot;y'));
assert.ok(preview.indexOf('Content-Security-Policy') < preview.indexOf('<h1>'));
assert.ok(preview.includes("connect-src 'none'"));
assert.ok(preview.includes("frame-src 'none'"));
assert.ok(!makeDocument(project).includes('postMessage'), 'Exports do not depend on the editor bridge');
assert.deepEqual(validateProject(JSON.parse(JSON.stringify(project))), validateProject(project));
for (const bad of [{...project,format:'wrong'}, {...project,files:{...project.files,js:5}}, {...project,files:{...project.files,html:'x'.repeat(MAX_PROJECT_BYTES+1)}}]) assert.throws(() => validateProject(bad));
// A project accepted for export must fit the same UTF-8 size limit on import.
const checked=validateProject(project);
assert.ok(new TextEncoder().encode(JSON.stringify(checked,null,2)).length<=MAX_PROJECT_BYTES);
console.log('Remix checks: portable round trip, input limits, closing-tag escaping, and preview policy OK.');
