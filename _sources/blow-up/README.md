# What is… a blowup?

An interactive essay on resolution of singularities, written from the point of view of a graphics and physics-simulation researcher: what a blowup is, what it does to colliding balls, tensor fits and cross fields, and why singular learning theory needs it.

Published at **https://foolzone.com/hironaka-blow-up/**.

| Page | File | Contents |
| --- | --- | --- |
| Overview | `index.html` | The opening demo, why this exists, contents |
| Part I | `part-1.html` | Crossing, touching and cusp singularities; Hironaka and Nash; noisy data |
| Part II | `part-2.html` | Blowups in simulation: collisions, tensor factorization, frame fields, each opening with a demo |
| Part III | `part-3.html` | Singular learning theory, built around the local learning coefficient |
| Appendices | `appendix.html` | A: collisions; B: tensors; C: WBIC and the thermometer's temperature; references |
| Companion notes | `public/extras/*.html` | Three older standalone pages (blowups in physics, two ways to blow up, resolving Newton's cradle), copied as-is |

## Develop

Requires Node 22.

```sh
npm install
npm run dev        # http://localhost:4174
npm run check      # type-check, build to dist/, then check links and figure numbers
npm run preview    # serve dist/
```

## How it is put together

- **Pages are plain HTML.** Each page is a Vite entry (listed in `PAGES` in `vite.config.ts`). Text, captions and the markup for every figure panel live in the page files.
- **Equations are TeX.** A display equation is written `<div class="eq tex">…TeX…</div>` and typeset by KaTeX when the page loads (`src/main.ts`).
- **Figures are numbered automatically.** Never write a figure number. A caption is written `<b>Figure {fig:cradle}.</b>` and a reference `Figure {fig:cradle}`. The `figure-numbers` plugin in `vite.config.ts` numbers captions in reading order across all pages and fails the build if a reference has no caption. Keys like `A1`, `B2` or `C1` are appendix figures and keep their labels.
- **Figure code** is in `src/figures/`, loaded on every page by `src/main.ts`:
  - `core.js`: shared helpers (exported as `window.__E`), Part I's opening figures, the cradle, the wedge and the impact table.
  - `geometry.js`: the 3D view, the blowup ladder, weighted blowups, the Kollár–Włodarczyk loop, noisy data, the cubic-surface figure.
  - `learning.js`: tensor figures, learning coefficients, the LLC thermometer and the WBIC figure, Part III's demos.
  - `physics.js`: inelastic collapse, cross fields and Ginzburg–Landau, and the shared animation loop. It must load last.

  Every figure looks up its own elements and returns early when they are absent, so each page runs only its own figures. Animations run only while their figure is on screen. The figure code is plain JavaScript; `tsconfig.json` allows it without type-checking it.
- **Theme.** Colors are CSS variables in `src/style.css`, with a dark palette under `prefers-color-scheme: dark`. Figures read the variables at draw time and redraw when the theme changes.

## Publish

This copy is maintained with the personal website in `the13fools/the13fools.github.io`. Its source is in `_sources/blow-up/` and its generated public files are in `hironaka-blow-up/` at the repository root.

From the website repository root, install dependencies once with `npm ci --prefix _sources/blow-up`, then run `node tools/build-blow-up.mjs`. This runs the essay’s type check, production build, link audit and figure-number checks before copying the checked output into `hironaka-blow-up/`. Commit both the source edits and generated output, and push to `master` to publish through the existing GitHub Pages deployment.

The original standalone workflow templates are retained in `workflows/` for a future separate repository. They are not active in this publication.

## Credits

Josh, with Chart (Claude Opus 5.5) and Gemini Argon.
