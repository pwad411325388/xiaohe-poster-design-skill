# Troubleshooting

`reference-01` is the only template. Never recommend or silently switch to another template. Make at most two targeted autonomous repair attempts; if the result still needs a judgment call, show the affected local crop and ask the user.

| Symptom | Action | Stop |
|---|---|---|
| Missing source | Request the original file/path and identify whether it is the main photo or one of the four required auxiliaries. | After 2 targeted repairs. |
| Wrong auxiliary count | Request exactly four auxiliary photos; do not silently duplicate, omit, or invent one. | Before rendering. |
| Low resolution | Warn and request a larger original. | Do not upscale into invented detail. |
| No safe headline | Keep `reference-01`; show the affected crop and ask whether the user wants a copy adjustment, main portrait crop/focus change, or an explicit local geometry change. | After 2 targeted repairs. |
| Overflow | Show the affected crop and let the user choose whether to shorten the copy or explicitly approve a local fit adjustment within the locked recipe. | After 2 targeted repairs. |
| Face overlap | Preserve the locked cutout polygon first. Show a crop containing the face and cutout, then let the user choose to keep the overlap, change the main portrait crop/focus, or explicitly change the polygon. | Await the user's choice. |
| Missing subtitle or text island | Attach the matching guide from `field-confirmation.md` and ask for the field in the user's language. | Before rendering. |
| Missing font | Use configured system fallback. | Report fallback. |
| PSD failure | Deliver PNG/SVG/layers and record error. | Report failure. |
| Missing output | Run verify and rerender to a fresh empty directory. | After 2 attempts. |
| Wrong dimensions | Correct canvas spec and rerender. | After 2 attempts. |
| Copy mismatch | Restore exact user copy. | After 2 attempts. |
