import sharp from 'sharp';

const DISPLAY_FONT = 'Impact, Arial, sans-serif';
const BODY_FONT = 'Arial, Microsoft YaHei, sans-serif';
const REFERENCE_DISPLAY_FONT = 'Bahnschrift, Arial Narrow, Arial, sans-serif';
const REFERENCE_SERIF_FONT = 'Georgia, Times New Roman, serif';
const REFERENCE_MICRO_FONT = 'Arial Narrow, Arial, Microsoft YaHei, sans-serif';
const REFERENCE_BRAND_FONT = 'Arial Black, Arial, sans-serif';
const DISPLAY_COLOR = '#E8EAE6';
const SECONDARY_COLOR = '#ECEDE8';
const MICRO_COLOR = '#D7D8D4';
const TEXT_ISLAND_BODY_COLOR = '#B6BAB5';
const DEFAULT_TOP_LABEL = 'Control the moment';
const DEFAULT_INFO_LINES = [
  'WORLDWIDE PORTRAIT ARCHIVE',
  'THE FIRST SIGNAL / ISSUE 01',
  'CONCEPTUAL PORTRAIT STUDY',
];

export function escapeXml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const px = (value) => Math.round(Number(value) || 0);
const point = (value, size) => px((Number(value) || 0) * size);
const imageHref = async (sourcePath) => {
  const png = await sharp(sourcePath, { failOn: 'error' }).rotate().png().toBuffer();
  return `data:image/png;base64,${png.toString('base64')}`;
};
const align = (position) => ({ north: 'xMidYMin slice', south: 'xMidYMax slice', west: 'xMinYMid slice', east: 'xMaxYMid slice' }[position] ?? 'xMidYMid slice');

function canvasOf(spec) {
  return spec.canvas ?? { width: 1200, height: 1800, background: '#090909' };
}

function fitText(value, width, fontSize, glyphFactor = 0.58) {
  const length = Math.max(1, [...String(value)].length);
  const estimatedWidth = Math.max(1, length * fontSize * glyphFactor);
  const requiredScale = width / estimatedWidth;
  const scale = Math.min(1.75, Math.max(0.82, requiredScale));
  const overflowTracking = requiredScale > 1.75 && length > 1
    ? Math.min(fontSize * 0.04, Math.max(0, (width / scale - estimatedWidth) / (length - 1)))
    : -fontSize * 0.012;
  return { scale: scale.toFixed(3), tracking: overflowTracking.toFixed(2) };
}

const escapePango = (value) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function renderedTextWidth(value, fontFamily, fontSize) {
  if (!String(value).length) return 0;
  const family = String(fontFamily).split(',')[0].trim();
  const metadata = await sharp({
    text: {
      text: escapePango(value),
      font: `${family} ${fontSize}`,
      dpi: 72,
      rgba: true,
    },
  }).metadata();
  return metadata.width ?? 0;
}

