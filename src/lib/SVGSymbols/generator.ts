/**
 * src/icons/generator.ts
 *
 * Pure icon generator. It takes the raw text of the icon files (as exported from
 * Figma, see scripts/split-icons.mjs) and returns a function that renders any icon
 * at any width. It has no Vite dependency; src/icons/icons.ts wires it up to
 * Vite's import.meta.glob.
 *
 * It needs a browser DOM (DOMParser, XMLSerializer, document.createElementNS), so
 * it must only be called client-side.
 *
 * Accepted input markup
 * ---------------------
 * Files can be used exactly as Figma exported them:
 *   - <path>, <rect> (with rx, optional transform="rotate(a cx cy)") and <circle>
 *   - <use xlink:href="#id"> pointing at a <path> in <defs>
 *   - <mask> (see "Masks" below). <defs> and <mask> contents are never drawn directly.
 *   - H/V path commands
 * Anything else (<g>, <ellipse>, other transforms…) throws, so problems are loud.
 *
 * Masks
 * -----
 * Figma exports "outside-only halo" strokes as a stroke masked by its own shape.
 * Masks aren't carried into the output (their ids would collide when several icons
 * share a page). Instead a masked layer is moved directly beneath the layer that has
 * the same geometry, which looks identical: the halo's inner half is covered by the fill.
 * This assumes the mask is the layer's own geometry, which holds for every Figma export
 * we have so far; a masked layer with no matching partner throws.
 *
 * How a request is resolved
 * -------------------------
 * Every icon style has one or more "tiers" (bespoke size steps, 0 = smallest).
 *
 *   1. `width` is the final visible width in px, stroke included.
 *   2. The tier whose natural visible width is closest to `width` is chosen
 *      (compared as a ratio, so 10->20 is as far as 20->40). Below the smallest
 *      tier we scale tier 0 down; above the largest we scale the last tier up.
 *   3. Only the geometry is scaled. Stroke widths stay exactly as designed, so the
 *      result is: width = scaled geometry + fixed stroke thickness.
 *   4. If `color` is given it replaces the accent fill/stroke in the markup (the halo is kept).
 *      If `dark` is true the halo (and glyph) become #000000 instead.
 *   5. Paint roles, decided per attribute:
 *        stroke white / #fff / #f5f5f5   -> halo   (class "border")
 *        fill   #f5f5f5                  -> halo   (class "border")
 *        fill   white / #fff             -> glyph  (class "glyph"; never recoloured by `color`,
 *                                                     but follows the halo: black in dark mode)
 *        any other fill / stroke         -> accent (class "fill")
 *   6. Coordinates are baked into px space (1 unit = 1px), so strokes are correct
 *      in every renderer. Strokes also carry vector-effect="non-scaling-stroke",
 *      so they stay constant if the SVG is later resized with CSS.
 */

import {
	mapPoints,
	parsePath,
	pathBounds,
	serializePath,
	unionBounds,
	type Bounds,
	type Seg
} from './path';

export type IconStyle = 'filled' | 'stroked';

export interface IconRequest {
	/** Icon slug, e.g. "doughnut". See listIcons(). */
	name: string;
	/** Final rendered width in px, including stroke. Height follows the artwork's aspect ratio. */
	width: number;
	/** "filled" or "stroked". */
	variant: IconStyle;
	/**
	 * Any CSS colour (hex, rgb(), hsl(), oklch(), named…). Written straight into the
	 * SVG's fill / stroke attributes, so it works with or without Svelte.
	 * Replaces the accent colour only; the halo outline is kept. Omit to keep the artwork's own colour.
	 */
	color?: string;
	/** Dark mode: the halo outline is drawn in #000000 instead of the light default. */
	dark?: boolean;
}

/** One bespoke size step of an icon style. */
export interface TierInfo {
	tier: number;
	/** Natural visible width in px (geometry + stroke) — the width at which this tier renders unscaled. */
	width: number;
}

/** Raw icon files keyed by path, e.g. { "./svg/doughnut/stroked-2.svg": "<svg…" }. */
export type RawIconFiles = Record<string, string>;

