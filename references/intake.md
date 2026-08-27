# Poster intake

## Required media

Collect exactly five source photos:

- one main portrait;
- exactly four auxiliary portraits.

Do not continue with fewer or more auxiliary photos. Keep all four auxiliary source records addressable so the four cutout slots can be mapped explicitly. Default to `aux-1` through `aux-4` mapping to `cutout-1` through `cutout-4`; if the mapping is unclear or the user wants to choose it, show the [numbered cutout guide](field-guides/cutout-slots-map.png) and ask.

Preserve every auxiliary photo as a complete source file for later Photoshop adjustment. Do not destructively crop the only working copy. Keep the complete working image in `sources[].path`; when that path is a derived orientation-corrected copy, retain the untouched user file in `sources[].originalPath` so the final package can include the actual original color source.

## Required delivery choice

The flat composited poster PNG is always delivered and is not optional. Separately ask: “是否需要同时交付完整 Photoshop 素材包（中文图层 PSD、六个语义层、四张完整人像、蒙版与青绿色效果文件）？” Record yes as `exports.photoshopPackage: true` and no as `false`. Do not assume the answer from previous tasks, and do not proceed to rendering while this field is missing.

## Required copy

Collect these fields before rendering:

- subject/name;
- headline;
- `subtitle`, presented to the user as “副标题”; it supplies the upper-right identity and the left footer brand;
- text island 1: exactly three strings;
- text island 2: exactly three strings;
- text island 3: exactly three strings;
- text island 4: exactly three strings;
- text island 5: exactly four strings.

Store the five numbered fields under `copy.textIslands.island1` through `island5`. Read [field-confirmation.md](field-confirmation.md) for their locked locations and local guide images.

Optional reference copy includes the upper-left green label and the three lines in the upper-right slash-icon information frame. Default them to `Control the moment`, `WORLDWIDE PORTRAIT ARCHIVE`, `THE FIRST SIGNAL / ISSUE 01`, and `CONCEPTUAL PORTRAIT STUDY`. Preserve user replacements exactly. Keep both modules' left edges fixed and fit only their right edges to the rendered text width.

Optional fields also include one micro-copy string for the first archive-footer line, footer copy, and two custom footer groups. For `reference-01`, the large headline renders as `WHO`, `IS`, and `${SUBJECT}?`; normalize it to exactly one trailing question mark, never omit it and never render `!?` or repeated question marks. The footer's two middle groups default to `${SUBJECT} / PORTRAIT ARCHIVE` plus `CONTROL THE MOMENT / ISSUE 01`, and `I DON'T WAIT FOR THE SIGNAL.` plus `I BECOME IT.`. If the user supplies two footer groups, preserve all four lines exactly and use them instead of the defaults.

## Missing fields and decisions

When any required field is missing, attach the matching crop from [field-confirmation.md](field-confirmation.md), explain where that copy appears, and ask the user for the field. When several islands are missing, show the numbered overview first. Use the same guide mapping when the user is deciding whether to replace optional label, info-frame, or footer copy. Ask in the user's language.

Probe the orientation-corrected main source dimensions during intake. If its ratio differs from the fixed 2:3 canvas, complete [the main-image aspect-ratio decision](main-image-fit-decision.md) before defining a face safety zone or composing the poster. Attach the labeled crop/no-crop contact sheet to the question.

Do not decide whether the user's copy or layout choice is suitable. The user is the authority. If the user wants AI-filled copy, obtain explicit authorization before proposing it; never turn a proposal into confirmed copy until the user chooses it.

Complete: “Subject: Xiaohe. Headline: WHO IS XIAOHE? Subtitle: STUDIO X. Text islands 1–5 supplied with 3/3/3/3/4 lines.”

Incomplete, authorized: “Subject: Xiaohe. Please propose options for the missing subtitle and islands: yes.” Show the relevant guide images, then offer options for confirmation.

Incomplete, not authorized: ask for the missing fields with the matching guide images before rendering.