async function referenceTextMarkup(spec, layout) {
  const { width, height } = canvasOf(spec);
  const copy = spec.copy ?? {};
  const text = layout.text;
  const accent = escapeXml(spec.style?.accent ?? '#29D3B2');
  const textIslandBodyColor = escapeXml(spec.layout?.textIslandBodyColor ?? text.textIslandBodyColor ?? TEXT_ISLAND_BODY_COLOR);
  const subjectValue = String(copy.subject || 'SUBJECT').toUpperCase();
  const subject = escapeXml(subjectValue);
  const identityValue = String(copy.subtitle || 'IDENTITY');
  const identity = escapeXml(identityValue);
  const firstMicro = escapeXml(copy.micro?.[0] || `${subject} / PORTRAIT ARCHIVE`);
  const footer = escapeXml(copy.footer || 'CONTROL THE MOMENT / ISSUE 01');
  const textIslandCopy = copy.textIslands ?? {};
  const islandValues = (islandId, lineCount) => Array.from(
    { length: lineCount },
    (_, index) => String(textIslandCopy[islandId]?.[index] ?? ''),
  );
  const island1Values = islandValues('island1', 3);
  const island2Values = islandValues('island2', 3);
  const island3Values = islandValues('island3', 3);
  const island4Values = islandValues('island4', 3);
  const island5Values = islandValues('island5', 4);
  const island1Copy = island1Values.map(escapeXml);
  const island2Copy = island2Values.map(escapeXml);
  const island3Copy = island3Values.map(escapeXml);
  const island4Copy = island4Values.map(escapeXml);
  const island5Copy = island5Values.map(escapeXml);
  const footerGroups = Array.isArray(copy.footerGroups) ? copy.footerGroups : [];
  const archiveGroup = footerGroups[0] ?? [firstMicro, footer];
  const signalGroup = footerGroups[1] ?? ["I DON'T WAIT FOR THE SIGNAL.", 'I BECOME IT.'];
  const archiveLineOne = escapeXml(archiveGroup[0] || firstMicro);
  const archiveLineTwo = escapeXml(archiveGroup[1] || footer);
  const signalLineOne = escapeXml(signalGroup[0] || "I DON'T WAIT FOR THE SIGNAL.");
  const signalLineTwo = escapeXml(signalGroup[1] || 'I BECOME IT.');
  const at = (box) => ({
    x: point(box.x, width),
    y: point(box.y, height),
    width: point(box.width, width),
    height: point(box.height, height),
  });
  const who = at(text.headline.who);
  const headlineSubject = at(text.headline.subject);
  const topLabel = at(text.topLabel);
  const identityBox = at(text.identity);
  const info = at(text.info);
  const footerBox = at(text.footer);
  const islands = text.islands ?? {};
  const island1 = islands.island1 ?? {
    x: 0.050,
    baselines: [0.282, 0.301, 0.318],
    fontSizeFactors: [0.018, 0.015, 0.013],
    scaleY: 1,
    opacity: 0.96,
    accentLineIndex: 0,
  };
  const island2 = islands.island2 ?? {
    x: 0.050,
    baselines: [0.551, 0.575, 0.596],
    underlineY: 0.605,
    fontSizeFactors: [0.024, 0.020, 0.020],
    scaleY: 0.84,
    opacity: 0.96,
    underlinePadding: 0.014,
    underlineMaxWidth: 0.22,
    accentLineIndex: 0,
  };
  const island3 = islands.island3 ?? {
    x: 0.411,
    baselines: [0.546, 0.570, 0.591],
    underlineY: 0.600,
    fontSizeFactors: [0.024, 0.020, 0.020],
    scaleY: 0.84,
    opacity: 0.96,
    underlinePadding: 0.014,
    underlineMaxWidth: 0.115,
    accentLineIndex: 0,
  };
  const island4 = islands.island4 ?? {
    x: 0.931,
    y: 0.433,
    lineOffsets: [0, 0.016, 0.032],
    fontSizeFactors: [0.018, 0.012, 0.012],
    orientation: 'vertical-90',
    opacity: 0.96,
    accentLineIndex: 0,
  };
  const island5 = islands.island5 ?? {
    x: 0.935,
    rightRuleX: 0.951,
    minRightGap: 0.016,
    baselines: [0.824, 0.845, 0.866, 0.887],
    fontSizeFactors: [0.014, 0.014, 0.014, 0.014],
    align: 'end',
    opacity: 0.96,
    accentLineIndex: 3,
  };
  const headlineSubjectValue = `${subjectValue.replace(/[!?]+$/u, '')}?`;
  const headlineSubjectText = escapeXml(headlineSubjectValue);
  const headlineFont = text.headline.fontFamily ?? REFERENCE_DISPLAY_FONT;
  const headlineWeight = Number(text.headline.fontWeight ?? 800);
  const headlineColor = escapeXml(text.headline.color ?? DISPLAY_COLOR);
  const headlineTracking = Number(text.headline.trackingEm ?? 0);
  const whoSize = px(width * Number(text.headline.who.fontSizeFactor ?? 0.135));
  const subjectSize = px(width * Number(text.headline.subject.fontSizeFactor ?? 0.133333));
  const connectorSize = px(width * Number(text.headline.is.fontSizeFactor ?? 0.135));
  const whoScaleX = Number(text.headline.who.scaleX ?? 0.80);
  const whoFit = { scale: whoScaleX.toFixed(3), tracking: (whoSize * headlineTracking).toFixed(2) };
  const subjectRenderedWidth = await renderedTextWidth(headlineSubjectValue, headlineFont, subjectSize);
  const subjectBaselineScale = Number(text.headline.subject.scaleX ?? 0.80);
  const subjectMinScale = Number(text.headline.subject.minScaleX ?? 0.74);
  const subjectMaxScale = Number(text.headline.subject.maxScaleX ?? 0.80);
  const subjectRequiredScale = headlineSubject.width / Math.max(1, subjectRenderedWidth);
  const subjectScaleX = Math.max(subjectMinScale, Math.min(subjectMaxScale, subjectBaselineScale, subjectRequiredScale));
  const subjectFit = { scale: subjectScaleX.toFixed(3), tracking: (subjectSize * headlineTracking).toFixed(2) };
  const whoRenderedWidth = await renderedTextWidth('WHO', headlineFont, whoSize);
  const whoVisualRight = who.x + whoRenderedWidth * Number(whoFit.scale);
  const headlineConnectorGap = point(text.headline.minGap ?? 0.020, width);
  const connectorX = Math.ceil(whoVisualRight + headlineConnectorGap);
  const connectorBaseline = who.y + who.height + point(text.headline.is.baselineOffset ?? 0.002, height);
  const connectorScaleX = Number(text.headline.is.scaleX ?? 0.75);
  const connectorScaleY = Number(text.headline.is.scaleY ?? 0.45);
  const connectorSkewX = Number(text.headline.is.skewX ?? -8);
  const connectorInkAspect = Number(text.headline.is.targetInkAspect ?? 1.82);
  const connectorText = escapeXml(String(text.headline.is.text ?? 'IS').toUpperCase());
  const headlineOpacity = Number(text.headline.opacity ?? 0.88);
  const footerBrandX = point(0.045, width);
  const footerArchiveCenterX = point(0.335, width);
  const footerSignalCenterX = point(0.600, width);
  const topLabelValue = String(copy.topLabel ?? DEFAULT_TOP_LABEL);
  const topLabelText = escapeXml(topLabelValue);
  const topLabelFontSize = px(width * 0.024);
  const topLabelPadding = point(16 / 1200, width);
  const topLabelTextWidth = await renderedTextWidth(topLabelValue, REFERENCE_SERIF_FONT, topLabelFontSize);
  const topLabelWidth = Math.min(width - topLabel.x, topLabelTextWidth + topLabelPadding * 2);
  const infoLines = Array.isArray(copy.infoLines) && copy.infoLines.length === 3 ? copy.infoLines : DEFAULT_INFO_LINES;
  const infoTextConfig = spec.layout?.infoText ?? {};
  const infoFontFactors = Array.isArray(infoTextConfig.fontFactors) && infoTextConfig.fontFactors.length === 3
    ? infoTextConfig.fontFactors.map(Number)
    : [0.012, 0.010, 0.009];
  const infoFontSizes = infoFontFactors.map((factor) => px(width * factor));
  const infoTextLeft = info.x + Math.round(info.height * 1.18);
  const infoRightPadding = point(16 / 1200, width);
  const infoTextWidths = await Promise.all(infoLines.map((line, index) => renderedTextWidth(line, REFERENCE_MICRO_FONT, infoFontSizes[index])));
  const infoContentWidth = infoTextLeft - info.x + Math.max(...infoTextWidths) + infoRightPadding;
  const infoMinimumWidth = width - info.x - point(text.info.rightMargin ?? 0.015, width);
  const infoWidth = Math.min(width - info.x, Math.max(infoContentWidth, infoMinimumWidth));
  const infoTextRight = info.x + infoWidth - infoRightPadding;
  const infoTextAnchor = infoTextConfig.align === 'start' ? 'start' : 'middle';
  const infoTextX = infoTextAnchor === 'middle' ? Math.round((infoTextLeft + infoTextRight) / 2) : infoTextLeft;
  const infoBaselineFactors = Array.isArray(infoTextConfig.baselineFactors) && infoTextConfig.baselineFactors.length === 3
    ? infoTextConfig.baselineFactors.map(Number)
    : [0.34, 0.61, 0.84];
  const infoTextYs = infoBaselineFactors.map((factor) => info.y + Math.round(info.height * factor));
  const island1X = point(island1.x, width);
  const island1BaselineYs = island1.baselines.map((value) => point(value, height));
  const island1FontSizes = island1.fontSizeFactors.map((value) => px(width * value));
  const island1Transform = `translate(0 ${island1BaselineYs[0]}) scale(1 ${island1.scaleY}) translate(0 -${island1BaselineYs[0]})`;

  const island2X = point(island2.x, width);
  const island2BaselineYs = island2.baselines.map((value) => point(value, height));
  const island2FontSizes = island2.fontSizeFactors.map((value) => px(width * value));
  const island2TextWidths = await Promise.all(island2Values.map((value, index) => (
    renderedTextWidth(value, index === 0 ? REFERENCE_BRAND_FONT : REFERENCE_MICRO_FONT, island2FontSizes[index])
  )));
  const island2UnderlineWidth = Math.min(
    width * (island2.underlineMaxWidth ?? 0.22),
    Math.max(...island2TextWidths) + point(island2.underlinePadding ?? 0.014, width),
  );
  const island2Transform = `translate(0 ${island2BaselineYs[0]}) scale(1 ${island2.scaleY}) translate(0 -${island2BaselineYs[0]})`;

  const island3X = point(island3.x, width);
  const island3BaselineYs = island3.baselines.map((value) => point(value, height));
  const island3FontSizes = island3.fontSizeFactors.map((value) => px(width * value));
  const island3TextWidths = await Promise.all(island3Values.map((value, index) => (
    renderedTextWidth(value, REFERENCE_MICRO_FONT, island3FontSizes[index])
  )));
  const island3UnderlineWidth = Math.min(
    width * (island3.underlineMaxWidth ?? 0.115),
    Math.max(...island3TextWidths) + point(island3.underlinePadding ?? 0.014, width),
  );
  const island3Transform = `translate(0 ${island3BaselineYs[0]}) scale(1 ${island3.scaleY}) translate(0 -${island3BaselineYs[0]})`;

  const island4X = point(island4.x, width);
  const island4Y = point(island4.y, height);
  const island4LineYs = island4.lineOffsets.map((value) => island4Y + point(value, height));
  const island4FontSizes = island4.fontSizeFactors.map((value) => px(width * value));
  const island4Transform = island4.orientation === 'vertical-90'
    ? `rotate(90 ${island4X} ${island4Y})`
    : '';

  const island5X = point(island5.x, width);
  const island5BaselineYs = island5.baselines.map((value) => point(value, height));
  const island5FontSizes = island5.fontSizeFactors.map((value) => px(width * value));
  const island5Anchor = island5.align === 'end' ? 'end' : 'start';

  return `<g id="reference-composition">
    <rect id="reference-top-label-background" data-semantic-layer="graphics" x="${topLabel.x}" y="${topLabel.y}" width="${topLabelWidth}" height="${topLabel.height}" fill="${accent}"/>
    <rect id="reference-footer-background" data-semantic-layer="graphics" x="0" y="${footerBox.y}" width="${footerBox.width}" height="${footerBox.height}" fill="#080808" fill-opacity="0.96"/>
    <g id="reference-top-label"><text x="${topLabel.x + topLabelPadding}" y="${topLabel.y + Math.round(topLabel.height * 0.75)}" font-family="${REFERENCE_SERIF_FONT}" font-size="${topLabelFontSize}" font-weight="400" fill="#E2E3DE">${topLabelText}</text></g>
    <g id="reference-headline" aria-label="${escapeXml(copy.headline)}" font-family="${headlineFont}" font-weight="${headlineWeight}" fill="${headlineColor}" opacity="${headlineOpacity}">
      <g id="reference-who-fit" data-visual-right="${whoVisualRight.toFixed(2)}" transform="translate(${who.x} 0) scale(${whoFit.scale} 1) translate(${-who.x} 0)"><text x="${who.x}" y="${who.y + who.height}" font-family="${headlineFont}" font-size="${whoSize}" font-weight="${headlineWeight}" letter-spacing="${whoFit.tracking}" fill="${headlineColor}">WHO</text></g>
      <g id="reference-connector" data-visual-left="${connectorX}" data-min-gap="${headlineConnectorGap}" data-target-ink-aspect="${connectorInkAspect}" transform="translate(${connectorX} ${connectorBaseline}) skewX(${connectorSkewX}) scale(${connectorScaleX} ${connectorScaleY})"><text x="0" y="0" font-family="${headlineFont}" font-size="${connectorSize}" font-weight="${headlineWeight}" letter-spacing="${(connectorSize * headlineTracking).toFixed(2)}" fill="${headlineColor}">${connectorText}</text></g>
      <g id="reference-subject-fit" transform="translate(${headlineSubject.x} 0) scale(${subjectFit.scale} 1) translate(${-headlineSubject.x} 0)"><text x="${headlineSubject.x}" y="${headlineSubject.y + headlineSubject.height}" font-family="${headlineFont}" font-size="${subjectSize}" font-weight="${headlineWeight}" letter-spacing="${subjectFit.tracking}" fill="${headlineColor}">${headlineSubjectText}</text></g>
    </g>
    <g id="reference-text-island-1">
      <g id="reference-intro" font-family="${REFERENCE_MICRO_FONT}" font-weight="700" opacity="${island1.opacity}" transform="${island1Transform}">
        <text x="${island1X}" y="${island1BaselineYs[0]}" font-size="${island1FontSizes[0]}" fill="${accent}">${island1Copy[0]}</text>
        <text x="${island1X}" y="${island1BaselineYs[1]}" font-size="${island1FontSizes[1]}" fill="${SECONDARY_COLOR}">${island1Copy[1]}</text>
        <text x="${island1X}" y="${island1BaselineYs[2]}" font-size="${island1FontSizes[2]}" fill="${MICRO_COLOR}">${island1Copy[2]}</text>
      </g>
    </g>
    <g id="reference-identity" font-family="${REFERENCE_BRAND_FONT}" text-anchor="end">
      <text x="${identityBox.x + identityBox.width}" y="${identityBox.y + Math.round(identityBox.height * 0.42)}" font-size="${px(width * 0.052)}" font-weight="900" fill="${accent}">${identity}</text>
      <text x="${identityBox.x + identityBox.width}" y="${identityBox.y + Math.round(identityBox.height * 0.86)}" font-family="${REFERENCE_MICRO_FONT}" font-size="${px(width * 0.026)}" font-weight="800" fill="${SECONDARY_COLOR}">${subject}</text>
    </g>
    <g id="reference-info-box">
      <rect id="reference-info-frame" data-semantic-layer="graphics" x="${info.x}" y="${info.y}" width="${infoWidth}" height="${info.height}" fill="none" stroke="${SECONDARY_COLOR}" stroke-width="${Math.max(2, px(width * 0.002))}"/>
      <rect data-semantic-layer="graphics" x="${info.x}" y="${info.y}" width="${Math.round(info.height)}" height="${info.height}" fill="${SECONDARY_COLOR}"/>
      <line data-semantic-layer="graphics" x1="${info.x + point(0.006, width)}" y1="${info.y + info.height - point(0.004, height)}" x2="${info.x + info.height - point(0.006, width)}" y2="${info.y + point(0.004, height)}" stroke="#090909" stroke-width="${Math.max(3, px(width * 0.009))}"/>
      <text x="${infoTextX}" y="${infoTextYs[0]}" text-anchor="${infoTextAnchor}" font-family="${REFERENCE_MICRO_FONT}" font-size="${infoFontSizes[0]}" fill="${MICRO_COLOR}">${escapeXml(infoLines[0])}</text>
      <text x="${infoTextX}" y="${infoTextYs[1]}" text-anchor="${infoTextAnchor}" font-family="${REFERENCE_MICRO_FONT}" font-size="${infoFontSizes[1]}" fill="${MICRO_COLOR}">${escapeXml(infoLines[1])}</text>
      <text x="${infoTextX}" y="${infoTextYs[2]}" text-anchor="${infoTextAnchor}" font-family="${REFERENCE_MICRO_FONT}" font-size="${infoFontSizes[2]}" fill="${MICRO_COLOR}">${escapeXml(infoLines[2])}</text>
    </g>
    <g id="reference-text-island-2">
      <g id="reference-left-mid-identity" font-family="${REFERENCE_MICRO_FONT}" font-weight="800" text-anchor="start" opacity="${island2.opacity}" transform="${island2Transform}">
        <text x="${island2X}" y="${island2BaselineYs[0]}" font-family="${REFERENCE_BRAND_FONT}" font-size="${island2FontSizes[0]}" fill="${accent}">${island2Copy[0]}</text>
        <text x="${island2X}" y="${island2BaselineYs[1]}" font-size="${island2FontSizes[1]}" fill="${textIslandBodyColor}">${island2Copy[1]}</text>
        <text x="${island2X}" y="${island2BaselineYs[2]}" font-size="${island2FontSizes[2]}" fill="${textIslandBodyColor}">${island2Copy[2]}</text>
        <line id="reference-left-underline" data-semantic-layer="graphics" x1="${island2X}" y1="${point(island2.underlineY, height)}" x2="${island2X + island2UnderlineWidth}" y2="${point(island2.underlineY, height)}" stroke="${TEXT_ISLAND_BODY_COLOR}" stroke-width="${Math.max(2, px(width * 0.0015))}"/>
      </g>
    </g>
    <g id="reference-text-island-3">
      <g id="reference-center-copy" font-family="${REFERENCE_MICRO_FONT}" font-weight="800" text-anchor="start" opacity="${island3.opacity}" transform="${island3Transform}">
        <text x="${island3X}" y="${island3BaselineYs[0]}" font-size="${island3FontSizes[0]}" fill="${accent}">${island3Copy[0]}</text>
        <text id="reference-right-is" x="${island3X}" y="${island3BaselineYs[1]}" font-size="${island3FontSizes[1]}" fill="${textIslandBodyColor}">${island3Copy[1]}</text>
        <text id="reference-right-calling" x="${island3X}" y="${island3BaselineYs[2]}" font-size="${island3FontSizes[2]}" fill="${textIslandBodyColor}">${island3Copy[2]}</text>
        <line id="reference-center-underline" data-semantic-layer="graphics" x1="${island3X}" y1="${point(island3.underlineY, height)}" x2="${island3X + island3UnderlineWidth}" y2="${point(island3.underlineY, height)}" stroke="${TEXT_ISLAND_BODY_COLOR}" stroke-width="${Math.max(2, px(width * 0.0015))}"/>
      </g>
    </g>
    <g id="reference-text-island-4">
      <g id="reference-vertical-copy" transform="${island4Transform}" font-family="${REFERENCE_MICRO_FONT}" font-weight="800" opacity="${island4.opacity}">
        <text x="${island4X}" y="${island4LineYs[0]}" font-size="${island4FontSizes[0]}" fill="${accent}">${island4Copy[0]}</text>
        <text x="${island4X}" y="${island4LineYs[1]}" font-size="${island4FontSizes[1]}" fill="${MICRO_COLOR}">${island4Copy[1]}</text>
        <text x="${island4X}" y="${island4LineYs[2]}" font-size="${island4FontSizes[2]}" fill="${MICRO_COLOR}">${island4Copy[2]}</text>
      </g>
    </g>
    <g id="reference-text-island-5">
      <g id="reference-lower-callout" text-anchor="${island5Anchor}" font-family="${REFERENCE_MICRO_FONT}" font-weight="800" opacity="${island5.opacity}">
        <text x="${island5X}" y="${island5BaselineYs[0]}" font-size="${island5FontSizes[0]}" fill="${SECONDARY_COLOR}">${island5Copy[0]}</text>
        <text x="${island5X}" y="${island5BaselineYs[1]}" font-size="${island5FontSizes[1]}" fill="${SECONDARY_COLOR}">${island5Copy[1]}</text>
        <text x="${island5X}" y="${island5BaselineYs[2]}" font-size="${island5FontSizes[2]}" fill="${SECONDARY_COLOR}">${island5Copy[2]}</text>
        <text id="reference-callout-accent" x="${island5X}" y="${island5BaselineYs[3]}" font-size="${island5FontSizes[3]}" fill="${accent}">${island5Copy[3]}</text>
      </g>
    </g>
    <g id="reference-footer" font-family="${REFERENCE_MICRO_FONT}">
      <text id="reference-footer-brand" x="${footerBrandX}" y="${point(0.974, height)}" font-family="${REFERENCE_BRAND_FONT}" font-size="${px(width * 0.054)}" font-weight="900" fill="${accent}">${identity}</text>
      <text x="${footerArchiveCenterX}" y="${point(0.958, height)}" text-anchor="middle" font-size="${px(width * 0.017)}" font-weight="800" fill="${MICRO_COLOR}">${archiveLineOne}</text>
      <text x="${footerArchiveCenterX}" y="${point(0.976, height)}" text-anchor="middle" font-size="${px(width * 0.016)}" fill="${MICRO_COLOR}">${archiveLineTwo}</text>
      <text x="${footerSignalCenterX}" y="${point(0.958, height)}" text-anchor="middle" font-size="${px(width * 0.017)}" fill="${MICRO_COLOR}">${signalLineOne}</text>
      <text x="${footerSignalCenterX}" y="${point(0.976, height)}" text-anchor="middle" font-size="${px(width * 0.016)}" fill="${MICRO_COLOR}">${signalLineTwo}</text>
    </g>
  </g>`;
}

