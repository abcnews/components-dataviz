/**
 * src/icons/generator.ts
 *
 * Pure icon generator. It takes the raw text of the normalised icon files
 * (see scripts/import-figma-icons.ts) and returns a function that renders any icon
 * at any width. It has no Vite dependency; src/icons/icons.ts wires it up to
 * Vite's import.meta.glob.
 *
 * It needs a browser DOM (DOMParser, XMLSerializer, document.createElementNS), so
 * it must only be called client-side.
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
 *   4. If `color` is given it replaces the accent fill/stroke in the markup (the #F5F5F5 halo is kept).
 *      If `dark` is true the halo becomes #000000 instead.
 *   5. Paths painted with the accent get the class "fill"; paths painted with the halo
 *      get the class "border".
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
	/** Every attribute except `d`, in file order. */
	attributes: Attribute[];
	hasStroke: boolean;
	/** Stroke thickness in source units; 0 when the layer has no stroke. */
	strokeWidth: number;
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

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

function parseSvgDocument(svg: string, file: string): Document {
	const svgDocument = new DOMParser().parseFromString(svg, 'image/svg+xml');
	const parseError = svgDocument.querySelector('parsererror');
	if (parseError) throw new Error(`${file}: invalid SVG (${parseError.textContent?.trim()})`);
	return svgDocument;
}

function parseLayer(pathElement: Element, file: string): Layer {
	const pathData = pathElement.getAttribute('d');
	if (!pathData) throw new Error(`${file}: <path> without "d"`);

	const attributes = Array.from(pathElement.attributes, ({ name, value }): Attribute => [
		name,
		value
	]).filter(([name]) => name !== 'd');

	const stroke = pathElement.getAttribute('stroke');
	const hasStroke = stroke !== null && stroke !== 'none';
	const strokeWidth = hasStroke ? Number(pathElement.getAttribute('stroke-width') ?? 1) : 0;

	return { segments: parsePath(pathData), attributes, hasStroke, strokeWidth };
}

function parseTier(index: number, svg: string, file: string): Tier {
	const layers = Array.from(parseSvgDocument(svg, file).querySelectorAll('path'), (pathElement) =>
		parseLayer(pathElement, file)
	);
	if (layers.length === 0) throw new Error(`${file}: no <path> elements found`);

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
 * Recolours a layer's paint and tags it with its role:
 *  - accent paint (every fill/stroke except the halo) is replaced by `color`, and the
 *    layer gets the class "fill".
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
	const LIGHT_HALO_COLOR = '#f5f5f5';
	const DARK_HALO_COLOR = '#000000';

	const paintRole = ([name, value]: Attribute): 'halo' | 'accent' | undefined => {
		if (!PAINT_ATTRIBUTES.has(name) || value === 'none' || value.startsWith('url('))
			return undefined;
		return value.toLowerCase() === LIGHT_HALO_COLOR ? 'halo' : 'accent';
	};

	const roles = attributes.map(paintRole);

	const painted = attributes.map((attribute, index): Attribute => {
		const [name] = attribute;
		if (roles[index] === 'accent' && color) return [name, color];
		if (roles[index] === 'halo' && dark) return [name, DARK_HALO_COLOR];
		return attribute;
	});

	const classNames: string[] = [];
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
