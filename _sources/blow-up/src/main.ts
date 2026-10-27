import katex from "katex";
import "katex/dist/katex.min.css";
import renderMathInElement from "katex/contrib/auto-render";

function renderEquations() {
  // Display equations are written in TeX inside <div class="eq tex"> and typeset here.
  for (const el of document.querySelectorAll<HTMLElement>(".eq.tex")) {
    if (!el.querySelector(".katex")) {
      katex.render(el.textContent ?? "", el, { displayMode: true, throwOnError: false });
    }
  }

  // Render inline math $...$ and display math $$...$$
  if (document.body) {
    renderMathInElement(document.body, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "\\[", right: "\\]", display: true },
        { left: "$", right: "$", display: false },
        { left: "\\(", right: "\\)", display: false },
      ],
      ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code", "option"],
      ignoredClasses: ["eq", "katex"],
      throwOnError: false,
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", renderEquations);
} else {
  renderEquations();
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
import "./figures/manifolds.js";

import "./figures/nash-three.js";

import "./figures/toric-slice.js";
import "./figures/nash-three-section.js";
import "./figures/exceptional.js";
import "./figures/nash-three-resolution.js";
import "./figures/learning-story.js";
