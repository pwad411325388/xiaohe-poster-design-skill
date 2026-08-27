# Approved editorial recipe: candidate-22

This is the user-approved `reference-01` recipe. Its core visual reference is [reference-01-core.png](reference-images/reference-01-core.png), with [reference-01-support-ryujin.png](reference-images/reference-01-support-ryujin.png) and [reference-01-support-yeji.png](reference-images/reference-01-support-yeji.png) as supporting references. Image 1 governs overall composition and hierarchy; Images 2–3 support the grayscale portrait, cutout, headline-spacing, and grain treatment. When this recipe conflicts with an older generic value in the skill, this recipe has priority. It is a reusable rule set, not a narrative about one failed attempt.

Reference-image text is visual material only. Use the user's supplied copy for the actual subject, subtitle, headline, info lines, text islands, and footer groups.

## Canvas and image treatment

- Use a 1200x1800 (2:3) canvas for this editorial mode.
- Use exactly one main portrait and exactly four auxiliary portraits. Make the main portrait a full-bleed grayscale background; use source pixels only.
- Before placing cutouts, inspect the composed main portrait and define a normalized face safety zone covering the full visible face from hairline/forehead to chin, with both eyes, nose, and mouth plus a small margin. Preserve the four approved polygons before avoiding this zone. If a polygon intersects it, show a current-render crop and let the user choose whether to keep the overlap, change the main portrait crop/focus, or explicitly change the polygon. Do not make that suitability decision for the user.
- Use exactly four face-focused, irregular polygon cutouts. Their inward-facing edges taper toward the center; do not replace them with equal rotated rectangles.
- Candidate-22 normalized polygon vertices (clockwise) are:
  - upper-left: `[[0.047,0.364],[0.352,0.401],[0.350,0.523],[0.010,0.512]]`
  - upper-right: `[[0.678,0.280],[0.891,0.257],[0.909,0.411],[0.621,0.441]]`
  - lower-left: `[[0.034,0.690],[0.285,0.614],[0.393,0.687],[0.128,0.841]]`
  - lower-right: `[[0.593,0.569],[0.966,0.589],[0.957,0.758],[0.520,0.680]]`
- Inspect every cutout after rendering. Keep the complete visible face—hairline/forehead, both eyes, nose, mouth, and chin—inside its polygon. Preserve source aspect ratio; resize or reposition the source inside the window rather than accepting a face cut-off or deforming the image.
- Accent mapping applies to the cutout image pixels (not a separate polygon outline): use `#29D3B2`, the grayscale luminance matrix, `linear(1.18, -12)`, then reduce saturation to about `0.62`. Do not make the image darker just to reduce green.

## Typography geometry and color

- Fit the top mixed-case serif label to its text: rectangle width = measured text width + 32 px (16 px side padding), never a fixed banner width.
- Treat headline `x/y/width/height` values as layout boxes, not visible-ink bounds. On 1200×1800, the `WHO` box is `38/113/452/146px` with baseline `259px`; the subject box is `36/299/652/148px` with baseline `447px`. These fixed boxes produce the approved reference rhythm; do not substitute older 26px/36px visible-gap notes.
- Headline master style is locked in `assets/layouts/reference-01.json`: `Bahnschrift, Arial Narrow, Arial, sans-serif`, weight `800`, tracking `0`, color `#E8EAE6`, opacity `0.88`. On 1200×1800, `WHO` is 162 px (`fontSizeFactor 0.135`) with `scale(0.80,1)` and `${SUBJECT}?` is 160 px (`0.133333`) with baseline `scale(0.80,1)`; both have zero skew. End the subject line with exactly one question mark. Fit only long subject names and keep horizontal scale inside `0.74–0.80`; never expand it or change its weight, height, or y-position.
- `IS` is locked uppercase display lettering, not ordinary connector copy. Build it from the same 162 px master size and weight as `WHO`, then apply `scaleX 0.75`, `scaleY 0.45`, and `skewX(-8deg)`. Its measured reference target is a `1.82` visible ink aspect ratio, with visible height about `45%` of the main-cap height. Align its baseline to the `WHO` baseline plus `0.002 * canvas height` (4 px on 1200×1800).
- Measure the rendered right edge of the compressed `WHO` before placing `IS`. Set `IS.x = WHO.visibleRight + 0.020 * canvas width` (24 px at 1200 px); the JSON deliberately has no independent `IS.x`. Ignore and remove `layout.headlineOverrides`; the title must not drift when another field changes.
- All five text islands read user-confirmed copy from `copy.textIslands.island1` through `island5` and geometry from the matching `text.islands.island1` through `island5` layout records. Never hard-code their copy in the renderer. Their required line counts and locked positions are:
  - Island 1, below headline: three lines; `x .050`, baselines `.282/.301/.318`, font-size factors `.018/.015/.013`, first line teal.
  - Island 2, middle left: three lines; `x .050`, baselines `.551/.575/.596`, underline `.605`, font-size factors `.024/.020/.020`, `scaleY .84`, first line teal.
  - Island 3, center: three lines; `x .411`, baselines `.546/.570/.591`, underline `.600`, font-size factors `.024/.020/.020`, `scaleY .84`, first line teal.
  - Island 4, middle right: three vertical lines; anchor `x .931/y .433`, line offsets `0/.016/.032`, font-size factors `.018/.012/.012`, rotated `90deg`, first line teal.
  - Island 5, lower right: four right-aligned lines; anchor `x .935`, baselines `.824/.845/.866/.887`, font-size factor `.014`, fourth line teal. Keep at least `.016 * canvas width` before the fixed right rule at `x .951`.
