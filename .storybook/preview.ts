import { TypographyProvider } from '@abcnews/components-storylab';
import type { Decorator, Preview } from '@storybook/sveltekit';

/** Page backgrounds behind each scheme, so stories read like they would on a real page. */
const SCHEME_BACKGROUNDS = { light: '#ffffff', dark: '#161c1e' };

/**
 * Storybook is the "consumer" here: it sets data-scheme on the preview's <html>, and the
 * components pick it up from their nearest [data-scheme] ancestor.
 */
const withScheme: Decorator = (storyFn, { globals }) => {
	const scheme = globals.scheme === 'dark' ? 'dark' : 'light';
	document.documentElement.dataset.scheme = scheme;
	// Components in "auto" mode follow the nearest data-theme.
	document.documentElement.dataset.theme = scheme;
	document.documentElement.style.colorScheme = scheme;
	document.body.style.background = SCHEME_BACKGROUNDS[scheme];
	document.body.style.color = scheme === 'dark' ? '#e8eef0' : '#000000';
	return storyFn();
};

const preview: Preview = {
	decorators: [withScheme, () => ({ Component: TypographyProvider })],
	globalTypes: {
		scheme: {
			description: 'Colour scheme (sets data-scheme on the preview)',
			toolbar: {
				title: 'Colour scheme',
				icon: 'circlehollow',
				items: [
					{ value: 'light', title: 'Light', icon: 'sun' },
					{ value: 'dark', title: 'Dark', icon: 'moon' }
				],
				dynamicTitle: true
			}
		}
	},
	initialGlobals: { scheme: 'light' },
	parameters: {
		// The scheme switcher owns the background; the backgrounds addon would fight it.
		backgrounds: { disabled: true },
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i
			}
		}
	}
};

export default preview;
