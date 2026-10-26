(() => {
  "use strict";

  function initManifolds() {
    const canvasH = document.getElementById("canvas-hiro");
    const canvasN = document.getElementById("canvas-nash");
    if (!canvasH || !canvasN) return;

    let currStep = 0;
    let currSing = "tacnode";

    let rotX = -0.38, rotY = 0.65, zoom = 1.35;
    let isDragH = false, lastMXH = 0, lastMYH = 0;
    let isDragN = false, lastMXN = 0, lastMYN = 0;

    const singularities = {
      tacnode: {
        name: "A₃ Tacnodal 3-Manifold",
        formula: "x² + y² = z⁴ + w⁴",
        formulaBadge: "x² + y² = z⁴ + w⁴",
        desc: "Two parabolic cones kissing with 2nd-order tangency at (0,0,0,0).",
        hiroRadius: (z, th, s) => {
          if (s === 0) return z * z;
          if (s === 1) return Math.sqrt(0.35 + Math.pow(z, 4));
          return Math.sqrt(0.85 + Math.pow(z, 4));
        },
        nashRadius: (z, th, s) => {
          if (s === 0 || s === 3) return z * z;
          if (s === 1) return z * z * (1 + 0.35 * Math.cos(3 * th) * Math.abs(z));
          return z * z * (1 + 0.3 * Math.sin(4 * th) * Math.abs(z));
        },
        steps: [
          {
            name: "Initial Tacnode: Kissing Parabolas (r = 0)",
            hiro: {
              header: "Step 0: Kissing Parabolas (r = 0)",
              waist: "Throat: 0.00",
              statRadius: "r = 0.00 (Kissing Pinch)",
              statStatus: "2nd-order tangency at apex",
              desc: "Initial A₃ Tacnodal 3-manifold: x² + y² = z⁴ + w⁴. Two branches kiss with 2nd-order tangency (r = z²)."
            },
            nash: {
              header: "Step 0: Kissing Parabolas (r = 0)",
              waist: "Throat: 0.00",
              statRadius: "r = 0.00 (Kissing Pinch)",
              statStatus: "Rank drops to 0 at apex",
              desc: "Two branches kiss with order-2 contact. Tangent hyperplanes coincide, creating a highly degenerate singularity."
            }
          },
          {
            name: "Blowup 1: First Throat Expansion vs. Tangent Fold",
            hiro: {
              header: "Hironaka Step 1: Throat Expands (R₁ = 0.59)",
              waist: "Throat: 0.59",
              statRadius: "R₁ = 0.59 (Throat Opened!)",
              statStatus: "Factor out ρ²: waist expands",
              desc: "First blowup factors out ρ². The waist opens into a cylinder of radius R₁ = 0.59, revealing exceptional divisor ring E₁!"
            },
            nash: {
              header: "Nash Step 1: Cuspidal Tangent Fold",
              waist: "Throat: 0.00",
              statRadius: "r = 0.00 (Pinch Closed)",
              statStatus: "Gauss map folds in Gr(3,4)",
              desc: "Because the branches kiss, their 4D normals fold over each other. The waist remains strictly at r = 0.00."
            }
          },
          {
            name: "Blowup 2: Full Separation vs. Crease Rotation",
            hiro: {
              header: "Hironaka Step 2: Branches Separated (R₂ = 0.92)",
              waist: "Throat: 0.92",
              statRadius: "R₂ = 0.92 (Dual Divisors)",
              statStatus: "E₁ and E₂ simple normal crossing",
              desc: "Second blowup un-kisses the two branches completely. Dual glowing exceptional rings E₁ & E₂ ensure simple normal crossings."
            },
            nash: {
              header: "Nash Step 2: Rotated Fold in Gr(3,4)",
              waist: "Throat: 0.00",
              statRadius: "r = 0.00 (Persistent Pinch)",
              statStatus: "Singularity rotates combinatorial rays",
              desc: "Second normalized Nash iteration rotates the crease, but the pinch point refuses to open. Multiplicity remains ≥ 2."
            }
          },
          {
            name: "Step 3: Complete Resolution vs. Infinite Cycle",
            hiro: {
              header: "Hironaka Step 3: FULL RESOLUTION ✓",
              waist: "RESOLVED ✓",
              statRadius: "R = 0.92 (Smooth Manifold)",
              statStatus: "100% Smooth Everywhere",
              desc: "Resolution is complete! The kissing singularity is fully eliminated; standard calculus is restored everywhere."
            },
            nash: {
              header: "Nash Step 3: INFINITE CYCLE (M³₃ ≅ M³₀)",
              waist: "TRAPPED LOOP",
              statRadius: "r = 0.00 (Regenerated)",
              statStatus: "Infinite Periodic Loop Detected",
              desc: "M³₃ is combinatorially isomorphic to M³₀! The higher-order pinch regenerated itself. Nash is permanently trapped!"
            }
          }
        ]
      },
      cubic: {
        name: "Ishii–Kollár Fermat Cubic",
        formula: "x³ + y³ + z³ + w³ = 0",
        formulaBadge: "x³ + y³ + z³ + w³ = 0",
        desc: "A degree-3 Fermat 3-fold cone with 3-lobed fluted symmetry and 27 lines.",
        hiroRadius: (z, th, s) => {
          let lobe = 1 + 0.25 * Math.cos(3 * th);
          if (s === 0) return Math.abs(z) * lobe;
          return Math.sqrt(0.75 + z * z) * lobe;
        },
        nashRadius: (z, th, s) => {
          let lobe = 1 + 0.25 * Math.cos(3 * th);
          if (s === 0 || s === 3) return Math.abs(z) * lobe;
          return Math.abs(z) * (1 + 0.3 * Math.cos(3 * th + s * 1.5));
        },
        steps: [
          {
            name: "Initial Fermat Cubic Cone",
            hiro: {
              header: "Step 0: 3-Lobed Fluted Cone",
              waist: "Throat: 0.00",
              statRadius: "r = 0.00 (Triple Point)",
              statStatus: "Order-3 apex singularity",
              desc: "The Fermat cubic cone has 3 fluted lobes meeting at (0,0,0,0)."
            },
            nash: {
              header: "Step 0: 3-Lobed Fluted Cone",
              waist: "Throat: 0.00",
              statRadius: "r = 0.00 (Triple Point)",
              statStatus: "Order-3 apex singularity",
              desc: "The Fermat cubic cone has 3 fluted lobes meeting at (0,0,0,0)."
            }
          },
          {
            name: "Blowup 1: Fluted Throat Opens",
            hiro: {
              header: "Hironaka Step 1: Fluted Throat Opens",
              waist: "Throat: 0.87",
              statRadius: "R = 0.87 (Smooth Fluted Throat)",
              statStatus: "Factors out ρ³",
              desc: "Factoring out ρ³ leaves X³ + Y³ + Z³ = 1, opening the waist into a 3-lobed smooth Fermat cubic throat!"
            },
            nash: {
              header: "Nash Step 1: 3-Axis Tangent Fold",
              waist: "Throat: 0.00",
              statRadius: "r = 0.00 (Pinch Closed)",
              statStatus: "Normals fold along 3 lobes",
              desc: "Tangents fold along the 3 lobes, preserving the central triple point."
            }
          },
          {
            name: "Blowup 2: Exceptional Divisor Stabilized",
            hiro: {
              header: "Hironaka Step 2: Exceptional Divisor Stabilized",
              waist: "Throat: 0.87",
              statRadius: "R = 0.87 (Smooth Surface)",
              statStatus: "Divisor E smooth cubic 2-fold",
              desc: "The exceptional divisor is a smooth cubic surface containing 27 lines."
            },
            nash: {
              header: "Nash Step 2: Tangents Twisted",
              waist: "Throat: 0.00",
              statRadius: "r = 0.00 (Pinch Closed)",
              statStatus: "Trapped in 3-fold orbit",
              desc: "The Gauss map twists in Gr(3,4), cycling toward the starting cone."
            }
          },
          {
            name: "Step 3: Outcome (Cubic)",
            hiro: {
              header: "Hironaka Step 3: FULL RESOLUTION ✓",
              waist: "RESOLVED ✓",
              statRadius: "R = 0.87 (Smooth Fermat)",
              statStatus: "Fully resolved smooth 3-manifold",
              desc: "The Fermat cubic cone is resolved into a smooth 3-manifold."
            },
            nash: {
              header: "Nash Step 3: INFINITE CYCLE (M³₃ ≅ M³₀)",
              waist: "TRAPPED LOOP",
              statRadius: "r = 0.00 (Regenerated)",
              statStatus: "Loop detected",
              desc: "Ishii–Kollár: Arc families fail to hit the exceptional divisor. Nash regenerates the singularity."
            }
          }
        ]
      },
      brieskorn: {
        name: "Brieskorn Cusp 3-Manifold",
        formula: "x² + y² = z³ + w²",
        formulaBadge: "x² + y² = z³ + w²",
        desc: "An asymmetric cusp variety with fractional order scaling.",
        hiroRadius: (z, th, s) => {
          let base = Math.pow(Math.abs(z), 1.5);
          if (s === 0) return base;
          return Math.sqrt(0.75 + Math.pow(Math.abs(z), 3));
        },
        nashRadius: (z, th, s) => {
          let base = Math.pow(Math.abs(z), 1.5);
          if (s === 0 || s === 3) return base;
          return base * (1 + 0.25 * Math.cos(2 * th));
        },
        steps: [
          {
            name: "Initial Brieskorn Cusp",
            hiro: {
              header: "Step 0: Asymmetric Cusp Pinch",
              waist: "Throat: 0.00",
              statRadius: "r = 0.00 (Cusp Tip)",
              statStatus: "Fractional 3/2 cusp",
              desc: "Brieskorn variety with fractional scaling exponent."
            },
            nash: {
              header: "Step 0: Asymmetric Cusp Pinch",
              waist: "Throat: 0.00",
              statRadius: "r = 0.00 (Cusp Tip)",
              statStatus: "Gauss map undefined",
              desc: "The fractional cusp forces the tangent plane to flip 180° at the tip."
            }
          },
          {
            name: "Blowup 1: Weighted Neck Open",
            hiro: {
              header: "Hironaka Step 1: Weighted Neck Excavated",
              waist: "Throat: 0.87",
              statRadius: "R = 0.87 (Excavated)",
              statStatus: "Newton weights (2,3,2)",
              desc: "Weighted blowup removes the cusp in one step, restoring smooth curvature."
            },
            nash: {
              header: "Nash Step 1: Blade Crease",
              waist: "Throat: 0.00",
              statRadius: "r = 0.00 (Blade Tip)",
              statStatus: "Persistent cuspidal tip",
              desc: "Nash turns the round cusp into a sharp knife blade, still singular at the edge."
            }
          },
          {
            name: "Blowup 2: Curvature Smoothed",
            hiro: {
              header: "Hironaka Step 2: Normal Crossings",
              waist: "Throat: 0.87",
              statRadius: "R = 0.87 (Transversal)",
              statStatus: "Transversal divisors",
              desc: "Exceptional divisors intersect transversally."
            },
            nash: {
              header: "Nash Step 2: Crease Inversion",
              waist: "Throat: 0.00",
              statRadius: "r = 0.00 (Creased)",
              statStatus: "Inverted edge",
              desc: "The knife blade inverts its orientation; the singularity persists."
            }
          },
          {
            name: "Step 3: Outcome (Brieskorn)",
            hiro: {
              header: "Hironaka Step 3: FULL RESOLUTION ✓",
              waist: "RESOLVED ✓",
              statRadius: "R = 0.87 (Smooth Manifold)",
              statStatus: "100% Smooth",
              desc: "Brieskorn variety successfully resolved."
            },
            nash: {
              header: "Nash Step 3: INFINITE CYCLE (M³₃ ≅ M³₀)",
              waist: "TRAPPED LOOP",
              statRadius: "r = 0.00 (Blade Returns)",
              statStatus: "Cycle closed",
              desc: "The blade configuration returns to its initial shape."
            }
          }
        ]
      },
      conifold: {
        name: "A₁ Conifold (Standard Double Cone)",
        formula: "x² + y² − z² − w² = 0",
        formulaBadge: "x² + y² = z²",
        desc: "The standard quadratic conical double point in 4D (ordinary double point).",
        hiroRadius: (z, th, s) => {
          if (s === 0) return Math.abs(z);
          return Math.sqrt(0.85 + z * z);
        },
        nashRadius: (z, th, s) => {
          if (s === 0 || s === 3) return Math.abs(z);
          return Math.abs(z) * (1 + 0.3 * Math.cos(2 * th));
        },
        steps: [
          {
            name: "Initial A₁ Conifold Pinch",
            hiro: {
              header: "Step 0: Ordinary Double Cone",
              waist: "Throat: 0.00",
              statRadius: "r = 0.00 (Apex Pinch)",
              statStatus: "Isolated quadratic node",
              desc: "Standard conical apex where top and bottom nappes meet at a single point."
            },
            nash: {
              header: "Step 0: Ordinary Double Cone",
              waist: "Throat: 0.00",
              statRadius: "r = 0.00 (Apex Pinch)",
              statStatus: "Isolated quadratic node",
              desc: "The cone of tangent hyperplanes has an isolated singular apex."
            }
          },
          {
            name: "Blowup 1: Small Resolution (Throat Opens)",
            hiro: {
              header: "Hironaka Step 1: Resolved Hyperboloid",
              waist: "Throat: 0.92",
              statRadius: "R = 0.92 (Smooth Hyperboloid)",
              statStatus: "Exceptional S² sphere",
              desc: "The cone opens into a smooth one-sheeted hyperboloid. The apex is replaced by an exceptional 2-sphere S²!"
            },
            nash: {
              header: "Nash Step 1: Elliptic Deformation",
              waist: "Throat: 0.00",
              statRadius: "r = 0.00 (Elliptic Cone)",
              statStatus: "Apex preserved",
              desc: "Nash perturbs the circular cone into an elliptical cross section without opening the waist."
            }
          },
          {
            name: "Blowup 2: Toric Fans Aligned",
            hiro: {
              header: "Hironaka Step 2: Smooth Calabi–Yau",
              waist: "Throat: 0.92",
              statRadius: "R = 0.92 (Stabilized)",
              statStatus: "Smooth toric variety",
              desc: "The resolution is minimal and smooth, matching the deformed conifold in string theory."
            },
            nash: {
              header: "Nash Step 2: Second Axis Twist",
              waist: "Throat: 0.00",
              statRadius: "r = 0.00 (Pinch Closed)",
              statStatus: "Axes re-orienting",
              desc: "The elliptical cone twists along the w-axis."
            }
          },
          {
            name: "Step 3: Outcome (Conifold)",
            hiro: {
              header: "Hironaka Step 3: FULL RESOLUTION ✓",
              waist: "RESOLVED ✓",
              statRadius: "R = 0.92 (Smooth Throat)",
              statStatus: "100% Smooth Calabi–Yau",
              desc: "The conifold is completely resolved into a smooth manifold."
            },
            nash: {
              header: "Nash Step 3: INFINITE CYCLE (M³₃ ≅ M³₀)",
              waist: "TRAPPED LOOP",
              statRadius: "r = 0.00 (Cycle Complete)",
              statStatus: "4-step limit cycle closed",
              desc: "The elliptical cone rotates back into the round cone M³₀. Infinite cycle!"
            }
          }
        ]
      }
    };

    function project(p, width, height) {
      let x = p[0], y = p[1], z = p[2];
      let cosY = Math.cos(rotY), sinY = Math.sin(rotY);
      let x1 = x * cosY - z * sinY;
      let z1 = x * sinY + z * cosY;
      let cosX = Math.cos(rotX), sinX = Math.sin(rotX);
      let y2 = y * cosX - z1 * sinX;
      let z2 = y * sinX + z1 * cosX;
      let fov = 4.0;
      let d = fov + z2;
      let px = (x1 / d) * zoom * Math.min(width, height) * 0.55 + width / 2;
      let py = (-y2 / d) * zoom * Math.min(width, height) * 0.55 + height / 2;
      return { x: px, y: py, depth: z2 };
    }

    function render3D(canvas, isHironaka) {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const W = (canvas.width = rect.width * dpr);
      const H = (canvas.height = rect.height * dpr);
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, W, H);

      const sing = singularities[currSing];
      const radiusFn = isHironaka ? sing.hiroRadius : sing.nashRadius;

      const N_Z = 28;
      const N_TH = 36;
      const zMin = -1.2, zMax = 1.2;

      let grid = [];
      for (let i = 0; i <= N_Z; i++) {
        let row = [];
        let t = i / N_Z;
        let z = zMin + t * (zMax - zMin);
        for (let j = 0; j <= N_TH; j++) {
          let th = (j / N_TH) * Math.PI * 2;
          let r = radiusFn(z, th, currStep);
          let x = r * Math.cos(th);
          let y = r * Math.sin(th);
          row.push([x, z, y]);
        }
        grid.push(row);
      }

      let quads = [];
      for (let i = 0; i < N_Z; i++) {
        for (let j = 0; j < N_TH; j++) {
          let p0 = grid[i][j];
          let p1 = grid[i + 1][j];
          let p2 = grid[i + 1][j + 1];
          let p3 = grid[i][j + 1];

          let center = [
            (p0[0] + p1[0] + p2[0] + p3[0]) / 4,
            (p0[1] + p1[1] + p2[1] + p3[1]) / 4,
            (p0[2] + p1[2] + p2[2] + p3[2]) / 4
          ];

          let v1 = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]];
          let v2 = [p3[0] - p0[0], p3[1] - p0[1], p3[2] - p0[2]];
          let nx = v1[1] * v2[2] - v1[2] * v2[1];
          let ny = v1[2] * v2[0] - v1[0] * v2[2];
          let nz = v1[0] * v2[1] - v1[1] * v2[0];
          let len = Math.hypot(nx, ny, nz) || 1;
          nx /= len; ny /= len; nz /= len;

          let lx = 0.577, ly = 0.577, lz = 0.577;
          let dot = nx * lx + ny * ly + nz * lz;
          let light = Math.max(0.18, Math.min(0.95, 0.45 + 0.55 * dot));

          let proj = [project(p0, W, H), project(p1, W, H), project(p2, W, H), project(p3, W, H)];
          let avgDepth = (proj[0].depth + proj[1].depth + proj[2].depth + proj[3].depth) / 4;

          quads.push({
            proj,
            depth: avgDepth,
            light,
            z: center[1],
            isWaist: Math.abs(center[1]) < 0.12
          });
        }
      }

      quads.sort((a, b) => b.depth - a.depth);

      for (let q of quads) {
        ctx.beginPath();
        ctx.moveTo(q.proj[0].x, q.proj[0].y);
        ctx.lineTo(q.proj[1].x, q.proj[1].y);
        ctx.lineTo(q.proj[2].x, q.proj[2].y);
        ctx.lineTo(q.proj[3].x, q.proj[3].y);
        ctx.closePath();

        let rCol, gCol, bCol;
        if (isHironaka) {
          if (currStep > 0 && q.isWaist) {
            rCol = Math.round(50 + 200 * q.light);
            gCol = Math.round(180 + 75 * q.light);
            bCol = Math.round(220 + 35 * q.light);
          } else {
            rCol = Math.round(16 + 120 * q.light);
            gCol = Math.round(75 + 160 * q.light);
            bCol = Math.round(55 + 130 * q.light);
          }
        } else {
          if (q.isWaist) {
            rCol = Math.round(200 + 55 * q.light);
            gCol = Math.round(30 + 50 * q.light);
            bCol = Math.round(60 + 60 * q.light);
          } else {
            rCol = Math.round(120 + 130 * q.light);
            gCol = Math.round(35 + 60 * q.light);
            bCol = Math.round(50 + 70 * q.light);
          }
        }

        ctx.fillStyle = `rgb(${rCol}, ${gCol}, ${bCol})`;
        ctx.fill();

        ctx.strokeStyle = `rgba(0, 0, 0, 0.2)`;
        ctx.lineWidth = 0.5 * dpr;
        ctx.stroke();
      }

      // Draw exceptional divisor rings
      if (isHironaka && currStep > 0) {
        ctx.lineWidth = 2.5 * dpr;
        ctx.strokeStyle = "#38bdf8";
        ctx.shadowColor = "#0284c7";
        ctx.shadowBlur = 10 * dpr;

        for (let ringZ of currStep === 1 ? [0] : [-0.25, 0.25]) {
          ctx.beginPath();
          for (let j = 0; j <= N_TH; j++) {
            let th = (j / N_TH) * Math.PI * 2;
            let r = radiusFn(ringZ, th, currStep);
            let pt = project([r * Math.cos(th), ringZ, r * Math.sin(th)], W, H);
            if (j === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
          }
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
      }
    }

    function updateView() {
      const sing = singularities[currSing];
      const stepData = sing.steps[currStep];

      // Update Header & Badge
      const stepBadge = document.getElementById("step-badge");
      const stepName = document.getElementById("step-name");
      if (stepBadge) stepBadge.textContent = `Step ${currStep} / 3`;
      if (stepName) stepName.textContent = stepData.name;

      // Update Step Pills
      for (let s = 0; s <= 3; s++) {
        const pill = document.getElementById(`pill-step-${s}`);
        if (!pill) continue;
        if (s === currStep) {
          pill.style.borderColor = "var(--good)";
          pill.style.background = "color-mix(in srgb, var(--good) 15%, transparent)";
          pill.style.color = "var(--ink)";
          pill.style.fontWeight = "700";
        } else {
          pill.style.borderColor = "var(--rule)";
          pill.style.background = "var(--surface)";
          pill.style.color = "var(--muted)";
          pill.style.fontWeight = "500";
        }
      }

      // Update Hironaka Info
      const hHead = document.getElementById("hiro-header");
      const hWaist = document.getElementById("hiro-waist-badge");
      const hRadius = document.getElementById("hiro-stat-radius");
      const hStatus = document.getElementById("hiro-stat-status");
      const hDesc = document.getElementById("hiro-stat-desc");
      const hBanner = document.getElementById("hiro-success-banner");

      if (hHead) hHead.textContent = stepData.hiro.header;
      if (hWaist) hWaist.textContent = stepData.hiro.waist;
      if (hRadius) hRadius.textContent = stepData.hiro.statRadius;
      if (hStatus) hStatus.textContent = stepData.hiro.statStatus;
      if (hDesc) hDesc.textContent = stepData.hiro.desc;
      if (hBanner) hBanner.style.display = currStep === 3 ? "block" : "none";

      // Update Nash Info
      const nHead = document.getElementById("nash-header");
      const nWaist = document.getElementById("nash-waist-badge");
      const nRadius = document.getElementById("nash-stat-radius");
      const nStatus = document.getElementById("nash-stat-status");
      const nDesc = document.getElementById("nash-stat-desc");
      const nBanner = document.getElementById("nash-cycle-banner");

      if (nHead) nHead.textContent = stepData.nash.header;
      if (nWaist) nWaist.textContent = stepData.nash.waist;
      if (nRadius) nRadius.textContent = stepData.nash.statRadius;
      if (nStatus) nStatus.textContent = stepData.nash.statStatus;
      if (nDesc) nDesc.textContent = stepData.nash.desc;
      if (nBanner) nBanner.style.display = currStep === 3 ? "block" : "none";

      // Render Canvases
      render3D(canvasH, true);
      render3D(canvasN, false);
    }

    // Hook events
    function setStep(s) {
      currStep = Math.max(0, Math.min(3, s));
      updateView();
    }

    function setSingularity(singKey) {
      if (!singularities[singKey]) return;
      currSing = singKey;
      currStep = 0;

      // Update Singularity Button states
      ["tacnode", "cubic", "brieskorn", "conifold"].forEach((k) => {
        const btn = document.getElementById(`btn-sing-${k}`);
        if (!btn) return;
        if (k === singKey) {
          btn.style.borderColor = "var(--blow)";
          btn.style.color = "var(--blow)";
          btn.style.fontWeight = "700";
        } else {
          btn.style.borderColor = "var(--rule)";
          btn.style.color = "var(--muted)";
          btn.style.fontWeight = "500";
        }
      });

      const formulaBadge = document.getElementById("sing-formula-badge");
      if (formulaBadge) formulaBadge.textContent = singularities[singKey].formulaBadge;

      updateView();
    }

    // Export globally for inline onclick handlers
    window.setStep = setStep;
    window.setSingularity = setSingularity;

    // Attach button click listeners
    for (let s = 0; s <= 3; s++) {
      document.getElementById(`pill-step-${s}`)?.addEventListener("click", () => setStep(s));
    }
    document.getElementById("btn-step-prev")?.addEventListener("click", () => setStep(currStep - 1));
    document.getElementById("btn-step-next")?.addEventListener("click", () => setStep(currStep + 1));

    ["tacnode", "cubic", "brieskorn", "conifold"].forEach((k) => {
      document.getElementById(`btn-sing-${k}`)?.addEventListener("click", () => setSingularity(k));
    });

    // Pointer events for Canvas Hironaka
    canvasH.addEventListener("pointerdown", (e) => {
      isDragH = true;
      lastMXH = e.clientX;
      lastMYH = e.clientY;
      canvasH.setPointerCapture(e.pointerId);
    });
    canvasH.addEventListener("pointermove", (e) => {
      if (!isDragH) return;
      rotY += (e.clientX - lastMXH) * 0.008;
      rotX = Math.max(-1.4, Math.min(1.4, rotX + (e.clientY - lastMYH) * 0.008));
      lastMXH = e.clientX;
      lastMYH = e.clientY;
      updateView();
    });
    const stopDragH = () => { isDragH = false; };
    canvasH.addEventListener("pointerup", stopDragH);
    canvasH.addEventListener("pointercancel", stopDragH);

    // Pointer events for Canvas Nash
    canvasN.addEventListener("pointerdown", (e) => {
      isDragN = true;
      lastMXN = e.clientX;
      lastMYN = e.clientY;
      canvasN.setPointerCapture(e.pointerId);
    });
    canvasN.addEventListener("pointermove", (e) => {
      if (!isDragN) return;
      rotY += (e.clientX - lastMXN) * 0.008;
      rotX = Math.max(-1.4, Math.min(1.4, rotX + (e.clientY - lastMYN) * 0.008));
      lastMXN = e.clientX;
      lastMYN = e.clientY;
      updateView();
    });
    const stopDragN = () => { isDragN = false; };
    canvasN.addEventListener("pointerup", stopDragN);
    canvasN.addEventListener("pointercancel", stopDragN);

    // Initial render
    window.addEventListener("resize", () => updateView());
    setTimeout(() => updateView(), 50);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initManifolds);
  } else {
    initManifolds();
  }
})();