export async function buildTextMarkup(spec, layout) {
  if (layout?.id === 'reference-01') return referenceTextMarkup(spec, layout);
  const { width, height } = canvasOf(spec);
  const copy = spec.copy ?? {};
  const headline = layout?.text?.headline;
  const micro = layout?.text?.micro ?? [];
  const headlineMarkup = headline ? (() => {
    const x = point(headline.x, width);
    const y = point(headline.y, height);
    const boxWidth = point(headline.width, width);
    const boxHeight = point(headline.height, height);
    const size = Math.max(18, Math.min(boxHeight * 0.72, boxWidth / Math.max(1, String(copy.headline ?? '').length * 0.57)));
    const rotation = Number(headline.rotation) || 0;
    return `<g id="text-headline" transform="rotate(${rotation} ${x + boxWidth / 2} ${y + boxHeight / 2})"><text x="${x}" y="${y + size}" font-family="${DISPLAY_FONT}" font-size="${px(size)}" fill="#ffffff">${escapeXml(copy.headline)}</text></g>`;
  })() : '';
  const support = [];
  if (copy.subject) support.push(`<text x="${px(width * 0.06)}" y="${px(height * 0.08)}" font-family="${BODY_FONT}" font-size="${px(Math.max(12, width * 0.014))}" fill="#ffffff">${escapeXml(copy.subject)}</text>`);
  if (copy.subtitle) support.push(`<text x="${px(width * 0.06)}" y="${px(height * 0.31)}" font-family="${BODY_FONT}" font-size="${px(Math.max(14, width * 0.018))}" fill="#ffffff">${escapeXml(copy.subtitle)}</text>`);
  micro.forEach((box, index) => {
    const value = copy.micro?.[index];
    if (value) support.push(`<text x="${point(box.x, width)}" y="${point(box.y, height) + Math.max(12, point(box.height, height) * 0.45)}" font-family="${BODY_FONT}" font-size="${px(Math.max(11, width * 0.012))}" fill="#ffffff">${escapeXml(value)}</text>`);
  });
  if (copy.footer) support.push(`<text x="${px(width * 0.06)}" y="${px(height * 0.95)}" font-family="${BODY_FONT}" font-size="${px(Math.max(11, width * 0.012))}" fill="#ffffff">${escapeXml(copy.footer)}</text>`);
  return `${headlineMarkup}<g id="text-support">${support.join('')}</g>`;
}

