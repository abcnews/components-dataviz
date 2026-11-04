const SOURCE_COLOUR = '#1E5AEB';
const SOURCE_STROKE = '"white"';

// Nominal pixel width of each size variant (Size=1 … Size=4).
const SIZES = { 1: 10, 2: 15, 3: 19, 4: 23 };

const STROKE_BY_SCHEME = { light: 'white', dark: 'black' };

// Raw SVG strings keyed by path, e.g. "./svg/Size=1, Style=Fill-1.svg".
const symbols = import.meta.glob('./svg/*.svg', {
	query: '?raw',
	import: 'default',
	eager: true
});

const closestSize = (width) =>
	Object.keys(SIZES).reduce((best, size) =>
		Math.abs(SIZES[size] - width) < Math.abs(SIZES[best] - width) ? size : best
	);

// Name 0 is "Fill" / "Stroke"; names 1–19 are "Fill-1" … "Fill-19".
const filePath = (name, variant, size) => {
	const style = variant === 'stroke' ? 'Stroke' : 'Fill';
	const suffix = Number(name) === 0 ? '' : `-${name}`;
	return `./svg/Size=${size}, Style=${style}${suffix}.svg`;
};

/**
 * Get a symbol as an SVG string.
 * @param {object} options
 * @param {string|number} options.name   Symbol name, 0–19
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
	const path = filePath(name, variant, closestSize(width));
	const svg = symbols[path];
	if (!svg) throw new Error(`Symbol not found: ${path}`);

	return svg
		.replaceAll(SOURCE_COLOUR, colour)
		.replaceAll(SOURCE_STROKE, `"${STROKE_BY_SCHEME[scheme]}"`)
		.replace(/width="\d+" height="\d+"/, `width="${width}" height="${width}"`);
}
