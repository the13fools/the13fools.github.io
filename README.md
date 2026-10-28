# Foolzone

Josh Vekhter’s personal website at https://foolzone.com/, served by GitHub Pages from the root of the master branch of the13fools/the13fools.github.io.

The academic front door is `index.html` with `css/home.css`; `/research/` retains a compatible academic copy with the homepage canonical. Its Play link opens the colorful `play/index.html`, styled by `css/play.css` and `css/splash.css`. Images live in img/ and papers in papers/. These pages have no build step and no third-party font or script dependencies. CNAME preserves the existing custom domain. The previous landing page is preserved at /welcome.html; existing project paths remain in place.

Local preview: python3 -m http.server 8765 --bind 127.0.0.1

## Pending source files

- The thesis is linked from the homepage and research page to its official UT repository record: https://repositories.lib.utexas.edu/items/06db5b27-cd77-450b-b305-736ebacfbf95. Local PDF hosting is unnecessary.
- papers/Mint3d_final.pdf: add the file and change the Mint Paper link to the local PDF if desired. The publisher page is linked in the meantime.
- img/bunny_thesis.png: img/bunny.png is used in its place.
- The original slides are approximately 198 MiB, exceeding GitHub’s 100 MiB file limit. They remain in the original public_html/papers/ backup outside this checkout. Lossless ZIP recompression still exceeds the limit. The IMA Presentation link remains available; restore a slide download link after preparing an appropriately sized deck or an external download location.

The uploaded public_html backup and recovery material are kept outside this publication checkout.

## Blow-up essay

The interactive essay is published at https://foolzone.com/play/hironaka-blow-up/. Its editable source is tracked in `_sources/blow-up/`; the checked production output is in `play/hironaka-blow-up/`. Run `npm ci --prefix _sources/blow-up` once, then `node tools/build-blow-up.mjs` from this repository root to build, audit and refresh it. Commit source and output together before publishing.

## Experiments index

`/play/` is the colorful splash page leading to the current essays/labs and both Let’s Get Lost collections. The expanded directory with source links is `/play/experiments.html`. Edit those HTML files, `css/play.css`, and `css/splash.css`; no build is needed. `/lets-get-lost/index.html` gives the preserved sketches a working entrance. `/playground/` is served by its separate existing repository and retains its current address.

The index links to the existing Direction Field Lab and multiagent deployments. It does not copy or alter those projects; the budget-free Commons Game publication remains a separate backlog item. Botisattva is a separate project and is not included on the Foolzone splash or experiments index.

## Local remix workbench

`/hack/` lets a visitor edit the splash page’s actual body/CSS, a small spring simulation, or a personal-page starter. The splash links to the editor and the personal corner. `?example=homepage`, `?example=spring`, and `?example=corner` select the starting point.

Ace 1.45.2 is the initial editor component, pinned and vendored with its BSD-3-Clause license and verified npm package integrity in `vendor/ace-1.45.2/`. A plain textarea alternative is available. No build, CDN, account, or server write endpoint is used. The editor choice can change without changing the portable `foolzone-remix@1` project format.

- Run recreates an opaque-origin iframe with only `allow-scripts`; it does not grant same-origin, popups, forms, downloads, or top navigation. A preview-only CSP blocks external scripts, network connections, child frames and objects. Parent message handling checks the source frame and per-run channel; preview console content is inserted as text.
- Imported files are validated as bounded text and remain unexecuted until Run. Stop removes the running document, including its srcdoc. Scripts execute only in the browser preview; the workbench has no code-execution server.
- Save draft uses localStorage under `foolzone-remix@1/`. JSON export/import preserves the three source buffers. HTML export embeds CSS and JS, escapes closing script/style tags, and omits the preview bridge/policy. Images or other external assets are not bundled. An exported page is an ordinary user-authored page, rather than an editor sandbox.
- The small spring is a teaching sketch, not a replacement for the old course demos. Existing applications, research pages, and essay rendering are unchanged.

Checks: `node tools/check-remix.mjs`, JS syntax checks, and static link/ID audit. Browser review covered Ace edits, plain editing, run, draft save/reload, stop, original restore, opaque parent isolation, closing-tag handling, standalone HTML download and independent interaction, JSON download/import/run, and phone navigation at 390px. The user authorized publication on October 28, 2026. Josh then clarified the hierarchy: academics at `/`, with Play leading to the splash at `/play/`. The remixer’s splash starter reads `/play/index.html`.
