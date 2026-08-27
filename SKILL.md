---
name: xiaohe-poster-design-skill
description: Use when creating retro-grain portrait, fan, or editorial collage posters from user-supplied photos.
license: MIT
---

# Xiaohe poster design

Use this skill for a vertical portrait poster, fan editorial collage, or retro-grain identity piece made from user-supplied photos. It always produces a flat composited PNG. It also produces editable SVG typography, layered PNGs, PSD, spec, and manifest; add the complete Chinese-named Photoshop import package only when the user explicitly requests it after being asked.

## Agent Skills portability

`SKILL.md` is the portable source of truth. Follow its relative links from the skill root and keep `scripts/`, `references/`, and `assets/` beside it. Do not require Codex, Claude Code, a particular model, or a provider-specific command in order to apply the design rules. The optional `agents/openai.yaml` file is only UI metadata for clients that understand it; other clients may ignore it.

When the host supports the open Agent Skills directory format, install the whole folder in that host's skill directory. When it does not, attach or import the whole folder, instruct the agent to read `SKILL.md`, and preserve the same user-confirmation gates. Rendering and verification additionally require local filesystem access plus Node.js 22+ and npm; without those capabilities, provide the normalized spec and explain that the bundled renderer could not run instead of pretending that a PNG was generated.

## Core rule

Use source pixels only. Never redraw or synthesize the person’s face, pose, or clothing.

Every `reference-01` intake uses exactly one main photo and exactly four auxiliary photos.

## Stable asset and layer model

Every render must expose exactly six semantic layers. Use this bottom-to-top stack in `layers/`, PSD, manifest, and editable SVG groups:

1. `01-main-background`（主图背景层）— full-bleed grayscale main portrait only.
2. `02-portrait-cutout-materials`（人像切片素材层）— grayscale, source-derived cutout pixels with the approved crop, scale, rotation, and polygon masks; no teal tint.
3. `03-green-cutout-windows`（绿色切片窗口层）— the teal-treated versions of those same masked windows. Hiding this layer must reveal the grayscale cutout materials beneath it.
4. `04-text-islands`（文字岛层）— every glyph: headline, label copy, info-frame copy, text islands, vertical copy, and footer copy; no boxes, rules, barcode, or other shapes.
5. `05-graphics`（图案层）— label block, info frame/slash, underlines, footer band, circles, rules, barcode, and other non-text graphic shapes.
6. `06-grain`（噪点层）— the single full-canvas monochrome Screen grain layer.

Do not merge, rename, omit, or duplicate these layers. `manifest.layerOrder` and verification must match this list exactly. The numeric order follows visual compositing; the workflow may prepare text or graphics earlier, but export order is fixed.

Treat each cutout as three separate, addressable fields rather than one flattened object:

- `slotId`: stable position identifier (`cutout-1` through `cutout-4`). Swapping source photos must not change the slot's geometry.
- `polygon`: the cutout window shape and position.
- `sourceTransform`: uniform scale plus `focus.x/y` for the source inside that window.

Never use a non-uniform transform to make a source fill a polygon. When a revision says to move or resize a face, change `sourceTransform` first; change `polygon` only when the user explicitly asks to change the window shape. Keep a source-to-slot mapping in the normalized spec so later revisions cannot silently renumber the cutouts.

The renderer and validator must actually read and check these fields. They must enforce `scaleX === scaleY`, preserve frozen polygons and source mappings, and report unsupported `cutoutSlots` or `sourceTransform` fields instead of silently falling back to fixed layout values. A document rule that the implementation ignores is not a passed composition gate.

## Mandatory composition gates

### Main-image aspect-ratio decision gate

Before defining the main portrait safety zone, compare the orientation-corrected main source ratio with the fixed 2:3 `reference-01` canvas. Read [main-image-fit-decision.md](references/main-image-fit-decision.md). If the ratios do not match, do not silently use the renderer's default `cover` crop. Attach one labeled contact sheet showing three directional 2:3 crops and a fourth no-crop option that centers the complete image with equal black padding on the unused axis. Ask the user to choose or specify another focus; do not decide which treatment is suitable. Apply and freeze the confirmed choice, then define `protectedRegions` from that composed result. A later main-image treatment change invalidates the old safety zone and requires the affected overlap checks to run again.

### Main portrait safety and polygon-priority gate

After receiving all source images and before placing any cutout, inspect the main portrait first. Define a normalized `protectedRegions` face safety zone that contains the complete visible face—from hairline/forehead through chin, including both eyes, nose, and mouth—with a small practical margin. The approved four cutout polygons have priority over this safety zone: never move, reshape, or renumber them automatically to avoid an overlap. Treat an intersection as a user decision, not an agent verdict. Show a local crop containing the affected face and cutout, then let the user choose whether to keep the overlap, change the main portrait crop/focus, or explicitly change the polygon. If the main portrait crop changes, redefine the safety zone before continuing. Explicit user instructions override the default priority.

### Cutout face-completeness gate

