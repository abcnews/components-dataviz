import colours from './colours.json';

export { colours };

export type Scheme = keyof typeof colours;
export type ColourName = keyof typeof colours.light;

export const COLOUR_NAMES = Object.keys(colours.light) as ColourName[];

export const isColourName = (colour: string): colour is ColourName => COLOUR_NAMES.includes(colour as ColourName);

/** 'blueSecondary' → '--colour-blue-secondary' */
export const colourVariableName = (name: ColourName) =>
	`--colour-${name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`;

/** Inline `style` declarations that define every palette colour as a CSS variable for one scheme. */
export const colourVariables = (scheme: Scheme) =>
	COLOUR_NAMES.map((name) => `${colourVariableName(name)}: ${colours[scheme][name]};`).join(' ');

/**
 * Turn a palette name into its hex code for the given scheme. Anything else (a custom
 * colour) is returned as is. Palette names are stored rather than hex codes so a chosen
 * colour follows the light/dark swap.
 */
export const resolveColour = ({ colour, scheme = 'light' }: { colour: string; scheme?: Scheme }) =>
	isColourName(colour) ? colours[scheme][colour] : colour;
