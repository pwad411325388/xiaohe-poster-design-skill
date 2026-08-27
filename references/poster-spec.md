# Poster spec

`version`, `canvas.width`, `canvas.height`, `canvas.background`, `sources`, `protectedRegions`, `cutoutSlots`, `copy.subject`, `copy.headline`, `copy.subtitle`, `copy.textIslands`, `copy.topLabel`, `copy.infoLines`, `copy.micro`, `copy.footer`, `copy.footerGroups`, `style.accent`, `style.grain`, `style.seed`, `layout.template`, and `exports.png/svg/psd/layers/photoshopPackage` are supported. Coordinates and grain opacity are normalized 0–1.

`sources` must contain exactly one `main` source and exactly four `auxiliary` sources. Sources have `id`, `path`, and `role`. Keep `path` pointed at the complete, uncropped working image. If an orientation-corrected or otherwise lossless working copy is used, also record the untouched user file as optional `originalPath`; the delivery package uses it for the numbered complete-color source. Do not make a cropped derivative the only recorded source. An auxiliary source may include normalized `focus: { "x": 0.5, "y": 0.5 }` coordinates so a wide cutout stays centered on the face instead of using directional gravity.

Define `protectedRegions` only after inspecting the composed main portrait. The face region records the full visible face from hairline/forehead to chin plus a small margin. The approved cutout polygons take priority by default: an intersection is a non-blocking warning that requires a user decision, not permission for the renderer to move or reshape a polygon. Show a current-render crop and let the user choose whether to keep the overlap, change the main portrait crop/focus, or explicitly change the polygon.

`cutoutSlots` is an ordered array of four stable slot records. Each record has `slotId` (`cutout-1` through `cutout-4`), `sourceId`, `polygon`, and `sourceTransform`. `polygon` stores the normalized cutout window vertices; `sourceTransform` stores only uniform `scale` and normalized `focus: { "x": 0.5, "y": 0.5 }`. Swapping a source changes `sourceId` only. Moving or resizing the face inside an existing window changes `sourceTransform`; changing the window shape changes `polygon`. Never use non-uniform scale.

These fields are normative only when the renderer and validator consume them. Before relying on a spec revision, confirm the implementation enforces uniform scaling, frozen polygons, stable source mappings, and unsupported-field errors; it must not silently fall back to hard-coded cutout values.

`copy.subject`, `copy.headline`, and `copy.subtitle` must be non-empty user-confirmed strings. Present `copy.subtitle` to the user as “副标题”; it populates the upper-right identity and the left footer brand. If it is missing, show the matching guide from [field-confirmation.md](field-confirmation.md) and ask the user before rendering.

`copy.textIslands` is required and has exactly five supported fields:

- `island1`: three strings, horizontal block below the headline;
- `island2`: three strings, horizontal block at middle left;
- `island3`: three strings, horizontal block near the center;
- `island4`: three strings, vertical block at middle right;
- `island5`: four strings, right-aligned block at lower right; its anchor is `x 0.935` and it keeps at least `0.016 * canvas width` before the fixed right rule at `x 0.951`.

The renderer reads every string directly. Missing fields are invalid; an intentional blank line is represented by an empty string in the correct array position. Use the numbered map and local crops in [field-confirmation.md](field-confirmation.md) when asking the user for these fields.

`copy.micro` contains zero or one string and supplies the first archive-footer line when custom footer groups are absent. `copy.footerGroups` is optional. Leave it empty for the approved defaults, or provide exactly two arrays with two strings each to replace the two middle footer groups. The large subject headline always ends as `${SUBJECT}?` with exactly one question mark. Island 2 and Island 3 supporting lines use the approved near-white `#ECEDE8`.

`copy.topLabel` controls the upper-left green label and defaults to `Control the moment`; `text.topLabel.widthMode: content-plus-padding` means its stored width is only a fallback reference box and the output rectangle uses rendered text width plus 16 px padding on each side. `copy.infoLines` contains exactly three strings for the upper-right slash-icon information frame; `text.info.widthMode: content-min-near-edge` likewise makes stored width a fallback, while the output right edge follows the longest rendered line plus 16 px padding, subject to `rightMargin: 0.015`.

For the approved reference-locked editorial recipe, use a 1200x1800 canvas and one full-canvas Screen grain layer at opacity `0.51`, as described in [approved-editorial-recipe.md](approved-editorial-recipe.md).

