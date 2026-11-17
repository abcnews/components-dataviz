// ─── Where the SVGs are served from ──────────────────────────────────────────
// The SVGs live in `public/symbols` and are fetched on demand, so they add nothing to the bundle.
// Apps using this library always fetch the ABC-hosted copy, so they need no set-up. Only this
// repo's Storybook reads the local folder, so unreleased artwork can be previewed.

/** Where the uploaded copy of `public/symbols` lives. No trailing slash. */
export const HOSTED_SYMBOLS_BASE_URL =
	'https://www.abc.net.au/res/sites/news-projects/abcnewscomponents-dataviz/0.0.9/symbols';

/**
 * Set to `true` by `.storybook/main.ts` (Vite `define`). It isn't defined anywhere else, so the
 * published package, and the apps that bundle it, never see it. We can't use a "dev mode" flag
 * here: that is also true while an app using this library runs its own dev server.
 */
declare const __LOCAL_SYMBOLS__: boolean | undefined;

const SYMBOLS_BASE_URL =
	typeof __LOCAL_SYMBOLS__ !== 'undefined' && __LOCAL_SYMBOLS__
		? '/symbols'
		: HOSTED_SYMBOLS_BASE_URL;

const SOURCE_COLOUR = '#1E5AEB';
const SOURCE_STROKE = '"white"';

// Nominal pixel width of each size variant (Size=1 … Size=4).
const SIZES = { 1: 10, 2: 15, 3: 19, 4: 23 } as const;

type SizeKey = keyof typeof SIZES;

const STROKE_BY_SCHEME = { light: 'white', dark: 'black' } as const;

const SHAPE_SELECTOR = 'path, circle, ellipse, rect, line, polyline, polygon';

/** Raw SVG strings already requested, keyed by file name, so a symbol used many times loads once. */
const loading = new Map<string, Promise<string>>();

const loadSource = (fileName: string) => {
	const existing = loading.get(fileName);
	if (existing) return existing;
	const source = fetch(`${SYMBOLS_BASE_URL}/${encodeURIComponent(fileName)}`).then((response) => {
		if (!response.ok) throw new Error(`Symbol not found: ${fileName} (${response.status})`);
		return response.text();
	});
	loading.set(fileName, source);
	// A failed load (e.g. offline) shouldn't stick: let the next call retry.
	source.catch(() => loading.delete(fileName));
	return source;
};

// Position in this list is the file number (0–19).
export const SYMBOL_NAMES = [
	'square',
	'circle',
	'torus',
	'triangleb',
	'trianglea',
	'arrow',
	'diamond',
	'hexagona',
	'hexagonb',
	'pin',
	'number0',
	'number1',
	'number2',
	'number3',
	'number4',
	'number5',
	'number6',
	'number7',
	'number8',
	'number9'
] as const;

export type SymbolName = (typeof SYMBOL_NAMES)[number];

/**
 * Where the tip of a symbol that points somewhere is, per size file: `[viewBox width, viewBox
 * height, tip x, tip y]`, all in that file's own viewBox units. The pin and arrow point down, so
 * their tip is at the bottom, not the middle. The tip is the end of the drawn shape (the white
 * outline is ignored). The padding below the tip differs from file to file, so each is measured
 * from its SVG: re-check these if the artwork changes. Symbols not listed here are centred.
 */
const TIPS: Partial<
	Record<
		SymbolName,
		Record<'fill' | 'stroke', Record<SizeKey, readonly [number, number, number, number]>>
	>
> = {
	pin: {
		fill: {
			1: [12, 16, 6, 14.3838],
			2: [14, 19, 7, 17.0605],
			3: [18, 24, 9, 22.4141],
			4: [22, 29, 11, 27.7676]
		},
		stroke: {
			1: [12, 15, 5.5, 11.5],
			2: [14, 18, 7.0132, 14.4979],
			3: [18, 23, 9.0469, 19.8781],
			4: [22, 29, 11.0688, 25.6008]
		}
	},
	arrow: {
		fill: {
			1: [12, 15, 6, 13.5],
			2: [17, 19, 8.0547, 17.5729],
			3: [23, 27, 11.0498, 25.0569],
			4: [27, 33, 13.5, 31.3232]
		},
		stroke: {
			1: [12, 14, 6, 12],
			2: [16, 18, 7.5552, 15.8875],
			3: [22, 26, 10.5508, 23.375],
			4: [26, 32, 13.001, 29.5]
		}
	}
};