/** An SVG attribute as a [name, value] pair. */
type Attribute = [name: string, value: string];

interface Layer {
	segments: Seg[];
	/** Every paint/stroke attribute, in file order (geometry attributes are removed). */
	attributes: Attribute[];
	hasStroke: boolean;
	/** Stroke thickness in source units; 0 when the layer has no stroke. */
	strokeWidth: number;
	/** Was masked by its own shape in the source; gets drawn beneath its partner instead. */
	underlay: boolean;
	/** Serialised geometry, used to find an underlay's partner layer. */
	geometryKey: string;
}

interface Tier {
	index: number;
	layers: Layer[];
	/** Geometry bounds (stroke excluded), in source coordinates. */
	bounds: Bounds;
	/** Half of the thickest stroke: how far the artwork extends beyond its geometry. */
	strokeInset: number;
	/** Natural visible width at scale 1: geometry + stroke. */
	visibleWidth: number;
}

type Registry = Map<string, Partial<Record<IconStyle, Tier[]>>>;

const formatNumber = (value: number) => String(Math.round(value * 1000) / 1000);

const boundsWidth = (bounds: Bounds) => bounds.maxX - bounds.minX;
const boundsHeight = (bounds: Bounds) => bounds.maxY - bounds.minY;

const numbersIn = (text: string) => (text.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi) ?? []).map(Number);

// ---------------------------------------------------------------------------
// Shapes -> path data
// ---------------------------------------------------------------------------

/** Quarter-circle Bézier control-point distance, as a fraction of the radius. */
const KAPPA = 0.5522847498;

/**
 * Rewrites H/V as L so the path only uses M, L, C and Z. Paths without H/V pass
 * through untouched. If `parsePath` already handles H/V this is harmless.
 */
function expandHorizontalVertical(pathData: string): string {
	if (!/[HV]/.test(pathData)) return pathData;

	const unsupported = /[^MLHVCZ\d\s.,eE+-]/.exec(pathData);
	if (unsupported) {
		throw new Error(
			`Unsupported path command "${unsupported[0]}" in a path that uses H/V: "${pathData.slice(0, 40)}…"`
		);
	}

	const out: string[] = [];
	let x = 0;
	let y = 0;
	let startX = 0;
	let startY = 0;

	for (const [, command = '', args = ''] of pathData.matchAll(/([MLHVCZ])([^MLHVCZ]*)/g)) {
		const n = numbersIn(args);
		switch (command) {
			case 'M':
			case 'L':
				for (let i = 0; i + 1 < n.length; i += 2) {
					[x, y] = [n[i]!, n[i + 1]!];
					const isMove = command === 'M' && i === 0;
					if (isMove) [startX, startY] = [x, y];
					out.push(`${isMove ? 'M' : 'L'}${x} ${y}`);
				}
				break;
			case 'H':
				for (const value of n) {
					x = value;
					out.push(`L${x} ${y}`);
				}
				break;
			case 'V':
				for (const value of n) {
					y = value;
					out.push(`L${x} ${y}`);
				}
				break;
			case 'C':
				for (let i = 0; i + 5 < n.length; i += 6) {
					out.push(`C${n.slice(i, i + 6).join(' ')}`);
					[x, y] = [n[i + 4]!, n[i + 5]!];
				}
				break;
			case 'Z':
				out.push('Z');
				[x, y] = [startX, startY];
				break;
		}
	}
	return out.join(' ');
}

