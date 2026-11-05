const SOURCE_COLOUR = '#1E5AEB';
const SOURCE_STROKE = '"white"';

// Nominal pixel width of each size variant (Size=1 … Size=4).
const SIZES = { 1: 10, 2: 15, 3: 19, 4: 23 } as const;

type SizeKey = keyof typeof SIZES;

const STROKE_BY_SCHEME = { light: 'white', dark: 'black' } as const;

const SHAPE_SELECTOR = 'path, circle, ellipse, rect, line, polyline, polygon';

// Raw SVG strings keyed by path, e.g. "./svg/Size=1, Style=Fill-1.svg".
const symbols = import.meta.glob<string>('./svg/*.svg', {
	query: '?raw',
	import: 'default',
	eager: true
});

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

// Index 0 is "Fill" / "Stroke"; 1–19 are "Fill-1" … "Fill-19".
const filePath = (index: number, variant: 'fill' | 'stroke', size: SizeKey) => {
	const style = variant === 'stroke' ? 'Stroke' : 'Fill';
	const suffix = index === 0 ? '' : `-${index}`;
	return `./svg/Size=${size}, Style=${style}${suffix}.svg`;
};

/**
 * Get a symbol as an SVG string.
 */
export function getSymbol({
	name,
	variant = 'fill',
	width = 16,
	scheme = 'light',
	colour = SOURCE_COLOUR,
	pixelRatio
}: GetSymbolOptions): string {
	const index = SYMBOL_NAMES.indexOf(name);
	if (index === -1) throw new Error(`Unknown symbol: ${name}`);

	const path = filePath(index, variant, closestSize(width));
	const source = symbols[path];
	if (!source) throw new Error(`Symbol not found: ${path}`);

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
