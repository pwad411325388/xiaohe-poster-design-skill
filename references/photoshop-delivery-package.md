# Complete Photoshop delivery package

Build this package only after the user explicitly answers yes to the package question and the spec records `exports.photoshopPackage: true`:

`PS导入素材包-中文-完整版/`

It keeps the six poster layers, the four complete auxiliary portraits, their four window masks, and the editable PSD together so the user does not need to locate separate English-named assets.

The flat `poster.png` remains mandatory whether this package is requested or not. If `exports.photoshopPackage` is false, omit this directory and record `deliveryPackageRequested: false` in the manifest; its absence is then valid, not a failed export.

## Required files

- `00-可编辑海报工程-中文图层.psd`
- `00-最终效果预览.png`
- `00-图层结构验证.json`
- `01-主图背景层.png`
- `02-人像切片效果层-灰度.png`
- `03-绿色切片窗口效果层.png`
- `04-文字岛层.png`
- `05-图案层.png`
- `06-噪点层.png`
- `11/21/31/41-切片N-完整彩色人像素材.png`
- `12/22/32/42-切片N-蒙版窗口.png`
- `13/23/33/43-切片N-青绿色窗口效果.png`
- `90-四个切片窗口-黑白蒙版合并版.png`
- `91-四个切片窗口-青绿色效果合并版.png`
- `99-文件说明.txt`

The 12/22/32/42 and 90 files must be ordinary grayscale PNGs that Photoshop can open: white reveals, black hides. Do not use SVG as the only mask deliverable. The 13/23/33/43 and 91 files carry the visible teal treatment; the black/white masks do not carry color.

## PSD layer contract

Photoshop must display these top-level groups from top to bottom:

1. `06-噪点层`
2. `05-图案层`
3. `04-文字岛层`
4. `03-绿色切片窗口层`
5. `02-人像切片素材层`
6. `01-主图背景层`

The PSD writer serializes the tested `ag-psd` child list bottom-to-top (`01→06`) because Photoshop displays it in reverse. Do not reverse it again. The main background must be the bottom visible layer. Set the grain layer to `screen` with normalized opacity, never a 0–255 integer; `reference-01` uses `0.51`.

Under `02-人像切片素材层`, create four clearly numbered groups. Each group contains the complete grayscale working portrait at its current scale and position with an unlinked vector window mask. Under `03-绿色切片窗口层`, retain the corresponding four complete teal-treated portraits with the same unlinked masks. The mask controls what is visible; the portrait layer itself must not be destructively cropped to the polygon.

Keep the four complete color originals as the external 11/21/31/41 PNG files in the same folder. Do not embed duplicate hidden color backups in the PSD: tested Photoshop versions may reveal them unexpectedly and bury the intended composite.

## Verification gate

The package is ready only when all checks pass:

- the packaged final preview is byte-identical to `poster.png`;
- the PSD embedded composite is pixel-identical to the final preview;
- serialized top-level order is `01→06`, yielding expected Photoshop panel order `06→01`;
- grain blend mode is `screen` and opacity matches the spec;
- the PSD contains four grayscale material groups and four teal material layers;
- exactly eight vector window masks exist and every mask is unlinked;
- all required numbered files exist and are non-empty;
- `manifest.json` records the package paths, verification result, and any package error.

When the package was requested, treat any failed check as a failed export. Never silently omit a requested package. When it was declined, do not generate it and do not treat its absence as a failure.
