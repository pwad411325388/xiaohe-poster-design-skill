# Main-image aspect-ratio decision

Use this gate after probing the main source and before defining `protectedRegions`, placing cutouts, or rendering the poster.

## Detect a decision

`reference-01` uses a 1200 × 1800 canvas with a 2:3 aspect ratio. Compare the orientation-corrected main source ratio with 2:3. A difference of at most 1% may be treated as pixel-rounding noise only when it produces no visible crop or padding. Otherwise, stop composition and request a user decision. Do not silently use the renderer's default `cover` behavior.

Report the source dimensions and both aspect ratios in plain language. The decision concerns framing, not whether the source is suitable.

## Build the visual choices

Use source pixels only, preserve the source aspect ratio, and apply the normal grayscale/contrast preview treatment consistently to every option. Create one labeled contact sheet and attach it to the question.

- **A / B / C — crop to 2:3:** show the full practical range of the overflow axis. For a source wider than 2:3, show left, center, and right crops. For a source narrower than 2:3, show top, center, and bottom crops. Keep each crop at the same scale so the options differ only in focus position.
- **D — no crop:** uniformly scale the entire source to fit inside 2:3, center it, and fill the unused canvas with equal black padding on the remaining axis. A wider source such as 4:5 receives equal top and bottom bars; a narrower source receives equal left and right bars. Never stretch the image to remove the bars.
- If the user requests a different focus or treatment, create that additional preview and let the user choose it. Do not recommend one option as inherently more suitable.

The contact sheet must show enough of the subject for the crop loss or black padding to be obvious. Labels must state the crop direction or `NO CROP / BLACK BARS`; do not ask the user to infer the difference from prose alone.

## Apply and freeze the choice

Apply only the confirmed option. Keep the choice, focus position, and padding behavior frozen in later revisions unless the user requests a new main-image treatment. For the no-crop option, the black padding belongs inside `01-main-background`; it is not an extra semantic layer.

Only after applying the confirmed treatment may the workflow define the composed main portrait's face safety zone and evaluate cutout intersections. If the main-image treatment changes later, rebuild `protectedRegions` and repeat the affected overlap checks before continuing.

Record the chosen option in the output change list and manifest. A generated preview or successful verification is not approval; retain the treatment in the reusable skill only after explicit user approval.