export interface GetSymbolOptions {
	/** Symbol name, e.g. 'circle'. */
	name: SymbolName;
	/** Filled or stroked. */
	variant?: 'fill' | 'stroke';
	/** Rendered width in CSS px. The closest size file is used as the starting point. */
	width?: number;
	/** Light draws the outline in white, dark draws it in black. */
	scheme?: 'light' | 'dark';
	/** Any CSS colour or hex code. */
	colour?: string;
	/**
	 * Set when the SVG will be rasterised (e.g. for `map.addImage`). The output is `width` ×
	 * `pixelRatio` pixels and the strokes are `pixelRatio` times thicker, so they stay the same
	 * CSS width. Pass the same value to `addImage`'s `pixelRatio`.
	 */
	pixelRatio?: number;
}

const closestSize = (width: number) =>
	(Object.keys(SIZES).map(Number) as SizeKey[]).reduce((best, size) =>
		Math.abs(SIZES[size] - width) < Math.abs(SIZES[best] - width) ? size : best
	);

/**
 * The file names are kept as exported from Figma ('Size=3, Style=Fill-1.svg') so a new export can
 * be dropped straight into public/symbols. Index 0 is the unnumbered "Fill" / "Stroke" file;
 * 1–19 are "Fill-1" … "Fill-19".
 */
const symbolFileName = (index: number, variant: 'fill' | 'stroke', size: SizeKey) => {
	const style = variant === 'fill' ? 'Fill' : 'Stroke';
	return `Size=${size}, Style=${style}${index ? `-${index}` : ''}.svg`;
};

/**
 * Where a symbol points, as fractions (0 to 1) of the square image `getSymbol` returns, from its
 * top left. A circle is `{ x: 0.5, y: 0.5 }`. The pin and arrow point down, so their tip is near
 * the bottom. Use it to put the tip, not the middle, on a map coordinate. It allows for the
 * symbol being centred in the square, and uses the same size file `getSymbol` would for `width`.
 */
export function getSymbolAnchor({
	name,
	variant = 'fill',
	width = 16
}: Pick<GetSymbolOptions, 'name' | 'variant' | 'width'>): { x: number; y: number } {
	const tip = TIPS[name]?.[variant][closestSize(width)];
	if (!tip) return { x: 0.5, y: 0.5 };

	const [boxWidth, boxHeight, tipX, tipY] = tip;
	// The artwork is scaled to fit the square and centred, so the shorter side has space either end.
	const scale = 1 / Math.max(boxWidth, boxHeight);
	return {
		x: (1 - boxWidth * scale) / 2 + tipX * scale,
		y: (1 - boxHeight * scale) / 2 + tipY * scale
	};
}

/**
 * Get a symbol as an SVG string. Async because each symbol's artwork is fetched from
 * SYMBOLS_BASE_URL the first time it is asked for.
 */
export async function getSymbol({
	name,
	variant = 'fill',
	width = 16,
	scheme = 'light',
	colour = SOURCE_COLOUR,
	pixelRatio
}: GetSymbolOptions): Promise<string> {
	const index = SYMBOL_NAMES.indexOf(name);
	if (index === -1) throw new Error(`Unknown symbol: ${name}`);

	const source = await loadSource(symbolFileName(index, variant, closestSize(width)));

	// Recolour first, as plain strings, then parse for the sizing.
	const recoloured = source
		.replaceAll(SOURCE_COLOUR, colour)
		.replaceAll(SOURCE_STROKE, `"${STROKE_BY_SCHEME[scheme]}"`);
	const svg = new DOMParser().parseFromString(recoloured, 'image/svg+xml').documentElement;

	// The shapes scale to any `width`, but strokes must keep their drawn weight in CSS px.
	// non-scaling-stroke measures a stroke in output pixels, so multiplying each stroke by
	// pixelRatio makes a 1px line 2 device pixels at 2x, whatever the symbol size.
	const scale = pixelRatio ?? 1;
	svg.setAttribute('width', String(Math.round(width * scale)));
	svg.setAttribute('height', String(Math.round(width * scale)));

	// vector-effect and stroke-width aren't inherited, so they're set on each shape element.
	svg.querySelectorAll(SHAPE_SELECTOR).forEach((shape) => {
		shape.setAttribute('vector-effect', 'non-scaling-stroke');
		if (!shape.hasAttribute('stroke')) return;
		// An SVG stroke with no stroke-width is 1 unit wide.
		const drawnWidth = Number(shape.getAttribute('stroke-width') ?? 1);
		shape.setAttribute('stroke-width', String(drawnWidth * scale));
	});

	return new XMLSerializer().serializeToString(svg);
}
