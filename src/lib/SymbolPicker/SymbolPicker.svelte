<script lang="ts">
	import { MediaQuery } from 'svelte/reactivity';
	import Colours from '../Colours/Colours.svelte';
	import {
		COLOUR_NAMES,
		colourVariableName,
		isColourName,
		resolveColour,
		type Scheme
	} from '../Colours/colours.js';
	import Symbol from '../SVGSymbols/Symbol.svelte';
	import { SYMBOL_NAMES, type SymbolName } from '../SVGSymbols/getSymbol.js';

	interface Props {
		/** Selected symbol. */
		name?: SymbolName;
		/** Filled or stroked. */
		variant?: 'fill' | 'stroke';
		/** A palette name (e.g. 'blue') or a custom hex code. Use resolveColour() to get the hex for a scheme. */
		colour?: string;
		/** Light, dark, or auto (follows the nearest data-theme, then the device setting). Selects the palette and the symbol outline colour; changed by the picker's toggle. */
		scheme?: Scheme | 'auto';
		/** Text for the fieldset legend. */
		legend?: string;
		/** Show the light/dark/auto toggle. Off by default, so the picker stays in `scheme`. */
		showSchemeToggle?: boolean;
	}

	let {
		name = $bindable('square'),
		variant = $bindable('fill'),
		colour = $bindable('blue'),
		scheme = $bindable('auto'),
		legend = 'Symbol',
		showSchemeToggle = false
	}: Props = $props();

	const SCHEMES = [
		{ value: 'light', label: 'Light' },
		{ value: 'dark', label: 'Dark' },
		{ value: 'auto', label: 'Auto' }
	] as const;

	let rootElement = $state<HTMLDivElement>();
	/** data-theme of the nearest ancestor that has one, kept up to date if it changes. */
	let inheritedTheme = $state<Scheme>();

	$effect(() => {
		const source = rootElement?.parentElement?.closest('[data-theme]');
		if (!source) {
			inheritedTheme = undefined;
			return;
		}
		const readTheme = () =>
			(inheritedTheme = source.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
		readTheme();
		const observer = new MutationObserver(readTheme);
		observer.observe(source, { attributes: true, attributeFilter: ['data-theme'] });
		return () => observer.disconnect();
	});

	const prefersDark = new MediaQuery('(prefers-color-scheme: dark)');
	/** The palette and data-theme only know light and dark. 'auto' uses the inherited data-theme, or the device setting if there isn't one. */
	const activeScheme = $derived<Scheme>(
		scheme !== 'auto' ? scheme : (inheritedTheme ?? (prefersDark.current ? 'dark' : 'light'))
	);

	const VARIANTS = [
		{ value: 'fill', label: 'Filled' },
		{ value: 'stroke', label: 'Stroked' }
	] as const;

	let query = $state('');

	const visibleNames = $derived(
		SYMBOL_NAMES.filter((symbol) => symbol.includes(query.trim().toLowerCase()))
	);
	const resolvedColour = $derived(resolveColour({ colour, scheme: activeScheme }));
	const isCustomColour = $derived(!isColourName(colour));
</script>

<Colours scheme={activeScheme} bind:element={rootElement}>
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

				<div class={['grid', { panel: scheme !== 'auto' }]} role="group" aria-label="Symbols">
					{#each visibleNames as symbol (symbol)}
						<button
							type="button"
							title={symbol}
							aria-label={symbol}
							aria-pressed={name === symbol}
							onclick={() => (name = symbol)}
						>
							<Symbol name={symbol} {variant} colour={resolvedColour} scheme={activeScheme} width={19} />
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
							<Symbol {name} variant={option.value} colour={resolvedColour} scheme={activeScheme} width={16} />
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

				<div class="row" role="group" aria-label="Colour">
					{#each COLOUR_NAMES as option (option)}
						<button
							type="button"
							class="swatch"
							style:background="var({colourVariableName(option)})"
							title={option}
							aria-label={option}
							aria-pressed={colour === option}
							onclick={() => (colour = option)}
						></button>
					{/each}
					<label class={{ custom: true, active: isCustomColour }}>
						Custom
						<input
							type="color"
							value={resolvedColour}
							oninput={(event) => (colour = event.currentTarget.value)}
						/>
					</label>
				</div>
			</div>
		</div>
	</fieldset>
</Colours>

<style>
	/* Layout, using BuilderStyleRoot's fieldset spacing. The only visual style is the depressed toggle at the bottom. */
	/* BuilderStyleRoot's colour tokens, switched by the data-theme on the picker's root. */
	fieldset {
		--text: #222;
		--background: #fff;
		--background-alt: #f2f4f5;
		--border: rgba(122, 123, 135, 0.5);
		--radius: 0.3rem;
	}

	:global([data-theme='dark']) fieldset {
		--text: #ccc;
		--background: #121212;
		--background-alt: #2c2c2f;
	}

	fieldset {
		min-width: 0;
		padding: 0.75rem;
		border: 1px solid var(--border, rgba(122, 123, 135, 0.5));
		border-radius: 0.2rem;
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
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--background);
		color: var(--text);
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

	/* Explicit light or dark gets a panel behind the symbols. Auto has none, so it inherits the page. */
	.grid.panel {
		border-radius: var(--radius);
		background: var(--background-alt);
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
		border-radius: var(--radius) 0 0 var(--radius);
	}

	.joined button:last-child {
		border-radius: 0 var(--radius) var(--radius) 0;
	}

	.joined button + button {
		margin-left: -1px;
	}

	.joined button[aria-pressed='true'] {
		position: relative;
		z-index: 1;
	}

	.swatch {
		width: 1.5rem;
		height: 1.5rem;
		padding: 0;
	}

	.custom {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.125rem 0.25rem;
	}

	/* Depressed toggle, from BuilderStyleRoot's border, radius and alt-background tokens. */
	button[aria-pressed='true'],
	.custom.active {
		border: 1px solid Highlight;
		border-radius: var(--radius);
		background: var(--background-alt);
		/* The inset ring in the system highlight colour keeps the pressed state visible on dark backgrounds. */
		box-shadow:
			inset 0 0 0 1px Highlight,
			inset 0 2px 4px rgba(0, 0, 0, 0.35);
	}
	.swatch[aria-pressed='true'] {
		background-image: linear-gradient(rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0.15));
	}
</style>
