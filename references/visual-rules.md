# Visual rules

Use a vertical 2:3, full-bleed, high-contrast grayscale portrait. Add exactly four irregular source-derived cutouts, teal `#29D3B2`, real editable SVG typography, and separately seeded grain. Never redraw a face, pose, or clothing: source pixels only.

Before composing cutouts, record a full-face safety zone on the main portrait. Preserve the four approved cutout polygons before trying to avoid that zone. If a polygon intersects the zone, do not decide whether the result is suitable and do not reshape the polygon automatically: show the user a local crop and let them choose to keep the overlap, change the main portrait crop/focus, or explicitly change the polygon. After composing, inspect every cutout at full size: show the complete visible face and preserve the source aspect ratio. Reposition or uniformly resize source pixels inside the polygon; never distort them.

Fixed: aspect ratio, grayscale portrait treatment, editable SVG type, the exact six semantic layers, and source-pixel rule. The six layers are main background, portrait cutout materials, green cutout windows, text islands, graphics, and grain; never flatten the two cutout layers or mix graphic shapes into the text layer.

The user-approved reference-locked recipe is authoritative when generic rules differ: use exactly four face-focused tapered polygons, the measured headline/text-island geometry, and the single full-canvas grain layer described in [approved-editorial-recipe.md](approved-editorial-recipe.md).

For `reference-01`, use exactly one main photo, four auxiliary photos, four face-focused polygon cutouts, five numbered text islands, and fixed text/footer coordinates. Its type hierarchy is fixed: mixed-case serif label; oversized condensed `WHO` and subject question; a small oblique connector; restrained narrow-sans microcopy; compact upper-right identity; vertical metadata; and a dense footer. Keep this skeleton while fitting the subject line horizontally for different name lengths. Reuse the footer text, divider, and long-barcode geometry from the approved recipe unchanged unless the user explicitly requests a footer edit.

Apply texture only after the clean photograph, cutouts, typography, and graphics exist. Generate 150% uniform monochrome noise on black. The approved recipe uses one full-canvas `06-grain` Screen layer at `0.51`; black pixels disappear while light flecks gently lift dark areas. Never add a duplicate text-grain or Multiply black-pepper pass.
