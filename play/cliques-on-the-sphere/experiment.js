'use strict';

function setupSphereExperiment({drawSphere, kmeans4, summarizeCorners, chanceText, bindRotation, rng}) {
  const form = document.getElementById('experimentForm');
  const canvas = document.getElementById('experimentSphere');
  const stage = canvas.parentElement;
  const view = stage.parentElement;
  const status = document.getElementById('experimentStatus');
  const summary = document.getElementById('experimentSummary');
  const progress = document.getElementById('experimentProgress');
  const vertices = form.elements.namedItem('n');
  const marked = form.elements.namedItem('k');
  function updateMarkLimit() {
    if (vertices.validity.valid) marked.max = Math.min(64, Math.floor(vertices.valueAsNumber / 4));
  }
  vertices.addEventListener('input', updateMarkLimit);
  updateMarkLimit();
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
    progress.hidden = !value;
    runButton.disabled = value;
    stopButton.disabled = !value;
    for (const field of form.querySelectorAll('input, select')) field.disabled = value;
    for (const button of viewButtons) button.disabled = value || !frames?.end;
  }

  function workerClient() {
    const source = `(${installGraphTransportWorker.toString()})(self, ${rng.toString()});`;
    const url = URL.createObjectURL(new Blob([source], {type: 'text/javascript'}));
    const worker = new Worker(url);
    URL.revokeObjectURL(url);
    let pending;
    worker.onmessage = ({data}) => {
      if (!pending) return;
      if (data.frame) { pending.onFrame?.(data); return; }
      if (data.error) pending.reject(new Error(data.error));
      else pending.resolve(data);
      pending = null;
    };
    worker.onerror = event => {
      pending?.reject(new Error(event.message || 'The solver worker could not start.'));
      pending = null;
    };
    return {
      call(cmd, data, onFrame) {
        return new Promise((resolve, reject) => {
          pending = {resolve, reject, onFrame};
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
    const cycles = Number(settings.get('cycles')), steps = Number(settings.get('steps'));
    const planted = settings.get('graph') === 'planted';
    progress.max = cycles * steps;
    progress.value = 0;
    const transport = settings.get('transport') === 'on';
    summary.hidden = true;
    view.hidden = true;
    displayed = null;
    frames = null;
    busy(true);
    status.textContent = 'Building the graph…';
    try {
      active = workerClient();
      ({marks} = await active.call('sample', {N: n, k, seed: Number(settings.get('seed')), planted}));
      const random = rng(Number(settings.get('start')) * 104729 + 11);
      const start = new Float64Array(3 * n);
      for (let v = 0; v < n; v++) {
        const z = 2 * random() - 1, phi = 2 * Math.PI * random(), radius = Math.sqrt(1 - z * z);
        start.set([radius * Math.cos(phi), radius * Math.sin(phi), z], 3 * v);
      }
      frames = {start};
      view.hidden = false;
      setFrame('start');
      if (transport) {
        status.textContent = 'Preparing the transport mesh…';
        await active.call('mesh', {level: 2});
      }
      let X = start;
      const p = {kind: 'layout', rest: 10, stiff: 5, repC: 0, repS: 30, mu2: 10, mu1: 0,
        f2: [-16, .1, 0, 1], f1: [0, 0, 0, 0], steps, maxMove: 1,
        every: n >= 512 ? 1 : Math.max(1, Math.ceil(steps / 12)), finalEnergy: false};
      for (let cycle = 1; cycle <= cycles; cycle++) {
        const phase = `Cycle ${cycle} of ${cycles}`;
        if (transport) {
          status.textContent = `${phase} · counting small triangles…`;
          const {nu} = await active.call('density', {X, rho: 45, sig: 15, floor: .2});
          status.textContent = `${phase} · transporting vertices…`;
          const {Y} = await active.call('transport', {X, nu, eps: .03, iters: 150});
          X = Y;
        }
        status.textContent = `${phase} · relaxing 0 of ${steps} steps…`;
        ({X} = await active.call('relax', {X, p}, ({frame, t}) => {
          progress.value = (cycle - 1) * steps + t;
          status.textContent = `${phase} · relaxing ${t} of ${steps} steps…`;
          displayed = frame;
          draw();
        }));
        progress.value = cycle * steps;
        displayed = X;
        draw();
      }
      let ranking;
      if (planted) {
        status.textContent = 'Ranking the graph triangles…';
        ({ranking} = await active.call('rank', {X}));
      }
      const initial = summarizeCorners(kmeans4(start, n).lab, marks);
      const final = kmeans4(X, n);
      const measured = summarizeCorners(final.lab, marks);
      frames.end = X;
      frames.labels = final.lab;
      setFrame('end');
      for (const [suffix, stats] of [['Before', initial], ['After', measured]]) {
        document.getElementById(`experiment${suffix}`).textContent = `${stats.counts[stats.best]} of ${k}`;
        document.getElementById(`experiment${suffix}Chance`).textContent = chanceText(stats.tail);
      }
      document.getElementById('experimentRanking').hidden = !planted;
      document.getElementById('experimentNullNote').hidden = planted;
      if (ranking) {
        document.getElementById('experimentGraphRank').textContent = ranking.graph.toLocaleString();
        document.getElementById('experimentGeometryRank').textContent = ranking.geometry.toLocaleString();
        document.getElementById('experimentRankNote').textContent = `There are ${ranking.total.toLocaleString()} graph triangles. Position 1 means the first triangle tried was entirely in the clique.`;
      }
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