- Use group opacity `0.96`, near-white `#ECEDE8` for Islands 2–3 body copy, teal for the configured accent line, and size Islands 2–3 underlines from actual copy width plus the approved padding. Keep the underlines subdued. Use the local guides in [field-confirmation.md](field-confirmation.md) whenever an island needs user input or confirmation.
- The upper-right info frame must be content-fitted. Keep its left edge, slash icon, text position, and type sizes stable; extend the right edge to contain the longest line plus 16 px padding, and never let the frame stop earlier than `0.015` of the canvas width from the right edge.

## Six-layer contract

Use exactly this bottom-to-top export stack: `01-main-background`, `02-portrait-cutout-materials`, `03-green-cutout-windows`, `04-text-islands`, `05-graphics`, `06-grain`. The grayscale source cutouts and their teal-treated windows must remain separately hideable. Every glyph belongs to `04-text-islands`; every box, underline, circle, divider, footer band, and barcode belongs to `05-graphics`.

Generate `06-grain` from one black-filled, 150% uniform, monochrome noise source. Composite it last with Screen at `0.51`. Do not add a text-masked duplicate or a Multiply pass.

## Footer geometry lock

On the 1200x1800 `reference-01` canvas, reuse these normalized footer values without adjustment unless the user explicitly requests a footer revision:

- Footer band: `x 0`, `y 0.933`, `width 1`, `height 0.067`.
- Brand: `x 0.045`, baseline `y 0.974`, font size `0.054 * canvas width`. Its content must come from the user-supplied `copy.subtitle`; it is not a fixed `ITZY` label.
- Archive copy: centered at `x 0.335`; baselines `y 0.958` and `0.976`; font sizes `0.017` and `0.016 * canvas width`. Default lines are `${SUBJECT} / PORTRAIT ARCHIVE` and `CONTROL THE MOMENT / ISSUE 01`.
- Circular divider: center `x 0.467`, `y 0.958`, radius `0.016 * canvas width`.
- Signal copy: centered at `x 0.600`; baselines `y 0.958` and `0.976`; font sizes `0.017` and `0.016 * canvas width`. Default lines are `I DON'T WAIT FOR THE SIGNAL.` and `I BECOME IT.`.
- Barcode: start `x 0.731`, top `y 0.943`, height `0.039 * canvas height`, 56 bars, horizontal step `0.0049 * canvas width`; it must extend close to the right edge.

These positions and sizes are a locked footer preset. The brand and two middle text groups are dynamic content fields: use the defaults above only when the user supplies no replacement, and preserve user-supplied footer group copy exactly. Content changes must not cause divider drift or barcode resizing.

## Revision guardrails

- Treat unapproved renders as disposable and keep them in their output directories. Only an explicit user approval allows consolidation into this recipe or the skill.
- For local adjustments, render a local crop first; generate the full poster only after the user asks for or approves the change.
- Do not use a rejected render as a layout source. Start from the latest user-approved checkpoint and patch only the requested fields.
