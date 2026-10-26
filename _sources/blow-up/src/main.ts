import katex from "katex";
import "katex/dist/katex.min.css";

// Display equations are written in TeX inside <div class="eq tex"> and typeset here.
for (const el of document.querySelectorAll<HTMLElement>(".eq.tex")) {
  katex.render(el.textContent ?? "", el, { displayMode: true, throwOnError: false });
}

// Every page loads the same figure code. Each figure looks for its own
// elements and does nothing when they are absent, so a page only pays for
// the figures it actually contains.
//
// Load order matters: core.js defines the shared helpers (window.__E),
// physics.js runs last because it starts the shared animation loop.
import "./figures/core.js";
import "./figures/geometry.js";
import "./figures/learning.js";
import "./figures/physics.js";
