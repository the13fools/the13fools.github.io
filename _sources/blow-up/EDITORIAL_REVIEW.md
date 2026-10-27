# Editorial and mathematical review

## October 27 follow-up: position, direction, and the statistical question

The follow-up begins at `d696f40` and supersedes the earlier teaching structure below. Part I now builds the exceptional line from explicit position–direction records: approaching colored points coincide downstairs and remain distinct upstairs. Part II defines both constructions before asking about their success, explains why a Nash graph can itself remain singular, and compares the two routes on the same threefold. The smooth-source map precedes its optional fan proof; the fourfold remains accessible as a side trip.

Part III now follows one tensor fit into two ordinary blowups of its loss, with the exact pullback and Jacobian checked. Mechanics, border rank, and fields remain available as optional case studies. Part IV introduces the inference problem before volume and evidence; network and estimator experiments follow the core argument as an optional lab. Parameter-space axes and likelihood brightness are explained explicitly, and the cusp exponent is derived by rescaling rather than only quoted as a ratio.

The tensor collision now displays both factor vectors, both weighted rank-one contributions, their sum, and the target. The border-rank fit displays all six underlying factor vectors alongside its existing component tensors. Contributor/model labels are consistent. A shared citation registry supplies numbered links beside claims, individual bibliography entries, preprint/publication distinctions, and backlinks to each chapter. Metadata for the constructive-resolution and LLC papers was checked against primary sources; Bravo–Villamayor’s journal/title were corrected.

Validation includes the full build/math/link/TeX checks, the exact tensor pullback against eight independently computed prediction errors, and desktop/phone checks of the new controls, source map, optional calculations, citations, and tensor contributions. The threefold construction remains a complete toric resolution, not a claimed execution of ATW.

## Earlier broad pass

This pass starts from website commit `8822447`, preserving the author's restored simulation/graphics narrative and all 35 numbered main-text figures. Scope: the overview, Parts I–IV, their shared figure code, and the appendix. It is an editorial/mathematical audit with numerical regression checks, not a formal verification of every solver or of Hironaka's general algorithm.

## Teaching structure

- Start Part I with polynomial zero sets and the crossing/touching/cusp examples. Move the estimated noisy-data lift after the exact mathematics.
- Define the theorem's endpoint explicitly: smooth resolution versus the stronger embedded boundary condition. Explain why the cusp is smooth after one point blowup but needs three for the displayed embedded resolution, and why a surface triple point fails SNC.
- Explain the actual difficulties in general resolution: multiplicity can stall, the worst locus can be singular, centers must be smooth and globally compatible, and exceptional-boundary data must be retained. Preserve the worked marked-ideal reduction and references to constructive and weighted algorithms.
- Move the fourfold's duplicated algebra into an expandable calculation in Part II. Preserve the actual real zero-set sections, the threefold recurrence, and the complete toric resolution. Explain that canonical center algorithms and canonical Nash modification differ in their progress guarantee, not simply in whether they are automatic.
- Keep the applications in Part III, while distinguishing an underdetermined impact model, loss of rank of a parameter map, a nonclosed tensor image, and a topological field obstruction.
- Rebuild Part IV around volume → evidence → a computed cusp exponent → estimation → statistical payoff. Keep additional normal-crossing and WBIC calculations available in expandable sections. Add chapter routes and a reading guide.

## Mathematical corrections

- Correct the weighted chart Jacobian for `(s,d)=(r²v,r)` from `2r²` to absolute determinant `r²`.
- Correct the weighted cusp Jacobian for `(x,y)=(r²,r³v)` from `3r⁴` to `2|r|⁴`; retain its vanishing angular factors rather than dropping them.
- Derive the cusp RLCT using the actual ordinary-resolution chart `(x,y)=(t²w,t³w)`: loss `t¹²w⁴(1−w)²`, absolute Jacobian `|t|⁴|w|`, candidate ratios `5/12`, `1/2`, `1/2`. Check the complementary chart too.
- State the priors and domains in the two-evidence comparison. Distinguish the restricted tensor family from a general rank-two tensor model, and a Bayesian comparison from gradient-descent selection.
- Restore the centered/scaled thermal identity. The plateau is `β Eβ[nK]`, not `Eβ[nL]`; the logarithmic plot's area needs the base-conversion factor. WBIC is asymptotic, not an exact one-temperature quadrature identity.
- Replace the model-unspecified four-variable tensor exponent with the explicit toy `m₁²+m₂²+(θu)²`. Integrate its evidence numerically; identify the crossing factor's `λ=1/2` separately from the full toy's `λ=3/2`.
- Remove the universal tensor RLCT claim attributed to Rousseau–Mengersen; explain the role of model/prior assumptions in their mixture-posterior result.
- State the population Bayesian predictive KL result with realizability, analytic, sampling, and temperature assumptions. Remove the incorrect interchange of posterior average test loss, training loss, predictive error, and generic network capacity.
- Correct the linear-network display: `3→8→3` has 48 parameters, with regular count 24, not 96 and 48. Distinguish population formulas, stored checks, and finite empirical estimates.
- Correct the simultaneous-impact corner to `g₁=g₂=0`; `g₁g₂=0` is the union of both walls. State the finite event cutoff and the assumptions of the inelastic-collapse threshold.
- Correct cross-field topology: boundary winding fixes total index, not four distinct defects in every field. Distinguish complex representation degree from cross-field index, point-vortex energy from the full GL solve, and energy per logarithmic radial interval from spatial density.
- Explain that drilling a hole changes the domain and lifting to a sphere changes the target; projection can still have undefined cross directions. Neither operation is asserted to be an algebraic resolution or a removal of the original topological obstruction.
- Replace the tensor rank-two “variety” wording with the nonclosed rank-at-most-two set, and describe a finite gradient trajectory as an illustration rather than proof of divergence.

## Figure and navigation repairs

- Cusp concentration now measures posterior mass in a fixed radius-0.25 disk. It does not assign positive finite-n mass to one point. Its high-concentration heatmap zooms with explicit coordinate ranges instead of undersampling a vanishingly narrow trough.
- Remove unrelated cradle chamber shares from the cusp concentration graph.
- Remove the noisy-data demo's use of its known synthetic center as a fit fallback. It reports a data-centroid fallback; ground truth is used only for diagnostic error.
- Re-layout SVGs when optional calculations are expanded, and open enclosing details when an anchored calculation is visited.
- Correct the invalid noise-slider initial value, keep projected 3D labels inside phone viewports, preserve stable section anchors, and link the footer to the source actually deployed.

## Citations and validation

Primary references checked include the 2012 effective-resolution paper, ATW, both Nash counterexample papers, the Resolution formalization report, Watanabe's WBIC/generalization papers, Lau et al., the original inelastic-collapse paper, and the cited cross-field papers. Correct Nash's DOI and Viertel/Osting's authorship. Remove a frame-field reference whose arXiv link pointed to an unrelated quantum-dot paper. Add question-based annotations to the reference list.

The build now checks unique element IDs, structural tag nesting, internal links/anchors, figure keys, and TeX. Numerical checks cover the original exact cone, Nash charts, toric resolution and section identities; tensor entries and cancellation; independent evidence quadrature; both corrected Jacobians; cusp chart volume exponents; the ReLU loss against input integration; the explicit crossing toy; and convergence of the cusp-neighborhood mass under mesh refinement. Desktop/phone review covers the revised reading structure and representative controls.

The threefold's terminating construction remains explicitly a toric resolution, not an execution of the ATW ambient-center algorithm. Stored offline sampling points are retained as labeled numerical illustrations; this pass does not recreate their original sampling runs or certify neural-network safety claims.