function referenceDecorationMarkup(spec, layout) {
  const { width, height } = canvasOf(spec);
  const accent = escapeXml(spec.style?.accent ?? '#29D3B2');
  const island5 = layout?.text?.islands?.island5 ?? {};
  const rightRuleX = point(island5.rightRuleX ?? 0.951, width);
  const island5MinRightGap = Number(island5.minRightGap ?? 0.016) * width;
  const barcodeX = point(0.731, width);
  const barcodeY = point(0.943, height);
  const barcodeHeight = point(0.039, height);
  const bars = [3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 1, 4, 2, 3, 1, 2, 4, 1, 3, 2, 1, 3, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 4]
    .map((bar, index) => `<rect x="${barcodeX + index * Math.max(3, px(width * 0.0049))}" y="${barcodeY}" width="${Math.max(2, bar * px(width * 0.0015))}" height="${barcodeHeight}" fill="#ffffff"/>`)
    .join('');
  return `<g id="reference-decorations">
    <line id="reference-right-rule" data-island5-min-gap="${island5MinRightGap.toFixed(2)}" x1="${rightRuleX}" y1="${point(0.226, height)}" x2="${rightRuleX}" y2="${point(0.927, height)}" stroke="#777777" stroke-width="${Math.max(2, px(width * 0.002))}"/>
    <circle cx="${point(0.935, width)}" cy="${point(0.069, height)}" r="${point(0.014, width)}" fill="none" stroke="${accent}" stroke-width="${Math.max(2, px(width * 0.002))}"/>
    <circle cx="${point(0.946, width)}" cy="${point(0.195, height)}" r="${point(0.012, width)}" fill="none" stroke="${accent}" stroke-width="${Math.max(2, px(width * 0.002))}"/>
    <circle cx="${point(0.467, width)}" cy="${point(0.958, height)}" r="${point(0.016, width)}" fill="none" stroke="#ffffff" stroke-width="${Math.max(2, px(width * 0.002))}"/>
    <line x1="${point(0.451, width)}" y1="${point(0.958, height)}" x2="${point(0.483, width)}" y2="${point(0.958, height)}" stroke="#ffffff" stroke-width="${Math.max(1, px(width * 0.001))}"/>
    <line x1="${point(0.467, width)}" y1="${point(0.942, height)}" x2="${point(0.467, width)}" y2="${point(0.974, height)}" stroke="#ffffff" stroke-width="${Math.max(1, px(width * 0.001))}"/>
    <g id="reference-barcode">${bars}</g>
  </g>`;
}

