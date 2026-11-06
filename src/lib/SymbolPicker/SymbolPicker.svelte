<script module lang="ts">
	/** The picker's controls, each of which can be hidden with `show={{ size: false }}`. */
	export interface SymbolPickerShow {
		/** Filled / stroked buttons. */
		variant?: boolean;
		/** The size slider. */
		size?: boolean;
		/** The number box for a custom size. */
		customSize?: boolean;
		/** The palette swatches. */
		colour?: boolean;
		/** The recent colour and the custom colour picker. */
		customColour?: boolean;
	}
</script>

<script lang="ts">
	import ColourPicker from '../ColourPicker/ColourPicker.svelte';
	import Colours from '../Colours/Colours.svelte';
	import { colours as defaultColours, resolveColour, type Palette, type Scheme } from '../Colours/colours.js';
	import Symbol from '../SVGSymbols/Symbol.svelte';
	import { SYMBOL_NAMES, type SymbolName } from '../SVGSymbols/getSymbol.js';

	interface Props {
		/** Selected symbol, or null for none (e.g. when a custom image is used instead). */
		name?: SymbolName | null;
		/** Filled or stroked. */
		variant?: 'fill' | 'stroke';
		/** A palette name (e.g. 'blue') or a custom hex code. Use resolveColour() to get the hex for a scheme. */
		colour?: string;
		/** Light or dark: the palette, symbol outline and the panel behind the symbols (which previews the base map the symbol is for). Not the picker's own chrome, which inherits the app's theme. Starts as the value passed in and is changed by the toggle. */
		scheme?: Scheme;
		/** Text for the fieldset legend. */
		legend?: string;
		/** Show the light/dark toggle. Off by default, so the picker stays in `scheme`. */
		showSchemeToggle?: boolean;
		/** Palette in the colours.json format. Defaults to the standard colours. */
		colours?: Palette;
		/** Symbol size in px (1 to 99): one of `sizes` from the slider, or any value typed into the box. */
		size?: number;
		/** The sizes the slider stops at. */
		sizes?: number[];
		/** Which controls to show. Each one defaults to true, so only list what to hide. */
		show?: SymbolPickerShow;
	}

	let {
		name = $bindable('square'),
		variant = $bindable('fill'),
		colour = $bindable('blue'),
		scheme = $bindable('light'),
		legend = 'Symbol',
		showSchemeToggle = false,
		colours = defaultColours,
		size = $bindable(18),
		sizes = [10, 14, 18, 22],
		show = {}
	}: Props = $props();

	const shown = $derived({
		variant: true,
		size: true,
		customSize: true,
		colour: true,
		customColour: true,
		...show
	});

	/** Ties the slider's tick marks to this instance, so two pickers on a page don't share a list. */
	const instanceId = $props.id();
	const sizeListId = `symbol-sizes-${instanceId}`;

	/**
	 * The slider moves between the preset sizes only (stop i is `sizes[i]`). A custom size typed into
	 * the box isn't on a stop, so the thumb rests on the nearest preset.
	 */
	const stop = $derived(
		sizes.reduce(
			(nearest, preset, index) => (Math.abs(preset - size) < Math.abs(sizes[nearest] - size) ? index : nearest),
			0
		)
	);

	function handleStopInput(event: Event & { currentTarget: HTMLInputElement }) {
		size = sizes[Number(event.currentTarget.value)];
	}

	/** Keeps the size to two digits and applies it once it is a real size (1 to 99). */
	function handleSizeInput(event: Event & { currentTarget: HTMLInputElement }) {
		const digits = event.currentTarget.value.replace(/\D/g, '').slice(0, 2);
		event.currentTarget.value = digits;
		const typed = Number(digits);
		if (typed >= 1) size = typed;
	}

	const SCHEMES = [
		{ value: 'light', label: 'Light' },
		{ value: 'dark', label: 'Dark' }
	] as const;

	const VARIANTS = [
		{ value: 'fill', label: 'Filled' },
		{ value: 'stroke', label: 'Stroked' }
	] as const;

	let query = $state('');

	const visibleNames = $derived(
		SYMBOL_NAMES.filter((symbol) => symbol.includes(query.trim().toLowerCase()))
	);
	const resolvedColour = $derived(resolveColour({ colour, scheme, palette: colours }));
</script>

