<script lang="ts">
	import ColourPicker from '../ColourPicker/ColourPicker.svelte';
	import Colours from '../Colours/Colours.svelte';
	import { colours as defaultColours, resolveColour, type Palette, type Scheme } from '../Colours/colours.js';
	import Symbol from '../SVGSymbols/Symbol.svelte';
	import { SYMBOL_NAMES, type SymbolName } from '../SVGSymbols/getSymbol.js';

	interface Props {
		/** Selected symbol. */
		name?: SymbolName;
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
	}

	let {
		name = $bindable('square'),
		variant = $bindable('fill'),
		colour = $bindable('blue'),
		scheme = $bindable('light'),
		legend = 'Symbol',
		showSchemeToggle = false,
		colours = defaultColours
	}: Props = $props();

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

				<div class={['grid', { dark: scheme === 'dark' }]} role="group" aria-label="Symbols">
					{#each visibleNames as symbol (symbol)}
						<button
							type="button"
							title={symbol}
							aria-label={symbol}
							aria-pressed={name === symbol}
							onclick={() => (name = symbol)}
						>
							<Symbol name={symbol} {variant} colour={resolvedColour} {scheme} width={19} />
						</button>
					{:else}
						<p>No symbols match “{query}”.</p>
					{/each}
				</div>
			</div>

			<div class="options">
				<div class="row joined" role="group" aria-label="Style">
					{#each VARIANTS as option (option.value)}
						<button
							type="button"
							title={option.label}
							aria-label={option.label}
							aria-pressed={variant === option.value}
							onclick={() => (variant = option.value)}
						>
							<Symbol {name} variant={option.value} colour={resolvedColour} {scheme} width={16} />
						</button>
					{/each}
				</div>

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

				<ColourPicker bind:colour colours={colours[scheme]} />
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

	.layout {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.symbols {
		display: flex;
		flex: 1 1 16rem;
		flex-direction: column;
		gap: 0.5rem;
		min-width: 0;
	}

	.options {
		display: flex;
		flex: 0 1 11rem;
		flex-direction: column;
		gap: 0.5rem;
	}

	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.25rem;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, 2rem);
		gap: 0.25rem;
		max-height: 12rem;
		overflow-y: auto;
		/* The padding is cancelled by the negative margin, so the symbols stay put whether or not the panel background shows. */
		padding: 0.25rem;
		margin: -0.25rem;
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
		width: 2rem;
		height: 2rem;
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