export function buildDecorationMarkup(spec, layout) {
  if (layout?.id === 'reference-01') return referenceDecorationMarkup(spec, layout);
  const { width, height } = canvasOf(spec);
  const accent = escapeXml(spec.style?.accent ?? '#29D3B2');
  return `<g id="decorations"><line x1="${px(width * 0.05)}" y1="${px(height * 0.275)}" x2="${px(width * 0.35)}" y2="${px(height * 0.275)}" stroke="${accent}" stroke-width="${Math.max(2, px(width * 0.004))}" /></g>`;
}

function wrapper(spec, body, title = '') {
  const { width, height, background } = canvasOf(spec);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${px(width)}" height="${px(height)}" viewBox="0 0 ${px(width)} ${px(height)}"><title>${escapeXml(title)}</title>${body}</svg>`;
}

export async function buildTextSvg(spec, layout) {
  const hideGraphics = '<style>[data-semantic-layer="graphics"]{display:none}</style>';
  return wrapper(spec, `${hideGraphics}${await buildTextMarkup(spec, layout)}`, spec.copy?.headline ?? 'Poster text');
}

export async function buildDecorationSvg(spec, layout) {
  const referenceGraphics = layout?.id === 'reference-01'
    ? `<style>text{display:none}</style>${await referenceTextMarkup(spec, layout)}`
    : '';
  return wrapper(spec, `${referenceGraphics}${buildDecorationMarkup(spec, layout)}`, 'Poster graphics');
}