function rectPathData(x: number, y: number, width: number, height: number, radius: number): string {
	const r = Math.min(Math.max(radius, 0), width / 2, height / 2);
	const f = formatNumber;
	if (r === 0) {
		return `M${f(x)} ${f(y)} L${f(x + width)} ${f(y)} L${f(x + width)} ${f(y + height)} L${f(x)} ${f(y + height)} Z`;
	}
	const k = r * KAPPA;
	const [x2, y2] = [x + width, y + height];
	return [
		`M${f(x + r)} ${f(y)}`,
		`L${f(x2 - r)} ${f(y)}`,
		`C${f(x2 - r + k)} ${f(y)} ${f(x2)} ${f(y + r - k)} ${f(x2)} ${f(y + r)}`,
		`L${f(x2)} ${f(y2 - r)}`,
		`C${f(x2)} ${f(y2 - r + k)} ${f(x2 - r + k)} ${f(y2)} ${f(x2 - r)} ${f(y2)}`,
		`L${f(x + r)} ${f(y2)}`,
		`C${f(x + r - k)} ${f(y2)} ${f(x)} ${f(y2 - r + k)} ${f(x)} ${f(y2 - r)}`,
		`L${f(x)} ${f(y + r)}`,
		`C${f(x)} ${f(y + r - k)} ${f(x + r - k)} ${f(y)} ${f(x + r)} ${f(y)}`,
		'Z'
	].join(' ');
}

function circlePathData(cx: number, cy: number, r: number): string {
	const k = r * KAPPA;
	const f = formatNumber;
	return [
		`M${f(cx + r)} ${f(cy)}`,
		`C${f(cx + r)} ${f(cy + k)} ${f(cx + k)} ${f(cy + r)} ${f(cx)} ${f(cy + r)}`,
		`C${f(cx - k)} ${f(cy + r)} ${f(cx - r)} ${f(cy + k)} ${f(cx - r)} ${f(cy)}`,
		`C${f(cx - r)} ${f(cy - k)} ${f(cx - k)} ${f(cy - r)} ${f(cx)} ${f(cy - r)}`,
		`C${f(cx + k)} ${f(cy - r)} ${f(cx + r)} ${f(cy - k)} ${f(cx + r)} ${f(cy)}`,
		'Z'
	].join(' ');
}

