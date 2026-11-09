<script lang="ts">
	import { colours as defaultColours } from '../Colours/colours.js';
	import { loadRecentColour, saveRecentColour } from './recentColour.js';

	interface Props {
		/** A name from `colours`, or a custom hex code. */
		colour?: string;
		/** Colours to pick from: name → hex, like one scheme of colours.json. Defaults to the standard light colours. */
		colours?: Record<string, string>;
		/** Accessible label for the group. */
		label?: string;
		/** Show the palette swatches. */
		showPalette?: boolean;
		/** Show the recent colour and the custom colour picker. */
		showCustom?: boolean;
		/** Spread the swatches evenly along the full width of the container, wrapping only if they don't fit. By default they sit together in a near-square block. */
		fullWidth?: boolean;
	}

	let {
		colour = $bindable('blue'),
		colours = defaultColours.light,
		label = 'Colour',
		showPalette = true,
		showCustom = true,
		fullWidth = false
	}: Props = $props();

	/** The last custom colour chosen, kept across visits so it can be picked again. */
	let recentColour = $state(loadRecentColour());

	const swatches = $derived(showPalette ? Object.entries(colours) : []);
	const currentHex = $derived(colours[colour] ?? colour);

	// Palette swatches, the recent colour (if any) and the rainbow picker, laid out as a near-square grid.
	const customCount = $derived(showCustom ? (recentColour ? 2 : 1) : 0);
	const columns = $derived(Math.max(1, Math.ceil(Math.sqrt(swatches.length + customCount))));

	const rememberCustomColour = (hex: string) => {
		recentColour = hex;
		saveRecentColour(hex);
	};
</script>

<div class="grid" class:full-width={fullWidth} role="group" aria-label={label} style:--columns={columns}>
	{#each swatches as [name, hex] (name)}
		<button
			type="button"
			class="swatch"
			style:background={hex}
			title={name}
			aria-label={name}
			aria-pressed={colour === name}
			onclick={() => (colour = name)}
		></button>
	{/each}

	{#if showCustom && recentColour}
		<button
			type="button"
			class="swatch"
			style:background={recentColour}
			title="Recent: {recentColour}"
			aria-label="Recent colour {recentColour}"
			aria-pressed={colour === recentColour}
			onclick={() => (colour = recentColour)}
		></button>
	{/if}

	{#if showCustom}
		<label class="swatch rainbow" title="Custom colour">
			<span class="visually-hidden">Custom colour</span>
			<!-- The native picker sits invisibly over the rainbow, so clicking the swatch opens it. -->
			<input
				type="color"
				value={currentHex}
				oninput={(event) => (colour = event.currentTarget.value)}
				onchange={(event) => rememberCustomColour(event.currentTarget.value)}
			/>
		</label>
	{/if}
</div>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(var(--columns), 1.5rem);
		gap: 0.25rem;
	}

	/* As many swatches per row as fit, spread edge to edge. */
	.grid.full-width {
		grid-template-columns: repeat(auto-fill, 1.5rem);
		justify-content: space-between;
		row-gap: 0.5rem;
	}

	.swatch {
		position: relative;
		box-sizing: border-box;
		width: 1.5rem;
		height: 1.5rem;
		padding: 0;
		border: 1px solid var(--border, rgba(122, 123, 135, 0.5));
		/* Extra radius on the shared button style turns the swatches into circles. */
		border-radius: 50%;
		cursor: pointer;
	}

	.rainbow {
		background:
			radial-gradient(circle closest-side, #fff, #0000 60%),
			conic-gradient(#f47171, #f3dc68, #74e774, #70ebeb, #7b8ff4, #ea86ea, #f47171);
	}

	.rainbow input {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		opacity: 0;
		cursor: pointer;
	}

	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
	}

	/* Depressed state with a Highlight ring, so it shows on light and dark backgrounds. */
	.swatch[aria-pressed='true'] {
		border-color: Highlight;
		box-shadow:
			inset 0 0 0 1px Highlight,
			inset 0 2px 4px rgba(0, 0, 0, 0.35);
	}
</style>
