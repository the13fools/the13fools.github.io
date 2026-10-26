# Foolzone

Josh Vekhter’s personal website at https://foolzone.com/, served by GitHub Pages from the root of the master branch of the13fools/the13fools.github.io.

Edit index.html and css/home.css. Images live in img/ and papers in papers/. The homepage has no build step and no third-party font or script dependencies. CNAME preserves the existing custom domain. The previous landing page is preserved at /welcome.html; existing project paths remain in place.

Local preview: python3 -m http.server 8765 --bind 127.0.0.1

## Pending source files

- papers/josh_vekhter_phd_thesis.pdf: add the file and restore its PDF link in the thesis section.
- papers/Mint3d_final.pdf: add the file and change the Mint Paper link to the local PDF if desired. The publisher page is linked in the meantime.
- img/bunny_thesis.png: img/bunny.png is used in its place.
- The original slides are approximately 198 MiB, exceeding GitHub’s 100 MiB file limit. They remain in the original public_html/papers/ backup outside this checkout. Lossless ZIP recompression still exceeds the limit. The IMA Presentation link remains available; restore a slide download link after preparing an appropriately sized deck or an external download location.

The uploaded public_html backup and recovery material are kept outside this publication checkout.

## Blow-up essay

The interactive essay is published at https://foolzone.com/play/hironaka-blow-up/. Its editable source is tracked in `_sources/blow-up/`; the checked production output is in `play/hironaka-blow-up/`. Run `npm ci --prefix _sources/blow-up` once, then `node tools/build-blow-up.mjs` from this repository root to build, audit and refresh it. Commit source and output together before publishing.