/** Applies a `rotate(angle [cx cy])` transform. Other transforms are rejected. */
function applyTransform(segments: Seg[], transform: string, file: string): Seg[] {
	const match = /^\s*rotate\(\s*(-?[\d.]+)(?:[\s,]+(-?[\d.]+)[\s,]+(-?[\d.]+))?\s*\)\s*$/.exec(
		transform
	);
	if (!match)
		throw new Error(`${file}: unsupported transform "${transform}" (only rotate() is handled)`);

	const angle = (Number(match[1]) * Math.PI) / 180;
	const [cx, cy] = [Number(match[2] ?? 0), Number(match[3] ?? 0)];
	const [cos, sin] = [Math.cos(angle), Math.sin(angle)];

	return mapPoints(segments, (x, y): [number, number] => [
		cx + (x - cx) * cos - (y - cy) * sin,
		cy + (x - cx) * sin + (y - cy) * cos
	]);
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

/** Attributes that describe geometry or wiring rather than paint; they never reach the output. */
const NON_PAINT_ATTRIBUTES = new Set([
	'd',
	'x',
	'y',
	'width',
	'height',
	'rx',
	'ry',
	'cx',
	'cy',
	'r',
	'transform',
	'mask',
	'id',
	'xlink:href',
	'href'
]);

/** Elements whose children are referenced or used as masks, never drawn directly. */
const NON_RENDERED_TAGS = new Set(['defs', 'mask', 'title', 'desc', 'metadata']);

function parseSvgDocument(svg: string, file: string): Document {
	const svgDocument = new DOMParser().parseFromString(svg, 'image/svg+xml');
	const parseError = svgDocument.querySelector('parsererror');
	if (parseError) throw new Error(`${file}: invalid SVG (${parseError.textContent?.trim()})`);
	return svgDocument;
}

function resolveUse(useElement: Element, svgDocument: Document, file: string): Element {
	if (useElement.hasAttribute('transform')) {
		throw new Error(`${file}: <use> with a transform is not supported`);
	}
	const href = useElement.getAttribute('xlink:href') ?? useElement.getAttribute('href');
	if (!href?.startsWith('#')) throw new Error(`${file}: <use> needs a local "#id" href`);

	const id = href.slice(1);
	const target = Array.from(svgDocument.querySelectorAll('[id]')).find(
		(candidate) => candidate.getAttribute('id') === id
	);
	if (!target) throw new Error(`${file}: <use> points at missing id "${id}"`);
	return target;
}

function elementSegments(element: Element, file: string): Seg[] {
	const tag = element.localName;
	const number = (name: string, fallback?: number): number => {
		const raw = element.getAttribute(name);
		if (raw === null) {
			if (fallback !== undefined) return fallback;
			throw new Error(`${file}: <${tag}> without "${name}"`);
		}
		const value = Number(raw);
		if (!Number.isFinite(value)) throw new Error(`${file}: <${tag}> has invalid ${name}="${raw}"`);
		return value;
	};

	let pathData: string;
	switch (tag) {
		case 'path': {
			const d = element.getAttribute('d');
			if (!d) throw new Error(`${file}: <path> without "d"`);
			pathData = expandHorizontalVertical(d);
			break;
		}
		case 'rect':
			pathData = rectPathData(
				number('x', 0),
				number('y', 0),
				number('width'),
				number('height'),
				number('rx', number('ry', 0))
			);
			break;
		case 'circle':
			pathData = circlePathData(number('cx', 0), number('cy', 0), number('r'));
			break;
		default:
			throw new Error(`${file}: unsupported element <${tag}>`);
	}

	const segments = parsePath(pathData);
	const transform = element.getAttribute('transform');
	return transform ? applyTransform(segments, transform, file) : segments;
}

function parseLayer(element: Element, svgDocument: Document, file: string): Layer {
	// A <use> draws its target's geometry; the target's attributes apply first, then the <use>'s.
	const source = element.localName === 'use' ? resolveUse(element, svgDocument, file) : element;
	const segments = elementSegments(source, file);

	const merged = new Map<string, string>();
	const collectPaint = (from: Element) => {
		for (const { name, value } of Array.from(from.attributes)) {
			if (!NON_PAINT_ATTRIBUTES.has(name)) merged.set(name, value);
		}
	};
	collectPaint(source);
	if (source !== element) collectPaint(element);

	const attributes = Array.from(merged, ([name, value]): Attribute => [name, value]);
	const stroke = merged.get('stroke');
	const hasStroke = stroke !== undefined && stroke !== 'none';
	const strokeWidth = hasStroke ? Number(merged.get('stroke-width') ?? 1) : 0;

	return {
		segments,
		attributes,
		hasStroke,
		strokeWidth,
		underlay: element.hasAttribute('mask'),
		geometryKey: serializePath(segments, 3)
	};
}

/** Moves each masked (underlay) layer directly beneath the earlier layer with the same geometry. */
function orderUnderlays(layers: Layer[], file: string): Layer[] {
	const ordered: Layer[] = [];
	for (const layer of layers) {
		if (!layer.underlay) {
			ordered.push(layer);
			continue;
		}
		let partner = -1;
		for (let i = ordered.length - 1; i >= 0; i--) {
			if (!ordered[i]!.underlay && ordered[i]!.geometryKey === layer.geometryKey) {
				partner = i;
				break;
			}
		}
		if (partner === -1) {
			throw new Error(`${file}: masked layer has no earlier layer with the same geometry`);
		}
		ordered.splice(partner, 0, layer);
	}
	return ordered;
}

function parseTier(index: number, svg: string, file: string): Tier {
	const svgDocument = parseSvgDocument(svg, file);
	const rendered = Array.from(svgDocument.documentElement.children).filter(
		(child) => !NON_RENDERED_TAGS.has(child.localName)
	);
	if (rendered.length === 0) throw new Error(`${file}: nothing to draw`);

	const layers = orderUnderlays(
		rendered.map((element) => parseLayer(element, svgDocument, file)),
		file
	);

	const bounds = unionBounds(layers.map((layer) => pathBounds(layer.segments)));
	const thickestStroke = Math.max(0, ...layers.map((layer) => layer.strokeWidth));
	const strokeInset = thickestStroke / 2;

	return {
		index,
		layers,
		bounds,
		strokeInset,
		visibleWidth: boundsWidth(bounds) + 2 * strokeInset
	};
}

function parseIconFilePath(filePath: string) {
	const ICON_FILE_PATTERN = /(?:^|\/)([a-z0-9-]+)\/(filled|stroked)-(\d+)\.svg$/;
	const match = ICON_FILE_PATTERN.exec(filePath);
	if (!match) {
		throw new Error(
			`Unexpected icon file "${filePath}". Expected <name>/<filled|stroked>-<tier>.svg`
		);
	}
	const [, name = '', style = '', tierIndex = ''] = match;
	return { name, style: style as IconStyle, tierIndex: Number(tierIndex) };
}

function buildRegistry(files: RawIconFiles): Registry {
	const parsedTiers = Object.entries(files).map(([filePath, svg]) => {
		const { name, style, tierIndex } = parseIconFilePath(filePath);
		return { name, style, tier: parseTier(tierIndex, svg, filePath) };
	});

	const registry: Registry = new Map();
	for (const { name, style, tier } of parsedTiers) {
		const styles = registry.get(name) ?? {};
		const existingTiers = styles[style] ?? [];
		if (existingTiers.some((existing) => existing.index === tier.index)) {
			throw new Error(`Duplicate icon file for ${name}/${style}-${tier.index}`);
		}
		styles[style] = [...existingTiers, tier].sort((a, b) => a.index - b.index);
		registry.set(name, styles);
	}
	return registry;
}

// ---------------------------------------------------------------------------
// Rendering helpers
// ---------------------------------------------------------------------------

/** The tier whose visible width is closest to `width`, compared as a ratio. */
function pickClosestTier(tiers: Tier[], width: number): Tier {
	const distanceFromWidth = (tier: Tier) => Math.abs(Math.log(width / tier.visibleWidth));
	return tiers.reduce((closest, tier) =>
		distanceFromWidth(tier) < distanceFromWidth(closest) ? tier : closest
	);
}

function validateColor(color: string): string {
	/**
	 * Only characters that CSS colour syntax needs. Attribute values are escaped by the
	 * XML serializer, so this isn't what keeps the markup safe; it makes nonsense input
	 * fail loudly instead of producing a broken icon.
	 */
	const CSS_COLOR_PATTERN = /^[#\w\s().,%/+-]+$/;

	const trimmed = color.trim();
	if (!CSS_COLOR_PATTERN.test(trimmed)) throw new RangeError(`Invalid colour "${color}"`);
	return trimmed;
}

/**
 * Recolours a layer's paint and tags it with its role (see the header for the rules):
 *  - glyph paint (a white fill, e.g. the number on a filled icon) is never recoloured by
 *    `color`, and matches the halo: white in light mode, black in dark mode, so it contrasts
 *    with a light accent either way; the layer gets the class "glyph".
 *  - accent paint (every other fill/stroke) is replaced by `color`, and the layer gets
 *    the class "fill".
 *  - halo paint (the light outline that keeps icons legible on any background) becomes
 *    black in dark mode, and the layer gets the class "border".
 * `none` and gradient/pattern refs are left alone.
 */
function applyPaint(
	attributes: Attribute[],
	color: string | undefined,
	dark: boolean
): Attribute[] {
	const PAINT_ATTRIBUTES = new Set(['fill', 'stroke']);
	const HALO_FILL = '#f5f5f5';
	const WHITE_PAINTS = new Set(['white', '#fff', '#ffffff']);
	const DARK_HALO_COLOR = '#000000';

	const paintRole = ([name, value]: Attribute): 'halo' | 'glyph' | 'accent' | undefined => {
		if (!PAINT_ATTRIBUTES.has(name) || value === 'none' || value.startsWith('url('))
			return undefined;
		const normalised = value.trim().toLowerCase();
		if (normalised === HALO_FILL) return 'halo';
		if (WHITE_PAINTS.has(normalised)) return name === 'stroke' ? 'halo' : 'glyph';
		return 'accent';
	};

	const roles = attributes.map(paintRole);

	const painted = attributes.map((attribute, index): Attribute => {
		const [name] = attribute;
		if (roles[index] === 'accent' && color) return [name, color];
		if ((roles[index] === 'halo' || roles[index] === 'glyph') && dark) {
			return [name, DARK_HALO_COLOR];
		}
		return attribute;
	});

	const classNames: string[] = [];
	if (roles.includes('glyph')) classNames.push('glyph');
	if (roles.includes('accent')) classNames.push('fill');
	if (roles.includes('halo')) classNames.push('border');

	return classNames.length > 0 ? [...painted, ['class', classNames.join(' ')]] : painted;
}

function createSvgElement<Tag extends keyof SVGElementTagNameMap>(
	tagName: Tag,
	attributes: Attribute[]
): SVGElementTagNameMap[Tag] {
	const element = document.createElementNS('http://www.w3.org/2000/svg', tagName);
	attributes.forEach(([name, value]) => element.setAttribute(name, value));
	return element;
}

/** Builds one <path>, with its geometry scaled into output pixel space. */
function renderLayer(
	layer: Layer,
	tier: Tier,
	scale: number,
	color: string | undefined,
	dark: boolean
): SVGPathElement {
	const { bounds, strokeInset } = tier;

	const toOutputSpace = (x: number, y: number): [number, number] => [
		(x - bounds.minX) * scale + strokeInset,
		(y - bounds.minY) * scale + strokeInset
	];

	const pathData = serializePath(mapPoints(layer.segments, toOutputSpace), 3);
	const strokeBehaviour: Attribute[] = layer.hasStroke
		? [['vector-effect', 'non-scaling-stroke']]
		: [];

	return createSvgElement('path', [
		['d', pathData],
		...applyPaint(layer.attributes, color, dark),
		...strokeBehaviour
	]);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function createIconGenerator(files: RawIconFiles) {
	const registry = buildRegistry(files);

	function listIcons(): string[] {
		return [...registry.keys()].sort();
	}

	/** The bespoke tiers an icon style has, with the width each one renders at unscaled. */
	function listTiers(name: string, variant: IconStyle): TierInfo[] {
		const tiers = registry.get(name)?.[variant];
		if (!tiers) throw new Error(`Icon "${name}" has no "${variant}" variant`);
		return tiers.map((tier) => ({ tier: tier.index, width: tier.visibleWidth }));
	}

	function requireTiers(name: string, variant: IconStyle): Tier[] {
		const styles = registry.get(name);
		if (!styles) throw new Error(`Unknown icon "${name}". Available: ${listIcons().join(', ')}`);

		const tiers = styles[variant];
		if (!tiers) {
			throw new Error(
				`Icon "${name}" has no "${variant}" variant (available: ${Object.keys(styles).join(', ')})`
			);
		}
		return tiers;
	}

	function generateIcon({ name, width, variant, color, dark = false }: IconRequest): string {
		const tiers = requireTiers(name, variant);
		if (!Number.isFinite(width) || width <= 0) {
			throw new RangeError(`width must be a positive number, got ${width}`);
		}
		const validatedColor = color ? validateColor(color) : undefined;

		const tier = pickClosestTier(tiers, width);
		const geometryWidth = boundsWidth(tier.bounds);
		const geometryHeight = boundsHeight(tier.bounds);

		const artworkWidth = width - 2 * tier.strokeInset;
		if (artworkWidth <= 0 || geometryWidth <= 0) {
			throw new RangeError(
				`width ${width}px is too small for ${name}/${variant}: its strokes alone need ${formatNumber(2 * tier.strokeInset)}px`
			);
		}

		const scale = artworkWidth / geometryWidth;
		const height = geometryHeight * scale + 2 * tier.strokeInset;

		const svgElement = createSvgElement('svg', [
			['width', formatNumber(width)],
			['height', formatNumber(height)],
			['viewBox', `0 0 ${formatNumber(width)} ${formatNumber(height)}`],
			['fill', 'none'],
			['overflow', 'visible']
		]);
		svgElement.append(
			...tier.layers.map((layer) => renderLayer(layer, tier, scale, validatedColor, dark))
		);

		return new XMLSerializer().serializeToString(svgElement);
	}

	return { generateIcon, listIcons, listTiers };
}