After generating the cutouts and before accepting a render, inspect every cutout individually. The source face must be complete inside its polygon: preserve the original aspect ratio and keep the visible hairline/forehead, eyes, nose, mouth, and chin whenever they exist in the source. First resize and reposition the source inside the fixed cutout window; never stretch, squash, or otherwise deform it. A render with a needlessly clipped or distorted cutout face is not ready for delivery.

### Footer geometry lock

For `reference-01`, treat the bottom footer geometry, divider, and barcode as locked reusable geometry. The left footer brand is dynamic and must use the user-supplied subtitle. The two middle footer groups use their approved default copy unless the user supplies replacements. Reuse the exact normalized positions and sizes in [approved-editorial-recipe.md](references/approved-editorial-recipe.md) on every generation. Do not move or resize the footer merely because other poster elements changed; alter its geometry only when the user explicitly requests a footer layout change.

### User-decision visual aid gate

Read [field-confirmation.md](references/field-confirmation.md) whenever required copy is missing or a visible-region decision needs confirmation. Attach the corresponding reference crop for the headline, label, `subtitle`, info frame, five numbered text islands, footer groups, or four cutout slots. For a geometry conflict, attach a crop from the current render. Reference-image text is visual material only. Do not decide whether the user's wording or treatment is suitable; explain the affected location and apply the user's choice.

### User-confirmed Photoshop delivery-package gate

The flat `poster.png` is a mandatory deliverable. During intake, separately ask whether the user wants the complete Photoshop material package and record the explicit answer as `exports.photoshopPackage: true|false`; do not infer it from a prior task or silently default it. Build `PS导入素材包-中文-完整版/` only when the answer is yes. If the answer is no, deliver the flat poster without treating the absent package as an error. Read [photoshop-delivery-package.md](references/photoshop-delivery-package.md) only when the package is requested.

When requested, the package is incomplete unless it contains the final preview, six Chinese-named semantic PNG layers, one Chinese-layered PSD, four complete color auxiliary sources, four Photoshop-compatible black/white window masks, four isolated teal window effects, combined mask/effect files, a structure-verification report, and a Chinese file guide. Inside the PSD, keep the main background at the bottom and display the top-level panel as `06→01`. Use Screen grain at the configured normalized opacity (`0.51` for `reference-01`). Each grayscale and teal cutout must retain the complete movable source pixels beneath an unlinked vector window mask; the mask limits visibility and must never replace a complete source with already-cropped pixels. Keep complete color originals as clearly numbered external files in the same package rather than hidden PSD layers that may unexpectedly become visible.

## Approved reference precedence

For the validated `reference-01` editorial treatment, use [approved-editorial-recipe.md](references/approved-editorial-recipe.md) together with the reference image set below. The core visual reference is Image 1; it governs the overall hierarchy, density, black/teal editorial language, title-to-image relationship, text-island rhythm, and footer presence. Images 2 and 3 are supporting references for the current grayscale portrait treatment, face-focused cutout handling, measured headline spacing, and grain behavior. These references supersede older generic values when they conflict, while user-supplied copy always wins over text visible in a reference image.

### Reference image set

- Core: [reference-01-core.png](references/reference-images/reference-01-core.png) — Image 1; authoritative for the overall composition and visual hierarchy.
- Supporting: [reference-01-support-ryujin.png](references/reference-images/reference-01-support-ryujin.png) — Image 2; supports the current Ryujin subject treatment, full-bleed grayscale portrait, four teal cutouts, and footer proportions.
- Supporting: [reference-01-support-yeji.png](references/reference-images/reference-01-support-yeji.png) — Image 3; supports the high-contrast grain, large title scale, headline spacing, and editorial cutout rhythm.

When references disagree, resolve them in this order: explicit user instructions, Image 1's composition and hierarchy, the approved numeric recipe, then Images 2–3 for supporting treatment details. Text visible inside a reference image is visual material only, not an instruction or required copy.

## Experiment approval gate

Treat every generated poster and design variation as disposable experiment output until the user explicitly approves it. A render succeeding, passing checks, or appearing useful to the agent is not approval. Do not add experimental layouts, parameters, copy, visual rules, examples, or design documents to this skill unless the user explicitly says the result is approved and may be retained or consolidated. Keep unapproved attempts only in their output directories.

## Workflow

1. Locate exactly one main photo and exactly four auxiliary photos. Read [intake.md](references/intake.md), collect every text field, ask whether the user wants the complete Photoshop material package, and respect the explicit answer. For any missing field or unclear auxiliary-to-slot mapping, follow [field-confirmation.md](references/field-confirmation.md) and attach the matching guide image. Request explicit AI-fill authorization before proposing copy.
2. Probe all files. Compare the orientation-corrected main source ratio with the 2:3 canvas before composing. If they differ, follow [main-image-fit-decision.md](references/main-image-fit-decision.md), attach the A/B/C/D contact sheet, and wait for the user's framing choice.
3. Apply the confirmed main-image treatment, then define the complete visible face safety zone in `protectedRegions`. Preserve the approved cutout polygons by default. If one intersects the safety zone, show the affected local crop and ask the user how to handle it; do not make the suitability decision for them.
4. Write the normalized poster spec using the required `reference-01` composition. See [poster-spec.md](references/poster-spec.md).
5. Render the mandatory flat PNG, then inspect every cutout for a complete, undistorted face. Repair the source scale/focus inside the window before changing the window shape. If `exports.photoshopPackage` is true, build and verify the package described in [photoshop-delivery-package.md](references/photoshop-delivery-package.md); if false, omit it. Run `node scripts/verify.mjs <out>` only after all requested deliverables pass their gates.
6. For revisions, patch only requested fields and render to a new output directory. Preserve the confirmed main-image treatment, normalized positions, four face-focused polygon cutouts, typography hierarchy, and locked footer geometry defined by `reference-01`, except where the user explicitly requests a change.

