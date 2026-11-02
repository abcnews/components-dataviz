/**
 * src/icons/generator.ts
 *
 * Pure icon generator. It takes the raw text of the normalised icon files
 * (see scripts/import-figma-icons.ts) and returns a function that renders any icon
 * at any width. It has no Vite dependency; src/icons/icons.ts wires it up to
 * Vite's import.meta.glob.
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
 *   5. Coordinates are baked into px space (1 unit = 1px), so strokes are correct
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
} from './path.ts';

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
	 * Replaces the accent colour only; the light halo outline is kept. Omit to keep the artwork's own colour.
	 */
	color?: string;
}

/** One bespoke size step of an icon style. */
export interface TierInfo {
	tier: number;
	/** Natural visible width in px (geometry + stroke) — the width at which this tier renders unscaled. */
	width: number;
}

/** Raw icon files keyed by path, e.g. { "./svg/doughnut/stroked-2.svg": "<svg…" }. */
export type RawIconFiles = Record<string, string>;

interface Layer {
	segs: Seg[];
	/** Every attribute except `d`, in file order. */
	attrs: [string, string][];
	hasStroke: boolean;
}

interface Tier {
	index: number;
	layers: Layer[];
	/** Geometry bounds (stroke excluded), in source coordinates. */
	bounds: Bounds;
	/** Half of the thickest stroke: how far the artwork extends beyond its geometry. */
	inset: number;
	/** Natural visible width at scale 1: geometry + stroke. */
	visibleWidth: number;
}

const FILE_RE = /(?:^|\/)([a-z0-9-]+)\/(filled|stroked)-(\d+)\.svg$/;
const PATH_RE = /<path\b([^>]*?)\/>/g;
const ATTR_RE = /([\w:-]+)="([^"]*)"/g;

function parseTier(index: number, svg: string, file: string): Tier {
	const layers: Layer[] = [];
	let maxStroke = 0;

	for (const m of svg.matchAll(PATH_RE)) {
		const attrs: [string, string][] = [];
		let d = '';
		for (const a of (m[1] ?? '').matchAll(ATTR_RE)) {
			const key = a[1] as string;
			const value = a[2] as string;
			if (key === 'd') d = value;
			else attrs.push([key, value]);
		}
		if (!d) throw new Error(`${file}: <path> without "d"`);

		const get = (key: string) => attrs.find(([k]) => k === key)?.[1];
		const stroke = get('stroke');
		const hasStroke = stroke !== undefined && stroke !== 'none';
		if (hasStroke) maxStroke = Math.max(maxStroke, Number(get('stroke-width') ?? 1));

		layers.push({ segs: parsePath(d), attrs, hasStroke });
	}
	if (layers.length === 0) throw new Error(`${file}: no <path> elements found`);

	const bounds = unionBounds(layers.map((l) => pathBounds(l.segs)));
	const inset = maxStroke / 2;
	return { index, layers, bounds, inset, visibleWidth: bounds.maxX - bounds.minX + 2 * inset };
}

/** Nearest tier by ratio of visible widths. */
function pickTier(tiers: Tier[], width: number): Tier {
	let best = tiers[0] as Tier;
	let bestDistance = Infinity;
	for (const tier of tiers) {
		const distance = Math.abs(Math.log(width / tier.visibleWidth));
		if (distance < bestDistance) {
			best = tier;
			bestDistance = distance;
		}
	}
	return best;
}

const fmt = (v: number) => String(Math.round(v * 1000) / 1000);

/** Attributes that carry paint and are therefore recoloured. */
const PAINT_ATTRS = new Set(['fill', 'stroke']);

/**
 * The colour ends up inside an attribute of markup that is injected as HTML, so only
 * characters that CSS colour syntax needs are allowed. Quotes and angle brackets can
 * never get through.
 */
