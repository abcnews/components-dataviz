<!--
  src/icons/Icon.svelte

  Thin wrapper around generateIcon(). The SVG is generated from the bundled
  icon files at build time, so {@html} only ever receives trusted markup.

  <Icon name="doughnut" width={32} variant="stroked" label="Doughnut chart" />

  Omit `label` for decorative icons: they are hidden from assistive tech.
-->
<script lang="ts">
	import { generateIcon, type IconStyle } from './icons.ts';

	interface Props {
		/** Icon slug, e.g. "doughnut". See listIcons(). */
		name: string;
		/** Final rendered width in px, including stroke. Height follows the artwork's aspect ratio. */
		width?: number;
		variant?: IconStyle;
		/** Accessible name. If omitted the icon is treated as decorative (aria-hidden). */
		label?: string;
		class?: string;
		/** Any CSS colour, applied to the SVG markup by generateIcon(). Replaces the accent colour only (the light halo is kept). Defaults to the artwork's own colour. */
		color?: string;
		/** Dark mode: draws the halo outline in black instead of the light default. */
		dark?: boolean;
	}

	let {
		name,
		width = 24,
		variant = 'stroked',
		label,
		class: className = '',
		color,
		dark = false
	}: Props = $props();

	// generateIcon throws on unknown names / missing variants / widths that are too small.
	// Don't take down the whole page for a bad icon: log and render nothing.
	const svg = $derived.by(() => {
		try {
			return generateIcon({ name, width, variant, color, dark });
		} catch (err) {
			console.error(`[Icon] ${err instanceof Error ? err.message : err}`);
			return '';
		}
	});
</script>

<span
	class="icon {className}"
	role={label ? 'img' : undefined}
	aria-label={label}
	aria-hidden={label ? undefined : 'true'}
	data-icon={name}
	data-variant={variant}
>
	{@html svg}
</span>

<style>
	.icon {
		display: inline-flex;
		flex: none;
		line-height: 0;
		vertical-align: middle;
	}
</style>
