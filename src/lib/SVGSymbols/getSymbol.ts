const SOURCE_COLOUR = '#1E5AEB';
const SOURCE_STROKE = '"white"';

// Nominal pixel width of each size variant (Size=1 … Size=4).
const SIZES = { 1: 10, 2: 15, 3: 19, 4: 23 };

const STROKE_BY_SCHEME = { light: 'white', dark: 'black' };

// vector-effect isn't inherited, so it must be set on each shape element.
// The lookahead skips tags that already declare it.
const SHAPE_TAGS = /<(path|circle|ellipse|rect|line|polyline|polygon)\b(?![^>]*\bvector-effect=)/g;

// Raw SVG strings keyed by path, e.g. "./svg/Size=1, Style=Fill-1.svg".
const symbols = import.meta.glob('./svg/*.svg', {
	query: '?raw',
	import: 'default',
	eager: true
});

// Position in this list is the file number (0–19).
export const SYMBOL_NAMES = /** @type {const} */ [
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
];

/** @typedef {(typeof SYMBOL_NAMES)[number]} SymbolName */

const closestSize = (width) =>
	Object.keys(SIZES).reduce((best, size) =>
		Math.abs(SIZES[size] - width) < Math.abs(SIZES[best] - width) ? size : best
	);

// Index 0 is "Fill" / "Stroke"; 1–19 are "Fill-1" … "Fill-19".
const filePath = (index, variant, size) => {
	const style = variant === 'stroke' ? 'Stroke' : 'Fill';
	const suffix = index === 0 ? '' : `-${index}`;
	return `./svg/Size=${size}, Style=${style}${suffix}.svg`;
};

/**
 * Get a symbol as an SVG string.
 * @param {object} options
 * @param {SymbolName} options.name   Symbol name, e.g. 'SymbolCircle'
 * @param {'fill'|'stroke'} [options.variant='fill']
 * @param {number} [options.width=16]    Desired width in px; closest size file is used
 * @param {'light'|'dark'} [options.scheme='light']  light → white strokes, dark → black
 * @param {string} [options.colour]      Any CSS colour or hex code
 * @returns {string}
 */
export function getSymbol({
	name,
	variant = 'fill',
	width = 16,
	scheme = 'light',
	colour = SOURCE_COLOUR
}) {
	const index = SYMBOL_NAMES.indexOf(name);
	if (index === -1) throw new Error(`Unknown symbol: ${name}`);

	const path = filePath(index, variant, closestSize(width));
	const svg = symbols[path];
	if (!svg) throw new Error(`Symbol not found: ${path}`);

	return svg
		.replaceAll(SOURCE_COLOUR, colour)
		.replaceAll(SOURCE_STROKE, `"${STROKE_BY_SCHEME[scheme]}"`)
		.replace(/width="\d+" height="\d+"/, `width="${width}" height="${width}"`)
		.replace(SHAPE_TAGS, '<$1 vector-effect="non-scaling-stroke"');
}