export async function buildEditableSvg(spec, layout) {
  const { width, height, background } = canvasOf(spec);
  const sources = spec.sources ?? [];
  const main = sources.find((source) => source.role === 'main');
  if (!main) throw new Error('Cannot build SVG without a main source');
  const auxiliary = sources.filter((source) => source.role === 'auxiliary' || source.role === 'aux');
  const mainHref = await imageHref(main.path);
  const cuts = await Promise.all((layout?.cutouts ?? []).map(async (cutout, index) => {
    const slotId = cutout.slotId ?? `cutout-${index + 1}`;
    const slot = spec.cutoutSlots?.find((candidate) => candidate.slotId === slotId) ?? spec.cutoutSlots?.[index];
    const source = slot?.sourceId
      ? sources.find((candidate) => candidate.id === slot.sourceId)
      : auxiliary[index % auxiliary.length] ?? main;
    if (!source) throw new Error(`Cannot resolve source for ${slotId}`);
    const effectiveCutout = slot?.polygon ? { ...cutout, polygon: slot.polygon } : cutout;
    const href = await imageHref(source.path);
    const x = point(cutout.x, width);
    const y = point(cutout.y, height);
    const cutWidth = Math.max(1, point(cutout.width, width));
    const cutHeight = Math.max(1, point(cutout.height, height));
    const angle = Number(cutout.rotation) || 0;
    const reference = layout?.id === 'reference-01' && Array.isArray(effectiveCutout.polygon);
    const id = reference ? `reference-cutout-${index}` : `cutout-${index}`;
    const shape = reference
      ? `<polygon points="${effectiveCutout.polygon.map(([pointX, pointY]) => `${point(pointX, width)},${point(pointY, height)}`).join(' ')}"/>`
      : `<rect x="${x}" y="${y}" width="${cutWidth}" height="${cutHeight}" />`;
    const transform = `rotate(${angle} ${x + cutWidth / 2} ${y + cutHeight / 2})`;
    return {
      definition: `<clipPath id="${id}">${shape}</clipPath>`,
      material: `<g id="portrait-cutout-material-${index}" transform="${transform}" clip-path="url(#${id})"><image href="${href}" x="${x}" y="${y}" width="${cutWidth}" height="${cutHeight}" preserveAspectRatio="${align(cutout.sourcePosition)}" filter="url(#cutout-contrast)"/></g>`,
      window: `<g id="green-cutout-window-${index}" transform="${transform}" clip-path="url(#${id})"><rect x="${x}" y="${y}" width="${cutWidth}" height="${cutHeight}" fill="${escapeXml(spec.style?.accent ?? '#29D3B2')}" style="mix-blend-mode:color"/></g>`,
    };
  }));
  const textMarkup = await buildTextMarkup(spec, layout);
  const body = `<defs><filter id="main-contrast"><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncR type="linear" slope="1.28" intercept="-0.09"/><feFuncG type="linear" slope="1.28" intercept="-0.09"/><feFuncB type="linear" slope="1.28" intercept="-0.09"/></feComponentTransfer></filter><filter id="cutout-contrast"><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncR type="linear" slope="1.18" intercept="-0.05"/><feFuncG type="linear" slope="1.18" intercept="-0.05"/><feFuncB type="linear" slope="1.18" intercept="-0.05"/></feComponentTransfer></filter>${cuts.map((cut) => cut.definition).join('')}</defs><g id="main-background"><rect width="${px(width)}" height="${px(height)}" fill="${escapeXml(background)}"/><image href="${mainHref}" width="${px(width)}" height="${px(height)}" preserveAspectRatio="xMidYMid slice" filter="url(#main-contrast)"/></g><g id="portrait-cutout-materials">${cuts.map((cut) => cut.material).join('')}</g><g id="green-cutout-windows">${cuts.map((cut) => cut.window).join('')}</g><g id="text-islands">${textMarkup}</g><g id="graphics">${buildDecorationMarkup(spec, layout)}</g>`;
  return wrapper(spec, body, spec.copy?.headline ?? 'Poster');
}
