import { TypographyProvider } from '@abcnews/components-storylab';
import type { Preview } from '@storybook/sveltekit';

const preview: Preview = {
	decorators: [() => ({ Component: TypographyProvider })],
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i
			}
		}
	}
};

export default preview;