<Colours {scheme}>
	<fieldset>
		<legend>{legend}</legend>

		<div class="layout">
			<div class="symbols">
				<input
					type="search"
					placeholder="Search symbols"
					aria-label="Search symbols"
					bind:value={query}
				/>

				<div
					class={['grid', { dark: scheme === 'dark' }]}
					style:--symbol-size="{size}px"
					role="group"
					aria-label="Symbols"
				>
					{#each visibleNames as symbol (symbol)}
						<button
							type="button"
							title={symbol}
							aria-label={symbol}
							aria-pressed={name === symbol}
							onclick={() => (name = symbol)}
						>
							<Symbol name={symbol} {variant} colour={resolvedColour} {scheme} width={size} />
						</button>
					{:else}
						<p>No symbols match “{query}”.</p>
					{/each}
				</div>
			</div>

			<div class="options">
				{#if shown.variant}
					<div class="row joined" role="group" aria-label="Style">
						{#each VARIANTS as option (option.value)}
							<button
								type="button"
								title={option.label}
								aria-label={option.label}
								aria-pressed={variant === option.value}
								onclick={() => (variant = option.value)}
							>
								<!-- With no symbol selected the style buttons preview a circle. -->
								<Symbol name={name ?? 'circle'} variant={option.value} colour={resolvedColour} {scheme} width={16} />
							</button>
						{/each}
					</div>
				{/if}

				{#if shown.size || shown.customSize}
					<div class="size" role="group" aria-label="Size">
						{#if shown.size}
							<input
								type="range"
								class="size-slider"
								min="0"
								max={sizes.length - 1}
								step="1"
								list={sizeListId}
								aria-label="Size"
								aria-valuetext="{size}px"
								title="{size}px"
								value={stop}
								oninput={handleStopInput}
							/>
							<datalist id={sizeListId}>
								{#each sizes as option, index (option)}
									<option value={index} label="{option}"></option>
								{/each}
							</datalist>
						{/if}
						{#if shown.customSize}
							<input
								type="text"
								class="size-input"
								inputmode="numeric"
								maxlength="2"
								title="Size in px (1 to 99)"
								aria-label="Size in px"
								value={size}
								oninput={handleSizeInput}
							/>
						{:else if shown.size}
							<!-- With no box to show it, the slider's size is read out here. -->
							<output class="size-readout">{size}</output>
						{/if}
					</div>
				{/if}

				{#if showSchemeToggle}
					<div class="row joined" role="group" aria-label="Colour scheme">
						{#each SCHEMES as option (option.value)}
							<button
								type="button"
								aria-pressed={scheme === option.value}
								onclick={() => (scheme = option.value)}
							>
								{option.label}
							</button>
						{/each}
					</div>
				{/if}

				{#if shown.colour || shown.customColour}
					<ColourPicker
						bind:colour
						colours={colours[scheme]}
						showPalette={shown.colour}
						showCustom={shown.customColour}
					/>
				{/if}
			</div>
		</div>
	</fieldset>
</Colours>

<style>
	/*
	 * The chrome (text, buttons, borders) inherits the host app's tokens (--text, --background,
	 * --background-alt, --border, --radius, as BuilderStyleRoot defines them), so it follows the app's
	 * own light or dark theme. The fallbacks are system colours, which follow the page's colour-scheme
	 * when there is no host app. The only colours the picker owns are the symbols' and the panel behind them.
	 */
	fieldset {
		min-width: 0;
		padding: 0.75rem;
		border: 1px solid var(--border, rgba(122, 123, 135, 0.5));
		border-radius: 0.2rem;
	}

	input[type='search'] {
		border: 1px solid var(--border, rgba(122, 123, 135, 0.5));
		border-radius: var(--radius, 0.3rem);
		background: var(--background, Canvas);
		color: var(--text, CanvasText);
		padding: 0.25rem 0.5rem;
	}

	/*
	 * Intrinsic layout, with no media or container queries: the symbols and the options sit side by
	 * side whenever the symbols' minimum (10rem) and the options' own width fit, and wrap (stack) otherwise,
	 * whatever the picker is placed in. The symbols take all the spare room; the options are as wide as their controls. The symbols can shrink to zero (min-width: 0)
	 * and the grids wrap, so nothing forces a horizontal overflow on a small screen.
	 */
	.layout {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem 1rem;
	}

	.symbols {
		display: flex;
		flex: 1 1 10rem;
		flex-direction: column;
		gap: 0.5rem;
		min-width: 0;
	}

	.options {
		display: flex;
		/* Exactly as wide as its controls (no guessed width), and never squashed: when it doesn't fit it wraps under the symbols instead. */
		flex: 0 0 auto;
		flex-direction: column;
		gap: 0.5rem;
		max-width: 100%;
	}

	@media (max-width: 30rem) {
		fieldset {
			padding: 0.5rem;
		}
	}

	/* The slider takes the room the number box leaves, and the box stays a fixed width. */
	/* One compact row: a short slider (stops only) and a number box for any size. */
	.size {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		min-width: 0;
		/*
		 * The options column is as wide as its widest row. Native inputs (the range, the text box) report a
		 * wide default width, which would stretch the column, so this row opts out of sizing it: the column
		 * is sized by the other rows and this one fills it.
		 */
		contain: inline-size;
	}

	.size-slider {
		flex: 0 1 5.7rem;
		width: 5.7rem;
		min-width: 0;
		margin: 0;
	}

	.size-readout {
		flex: 0 0 auto;
		min-width: 2rem;
		font-size: 0.8rem;
		text-align: center;
	}

	.size-input {
		flex: 0 0 auto;
		box-sizing: border-box;
		width: 2rem;
		height: 1.5rem;
		padding: 0;
		border: 1px solid var(--border, rgba(122, 123, 135, 0.5));
		border-radius: var(--radius, 0.3rem);
		background: var(--background, Canvas);
		color: var(--text, CanvasText);
		font-size: 0.8rem;
		text-align: center;
	}

	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.25rem;
	}

	.grid {
		display: grid;
		/* Each cell is 2rem, or the symbol's size plus a margin when the chosen size is larger. */
		--cell: max(2rem, calc(var(--symbol-size, 19px) + 0.5rem));
		grid-template-columns: repeat(auto-fill, var(--cell));
		gap: 0.25rem;
		max-height: 12rem;
		overflow-y: auto;
		padding: 0.25rem;
	}

	.grid p {
		grid-column: 1 / -1;
		margin: 0;
	}

	button {
		display: inline-flex;
		justify-content: center;
		align-items: center;
		padding: 0.25rem 0.5rem;
		border: 1px solid var(--border, rgba(122, 123, 135, 0.5));
		border-radius: var(--radius, 0.3rem);
		background: var(--background, Canvas);
		color: var(--text, CanvasText);
		line-height: 0;
	}

	.grid button {
		width: var(--cell);
		height: var(--cell);
		padding: 0;
	}

	/* Only the selected symbol looks like a button. The transparent border keeps the sizes the same. */
	.grid button:not([aria-pressed='true']) {
		border-color: transparent;
		background: transparent;
	}

	/*
	 * The panel behind the symbols is the picker's own, not the app's: a symbol's scheme says which
	 * base map it is drawn for, so the panel previews that map. Light symbols get a light panel and
	 * dark symbols a dark one, whatever the app's theme is.
	 */
	.grid {
		--panel: #f2f4f5;
		--panel-selected: #fff;
		border-radius: var(--radius, 0.3rem);
		background: var(--panel);
	}

	.grid.dark {
		--panel: #2c2c2f;
		--panel-selected: #3d3d42;
	}

	.grid button[aria-pressed='true'] {
		background: var(--panel-selected);
	}

	/* Toggle pairs read as one piece: no gap, no radius where they meet, same height as the grid buttons. */
	.joined {
		gap: 0;
	}

	.joined button {
		width: 3.5rem;
		height: 1.8125rem;
		padding: 0;
		border-radius: 0;
		line-height: 1;
	}

	.joined button:first-child {
		border-radius: var(--radius, 0.3rem) 0 0 var(--radius, 0.3rem);
	}

	.joined button:last-child {
		border-radius: 0 var(--radius, 0.3rem) var(--radius, 0.3rem) 0;
	}

	.joined button + button {
		margin-left: -1px;
	}

	.joined button[aria-pressed='true'] {
		position: relative;
		z-index: 1;
	}

	/* Depressed toggle, from BuilderStyleRoot's border, radius and alt-background tokens. */
	button[aria-pressed='true'] {
		border: 1px solid Highlight;
		border-radius: var(--radius, 0.3rem);
		background: var(--background-alt, color-mix(in srgb, CanvasText 10%, Canvas));
		/* The inset ring in the system highlight colour keeps the pressed state visible on dark backgrounds. */
		box-shadow:
			inset 0 0 0 1px Highlight,
			inset 0 2px 4px rgba(0, 0, 0, 0.35);
	}
</style>
