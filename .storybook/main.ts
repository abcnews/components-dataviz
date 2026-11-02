import type { StorybookConfig } from '@storybook/sveltekit';
import { getServer } from '@abcnews/aunty/vite';

const config: StorybookConfig = {
	stories: ['../src/**/*.stories.@(js|ts|svelte)'],
	addons: ['@storybook/addon-svelte-csf'],
	framework: '@storybook/sveltekit',
	core: {
		disableTelemetry: true,
		disableWhatsNewNotifications: true,
		// @ts-expect-error storybook 10 core option
		allowedHosts: true
	},
	features: {
		sidebarOnboardingChecklist: false
	},
	async viteFinal(config) {
		// Reuse Aunty's host/HTTPS/CORS settings, but keep Storybook's own port.
		const { port: _auntyPort, ...auntyServer } = getServer();
		config.server = {
			...config.server,
			...auntyServer,
			allowedHosts: true
		};
		config.publicDir = 'public';
		return config;
	}
};
export default config;