const COLOR_RE = /^[#\w\s().,%/+-]+$/;

function checkColor(color: string): string {
	const value = color.trim();
	if (!COLOR_RE.test(value)) throw new RangeError(`Invalid colour "${color}"`);
	return value;
}

/**
 * The light outline drawn around the accent so icons stay legible on any background.
 * It is part of the design, so it is never recoloured.
 */
const HALO_COLOR = '#f5f5f5';

/**
 * Swap in `color` for the accent paint: every fill/stroke except the halo.
 * `none` and gradient/pattern refs are left alone too.
 */
function recolor(attrs: [string, string][], color: string | undefined): [string, string][] {
	if (!color) return attrs;
	return attrs.map(([k, v]) => {
		const keep =
			!PAINT_ATTRS.has(k) || v === 'none' || v.startsWith('url(') || v.toLowerCase() === HALO_COLOR;
		return keep ? [k, v] : [k, color];
	});
}

export function createIconGenerator(files: RawIconFiles) {
	const registry = new Map<string, Partial<Record<IconStyle, Tier[]>>>();

	for (const [file, svg] of Object.entries(files)) {
		const m = FILE_RE.exec(file);
		if (!m)
			throw new Error(
				`Unexpected icon file "${file}". Expected <name>/<filled|stroked>-<tier>.svg`
			);
		const name = m[1] as string;
		const style = m[2] as IconStyle;
		const index = Number(m[3]);

		const styles = registry.get(name) ?? {};
		const tiers = styles[style] ?? [];
		if (tiers.some((t) => t.index === index))
			throw new Error(`Duplicate icon file for ${name}/${style}-${index}`);
		tiers.push(parseTier(index, svg, file));
		tiers.sort((a, b) => a.index - b.index);
		styles[style] = tiers;
		registry.set(name, styles);
	}

	function listIcons(): string[] {
		return [...registry.keys()].sort();
	}

	/** The bespoke tiers an icon style has, with the width each one renders at unscaled. */
	function listTiers(name: string, variant: IconStyle): TierInfo[] {
		const tiers = registry.get(name)?.[variant];
		if (!tiers) throw new Error(`Icon "${name}" has no "${variant}" variant`);
		return tiers.map((t) => ({ tier: t.index, width: t.visibleWidth }));
	}

	function generateIcon({ name, width, variant, color }: IconRequest): string {
		const styles = registry.get(name);
		if (!styles) throw new Error(`Unknown icon "${name}". Available: ${listIcons().join(', ')}`);

		const tiers = styles[variant];
		if (!tiers) {
			throw new Error(
				`Icon "${name}" has no "${variant}" variant (available: ${Object.keys(styles).join(', ')})`
			);
		}
		if (!Number.isFinite(width) || width <= 0)
			throw new RangeError(`width must be a positive number, got ${width}`);

		const paint = color ? checkColor(color) : undefined;

		const tier = pickTier(tiers, width);
		const { bounds, inset } = tier;
		const geometryWidth = bounds.maxX - bounds.minX;
		const geometryHeight = bounds.maxY - bounds.minY;

		const artWidth = width - 2 * inset;
		if (artWidth <= 0 || geometryWidth <= 0) {
			throw new RangeError(
				`width ${width}px is too small for ${name}/${variant}: its strokes alone need ${fmt(2 * inset)}px`
			);
		}

		const scale = artWidth / geometryWidth;
		const height = geometryHeight * scale + 2 * inset;

		const paths = tier.layers.map((layer) => {
			const d = serializePath(
				mapPoints(layer.segs, (x, y) => [
					(x - bounds.minX) * scale + inset,
					(y - bounds.minY) * scale + inset
				]),
				3
			);
			const attrs = recolor(layer.attrs, paint).map(([k, v]) => `${k}="${v}"`);
			if (layer.hasStroke) attrs.push('vector-effect="non-scaling-stroke"');
			return `  <path d="${d}" ${attrs.join(' ')}/>`;
		});

		return [
			`<svg xmlns="http://www.w3.org/2000/svg" width="${fmt(width)}" height="${fmt(height)}" viewBox="0 0 ${fmt(width)} ${fmt(height)}" fill="none" overflow="visible">`,
			...paths,
			'</svg>'
		].join('\n');
	}

	return { generateIcon, listIcons, listTiers };
}