`reference-01` ignores and removes `layout.headlineOverrides`. Headline geometry comes only from `assets/layouts/reference-01.json`, including fixed font family/weight/tracking/color/opacity, `WHO` and subject sizes, bounded compression-only subject fitting (`0.74–0.80`), and the uppercase flattened `IS` transform. Headline boxes are layout boxes, not measured ink bounds; `IS` has no fixed x and follows the measured `WHO` ink edge.

Every output manifest must declare this exact bottom-to-top `layerOrder`: `01-main-background`, `02-portrait-cutout-materials`, `03-green-cutout-windows`, `04-text-islands`, `05-graphics`, `06-grain`. Each named PNG must exist at full canvas size, and PSD/SVG grouping must preserve the same six semantics.

`exports.png` must always be `true`; the flat poster is a hard deliverable. `exports.photoshopPackage` has no inferred default and must be an explicit boolean set after asking the user whether they want the complete material package. When true, the manifest must contain a successful `deliveryPackage` record for `PS导入素材包-中文-完整版/`; a missing package, failed build, cropped-only cutout material, linked mask, wrong Photoshop stack, or mismatched embedded preview is an export failure. When false, the renderer omits the package and records `deliveryPackageRequested: false` without an error. See [photoshop-delivery-package.md](photoshop-delivery-package.md).

`reference-01` is the only supported layout. It fixes four polygon cutouts, five numbered text-island positions, split headline positions, the upper-right identity block, and footer. Resolve each cutout from its explicit `cutoutSlots[].sourceId`. Do not substitute another template or add seed-varied layout selection.

```json
{
  "version": 1,
  "canvas": { "width": 1200, "height": 1800, "background": "#090909" },
  "sources": [
    { "id": "main", "path": "portrait.png", "role": "main" },
    { "id": "aux-1", "path": "portrait-1.png", "role": "auxiliary" },
    { "id": "aux-2", "path": "portrait-2.png", "role": "auxiliary" },
    { "id": "aux-3", "path": "portrait-3.png", "role": "auxiliary" },
    { "id": "aux-4", "path": "portrait-4.png", "role": "auxiliary" }
  ],
  "protectedRegions": [{ "id": "face", "x": 0.32, "y": 0.18, "width": 0.36, "height": 0.32 }],
  "cutoutSlots": [
    { "slotId": "cutout-1", "sourceId": "aux-1", "polygon": [[0.047,0.364],[0.352,0.401],[0.350,0.523],[0.010,0.512]], "sourceTransform": { "scale": 1, "focus": { "x": 0.5, "y": 0.5 } } },
    { "slotId": "cutout-2", "sourceId": "aux-2", "polygon": [[0.678,0.280],[0.891,0.257],[0.909,0.411],[0.621,0.441]], "sourceTransform": { "scale": 1, "focus": { "x": 0.5, "y": 0.5 } } },
    { "slotId": "cutout-3", "sourceId": "aux-3", "polygon": [[0.034,0.690],[0.285,0.614],[0.393,0.687],[0.128,0.841]], "sourceTransform": { "scale": 1, "focus": { "x": 0.5, "y": 0.5 } } },
    { "slotId": "cutout-4", "sourceId": "aux-4", "polygon": [[0.593,0.569],[0.966,0.589],[0.957,0.758],[0.520,0.680]], "sourceTransform": { "scale": 1, "focus": { "x": 0.5, "y": 0.5 } } }
  ],
  "copy": {
    "subject": "XIAOHE",
    "headline": "WHO IS XIAOHE?",
    "subtitle": "STUDIO X",
    "textIslands": {
      "island1": ["ENTER THE WILD", "CONTROL THE FRAME", "MOVE WITH INTENT"],
      "island2": ["STUDIO X", "FUTURE", "YOURS"],
      "island3": ["XIAOHE", "IS", "CALLING"],
      "island4": ["XIAOHE", "PORTRAIT", "ARCHIVE"],
      "island5": ["REAL PEOPLE.", "REAL STORIES.", "NEW SIGNAL.", "WE RISE."]
    },
    "micro": ["ARCHIVE 01"],
    "footer": "ISSUE 01",
    "footerGroups": []
  },
  "style": { "accent": "#29D3B2", "grain": 0.51, "seed": 23 },
  "layout": { "template": "reference-01" },
  "exports": { "png": true, "svg": true, "psd": true, "layers": true, "photoshopPackage": false }
}
```

For revisions, patch only requested fields and preserve all unspecified values.
