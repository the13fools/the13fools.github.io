'use strict';

// Same degree-preserving switch as Graph Transport Playground. The random
// labels are chosen before rewiring and are also used for the matched null.
function experimentGraph(n, k, seed, planted, rng) {
  const edges = rng(seed * 7919 + 3);
  const selection = rng(seed + 773);
  const switches = rng(seed + 555);
  const adj = new Uint8Array(n * n);
  const labels = Array.from({length: n}, (_, i) => i);
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(selection() * (n - i));
    [labels[i], labels[j]] = [labels[j], labels[i]];
    for (let b = i + 1; b < n; b++) adj[i * n + b] = adj[b * n + i] = +(edges() < .5);
  }
  const clique = labels.slice(0, k), outside = labels.slice(k), marks = new Uint8Array(n);
  for (const vertex of clique) marks[vertex] = 1;
  if (!planted) return {adj, marks};
  const setEdge = (a, b, value) => { adj[a * n + b] = adj[b * n + a] = value; };
  for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) {
    const a = clique[i], b = clique[j];
    if (adj[a * n + b]) continue;
    const offset = Math.floor(switches() * outside.length);
    let changed = false;
    for (let q = 0; q < outside.length && !changed; q++) {
      const u = outside[(q + offset) % outside.length];
      if (!adj[a * n + u]) continue;
      for (let r = 0; r < outside.length; r++) {
        const v = outside[(r + offset) % outside.length];
        if (u === v || !adj[b * n + v] || adj[u * n + v]) continue;
        setEdge(a, b, 1);
        setEdge(u, v, 1);
        setEdge(a, u, 0);
        setEdge(b, v, 0);
        changed = true;
        break;
      }
    }
    if (!changed) throw new Error('Could not finish degree-preserving planting. Try a smaller marked set or a different graph seed.');
  }
  return {adj, marks};
}

function firstTriangleRanks(adj, marks, positions) {
  const n = marks.length;
  const pairScore = new Int16Array(n * n), distance = new Float64Array(n * n);
  for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) {
    if (!adj[a * n + b]) continue;
    let agreement = 0;
    for (let v = 0; v < n; v++) {
      if (v !== a && v !== b) agreement += adj[a * n + v] === adj[b * n + v] ? 1 : -1;
    }
    pairScore[a * n + b] = agreement;
    distance[a * n + b] = Math.hypot(...[0, 1, 2].map(d => positions[3 * a + d] - positions[3 * b + d]));
  }
  const candidates = [];
  let firstGraph = null, firstGeometry = null;
  for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) {
    const ab = a * n + b;
    if (!adj[ab]) continue;
    for (let c = b + 1; c < n; c++) {
      const ac = a * n + c, bc = b * n + c;
      if (!adj[ac] || !adj[bc]) continue;
      const graph = pairScore[ab] + pairScore[ac] + pairScore[bc];
      const geometry = graph - Math.sqrt(n) * .5 * Math.max(distance[ab], distance[ac], distance[bc]);
      const candidate = {graph, geometry, index: candidates.length};
      candidates.push(candidate);
      if (marks[a] && marks[b] && marks[c]) {
        if (!firstGraph || graph > firstGraph.graph) firstGraph = candidate;
        if (!firstGeometry || geometry > firstGeometry.geometry) firstGeometry = candidate;
      }
    }
  }
  const rank = (key, best) => best && 1 + candidates.filter(c => c[key] > best[key] ||
    (c[key] === best[key] && c.index < best.index)).length;
  return {graph: rank('graph', firstGraph), geometry: rank('geometry', firstGeometry), total: candidates.length};
}