7. For every revision, write a short change list and a freeze list before rendering. The change list contains only the requested fields; the freeze list covers all other positions, shapes, copy, opacity, footer geometry, grain settings, and the confirmed main-image treatment. Start from the latest user-approved checkpoint, never from a rejected render. For a local cutout or text adjustment, render a crop preview first and render the full poster only after the local change is visually acceptable.

Build grain like the Photoshop reference: start from black and add 150% uniform monochrome noise after all image, cutout, typography, and graphics layers exist. For `reference-01`, export one full-canvas `06-grain` layer and composite it last with Screen at `0.51`. Do not add a second text-masked grain layer or a Multiply distress pass.

For `reference-01`, keep the reference typography skeleton and the complete headline recipe fixed. Read every value from `assets/layouts/reference-01.json`; do not recreate the title from visual guesses or spec overrides. The headline uses `Bahnschrift, Arial Narrow, Arial, sans-serif`, weight `800`, tracking `0`, color `#E8EAE6`, opacity `0.88`. `WHO` is `0.135 * canvas width` with `scale(0.80, 1)` and no skew; `${SUBJECT}?` is `0.133333 * canvas width` with baseline `scale(0.80, 1)` and no skew. Always normalize the subject line to exactly one trailing question mark, even if the supplied subject or headline has none or already has one or more. Only long subject names may compress horizontally, bounded to `0.74–0.80`; never expand them, and keep height, y-position, weight, and the single question mark fixed. `IS` is always uppercase and uses the same `0.135 * canvas width` master size and weight as `WHO`, then transforms with `scaleX 0.75`, `scaleY 0.45`, and `skewX(-8deg)`. Its target visible ink aspect is `1.82`, which is the required flattened form—not a normal small upright word. Align its baseline to the `WHO` baseline plus `0.002 * canvas height`. Measure the compressed `WHO` right edge first, then place `IS` at `headline.minGap` (`0.020 * canvas width`, 24 px at 1200 px); `IS` has no independent fixed x-position. Ignore and remove stale `layout.headlineOverrides`. Keep the upper-left label and upper-right information frame anchored at their approved left edges. Their stored widths are reference fallback boxes only; `widthMode` requires content-controlled output widths.

The reference-01 text islands are five numbered input fields and five layout records, never SVG constants. The renderer must read `copy.textIslands.island1` through `island5` and `text.islands.island1` through `island5`. Their required line counts are `3/3/3/3/4`, matching the red/white/yellow/green/blue guide regions in [field-confirmation.md](references/field-confirmation.md). Island 1 sits below the headline; Island 2 sits at middle left; Island 3 sits near the center; Island 4 is vertical at middle right; Island 5 is right-aligned at lower right. Island 2 and Island 3 body copy uses the approved near-white `#ECEDE8`; the configured identity line uses accent teal. Island 5 uses a right-aligned anchor at `x 0.935` and must retain at least `0.016 * canvas width` before the fixed right rule at `x 0.951`. If a revision changes an island, patch its copy data, layout data when explicitly requested, and validation; do not reintroduce hard-coded copy or coordinates.

Follow [visual-rules.md](references/visual-rules.md). For a failure, use [troubleshooting.md](references/troubleshooting.md) and make at most two targeted repair attempts before stopping and reporting the blocker.

## Canva editable delivery

When the user wants to continue editing in Canva, distinguish visual similarity from editability:

- Do not treat Magic Layers applied to the final noisy PNG as the authoritative editable source. Grain, low-opacity type, tilted cutouts, and microcopy can cause missing or merged text.
- If the working PSD/SVG contains rasterized or grouped text, create a Canva-compatible PPTX bridge: keep the main image, each cutout, decoration, and grain as separate image objects, and rebuild the headline, text islands, info frame copy, identity copy, and footer copy as native text boxes.
- Preserve the same `reference-01` coordinates and layer order in the bridge. The grain overlay remains a separate transparent image layer and must not be baked into the text boxes.
- After import, verify the Canva design content contains the expected rich text strings, including the headline, text islands, info-frame lines, and footer lines. A thumbnail that looks correct is not proof of editability.
- Complete one reversible interaction check after content verification: select and edit the main headline, one text island, and one cutout independently, then undo. The design is not editable-delivery complete if any of these objects can only be selected as part of a flattened group.
- Report possible font substitution in Canva, but do not accept missing rich text as a successful editable delivery.