function setupSphereExperiment({drawSphere, kmeans4, summarizeCorners, chanceText, bindRotation, rng}) {
  const form = document.getElementById('experimentForm');
  const canvas = document.getElementById('experimentSphere');
  const stage = canvas.parentElement;
  const view = stage.parentElement;
  const status = document.getElementById('experimentStatus');
  const summary = document.getElementById('experimentSummary');
  const runButton = document.getElementById('experimentRun');
  const stopButton = document.getElementById('experimentStop');
  const viewButtons = [...document.querySelectorAll('[data-experiment-frame]')];
  const camera = {yaw: .6, pitch: -.35};
  let active, displayed, labels, marks, frames;

  function draw() {
    if (displayed) drawSphere(canvas, displayed, marks, labels, camera);
  }
  bindRotation(stage, camera, draw);
  new ResizeObserver(draw).observe(stage);

  function setFrame(name) {
    displayed = frames[name];
    labels = name === 'end' ? frames.labels : null;
    for (const button of viewButtons) {
      button.setAttribute('aria-pressed', String(button.dataset.experimentFrame === name));
    }
    draw();
  }
  for (const button of viewButtons) button.addEventListener('click', () => setFrame(button.dataset.experimentFrame));

  function busy(value) {
    runButton.disabled = value;
    stopButton.disabled = !value;
    for (const field of form.querySelectorAll('input, select')) field.disabled = value;
    for (const button of viewButtons) button.disabled = value || !frames?.end;
  }

  function workerClient() {
    const source = `(${installGraphTransportWorker.toString()})(self);`;
    const url = URL.createObjectURL(new Blob([source], {type: 'text/javascript'}));
    const worker = new Worker(url);
    URL.revokeObjectURL(url);
    let pending;
    worker.onmessage = ({data}) => {
      if (data.frame || !pending) return;
      if (data.error) pending.reject(new Error(data.error));
      else pending.resolve(data);
      pending = null;
    };
    worker.onerror = event => {
      pending?.reject(new Error(event.message || 'The solver worker could not start.'));
      pending = null;
    };
    return {
      call(cmd, data) {
        return new Promise((resolve, reject) => {
          pending = {resolve, reject};
          worker.postMessage({id: 1, cmd, ...data});
        });
      },
      close() {
        worker.terminate();
        pending?.reject(new Error('Experiment stopped.'));
        pending = null;
      }
    };
  }

  stopButton.addEventListener('click', () => active?.close());
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const settings = new FormData(form);
    const n = Number(settings.get('n')), k = Number(settings.get('k'));
    const cycles = Number(settings.get('cycles')), planted = settings.get('graph') === 'planted';
    const transport = settings.get('transport') === 'on';
    summary.hidden = true;
    view.hidden = true;
    displayed = null;
    frames = null;
    busy(true);
    status.textContent = 'Building the graph…';
    try {
      const graph = experimentGraph(n, k, Number(settings.get('seed')), planted, rng);
      marks = graph.marks;
      const random = rng(Number(settings.get('start')) * 104729 + 11);
      const start = new Float64Array(3 * n);
      for (let v = 0; v < n; v++) {
        const z = 2 * random() - 1, phi = 2 * Math.PI * random(), radius = Math.sqrt(1 - z * z);
        start.set([radius * Math.cos(phi), radius * Math.sin(phi), z], 3 * v);
      }
      frames = {start};
      view.hidden = false;
      setFrame('start');
      active = workerClient();
      await active.call('graph', {N: n, adj: graph.adj});
      if (transport) await active.call('mesh', {level: 2});
      let X = start;
      const p = {kind: 'layout', rest: 10, stiff: 5, repC: 0, repS: 30, mu2: 10, mu1: 0,
        f2: [-16, .1, 0, 1], f1: [0, 0, 0, 0], steps: 120, maxMove: 1, every: 121};
      for (let cycle = 1; cycle <= cycles; cycle++) {
        status.textContent = `Running cycle ${cycle} of ${cycles}…`;
        if (transport) {
          const {nu} = await active.call('density', {X, rho: 45, sig: 15, floor: .2});
          const {Y} = await active.call('transport', {X, nu, eps: .03, iters: 150});
          X = Y;
        }
        ({X} = await active.call('relax', {X, p}));
        displayed = X;
        draw();
      }
      const initial = summarizeCorners(kmeans4(start, n).lab, marks);
      const final = kmeans4(X, n);
      const measured = summarizeCorners(final.lab, marks);
      frames.end = X;
      frames.labels = final.lab;
      setFrame('end');
      const tally = stats => `${stats.counts[stats.best]} of ${k} marks in one cluster (${chanceText(stats.tail)} chance of at least this many in any cluster)`;
      const ranking = planted ? firstTriangleRanks(graph.adj, marks, X) : null;
      document.getElementById('experimentBefore').textContent = tally(initial);
      document.getElementById('experimentAfter').textContent = tally(measured);
      document.getElementById('experimentRanks').textContent = ranking
        ? `First planted triangle out of ${ranking.total.toLocaleString()}: ${ranking.graph.toLocaleString()} with signed codegree, ${ranking.geometry.toLocaleString()} with the compactness bonus.`
        : 'Gold marks a random set on this unplanted graph.';
      summary.hidden = false;
      status.textContent = `Finished ${cycles} ${cycles === 1 ? 'cycle' : 'cycles'} ${transport ? 'with' : 'without'} transport.`;
    } catch (error) {
      status.textContent = error.message;
    } finally {
      active?.close();
      active = null;
      busy(false);
    }
  });
}
