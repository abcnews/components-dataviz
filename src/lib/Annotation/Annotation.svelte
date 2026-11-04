<!-- Annotation (Svelte 5): small label whose one square corner works as an arrow. Variants: filled (default), outline.
     Place it at the target point; `anchor` sets which label point sits there (see Anchored, which does the work).
     <Annotation text="Peak" anchor="bottom-right" offset={8} />  or pin it:  <Annotation text="Peak" x={120} y={80} />
     Style with --annotation-* vars (defaults in the CSS); the outline variant flips to dark under a [data-scheme="dark"] ancestor (set by the consumer). -->
<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import Anchored, { type Anchor } from '../Anchored/Anchored.svelte';
	import GooeyText from '../GooeyText/GooeyText.svelte';

	type Pointer = 'top-left' | 'top-right' | 'bottom-right' | 'bottom-left' | 'none';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		/** Label text; ignored when `children` is passed. */
		text?: string;
		/** 'filled' (default): padded label with background. 'outline': bare text with a 1px glyph
		 *  border, black on white (inverted under [data-scheme="dark"]). */
		variant?: 'filled' | 'outline';
		/** Label point that sits at the placement spot (default 'top-left', no shift). */
		anchor?: Anchor;
		/** Px to push the label away from the anchor so it clears the symbol; ignored for 'center'. */
		offset?: number;
		/** Pin the anchor point at this distance from the left of the nearest positioned ancestor
		 *  (number = px, or any CSS length). Leave `x` and `y` unset to use the parent's origin. */
		x?: number | string;
		/** Pin the anchor point at this distance from the top of the nearest positioned ancestor. */
		y?: number | string;
		/** Squared-off arrow corner, filled only (default 'bottom-left'). With `gooey`, right ones are line ends. */
		pointer?: Pointer;
		/** Background colour (overrides --annotation-fill); filled only. */
		fill?: string;
		/** 1px outline colour (overrides --annotation-stroke / --annotation-outline-stroke). Width is fixed. */
		stroke?: string;
		/** Max width (number = px; includes padding when filled). Enables left-aligned wrapping; unset = one line. */
		maxWidth?: number | string;
		/** Draw the background with GooeyText, filled only; ignores --annotation-pointer-radius and `stroke`.
		 *  Best with `maxWidth` (a single line is just a rounded rectangle). */
		gooey?: boolean;
		/** Text colour (overrides --annotation-text / --annotation-outline-text). */
		color?: string;
		/** Font-weight 700 (overrides --annotation-font-weight). */
		bold?: boolean;
		class?: string;
		style?: string;
	}

	let {
		text = '',
		children,
		variant = 'filled',
		anchor = 'top-left',
		offset = 0,
		x,
		y,
		pointer = 'bottom-left',
		fill,
		stroke,
		maxWidth,
		gooey = false,
		color,
		bold = false,
		class: className = '',
		style = '',
		...rest
	}: Props = $props();

	let isOutline = $derived(variant === 'outline');
	let isGooey = $derived(gooey && !isOutline);
	let isMultiline = $derived(maxWidth !== undefined && maxWidth !== null && maxWidth !== '');

	function buildBorderRadius(pointerCorner: Pointer) {
		// Order required by border-radius.
		const cornersInOrder: Pointer[] = ['top-left', 'top-right', 'bottom-right', 'bottom-left'];

		return cornersInOrder
			.map((corner) =>
				corner === pointerCorner
					? 'var(--annotation-pointer-radius, 0px)'
					: 'var(--annotation-radius, 8px)'
			)
			.join(' ');
	}

	function buildCustomProperties(options: {
		isOutline: boolean;
		fill?: string;
		stroke?: string;
		color?: string;
		bold: boolean;
	}) {
		const colourProperties: [string, string | undefined][] = options.isOutline
			? [
					['--annotation-outline-stroke', options.stroke],
					['--annotation-outline-text', options.color]
				]
			: [
					['--annotation-fill', options.fill],
					['--annotation-stroke', options.stroke],
					['--annotation-text', options.color]
				];
		const properties: [string, string | undefined][] = [
			...colourProperties,
			['--annotation-font-weight', options.bold ? '700' : undefined]
		];

		return properties
			.filter(([, value]) => value !== undefined)
			.map(([propertyName, value]) => `${propertyName}:${value}`);
	}

	let inlineStyle = $derived(
		[
			isOutline || isGooey ? undefined : `border-radius:${buildBorderRadius(pointer)}`,
			isMultiline
				? `max-width:${typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth}`
				: undefined,
			...buildCustomProperties({ isOutline, fill, stroke, color, bold }),
			style
		]
			.filter(Boolean)
			.join(';')
	);
</script>

{#snippet label()}
	{#if children}
		{@render children()}
	{:else}
		{text}
	{/if}
{/snippet}

<Anchored {anchor} {offset} {x} {y}>
	<div
		class="annotation {className}"
		class:outline={isOutline}
		class:multiline={isMultiline}
		class:gooey={isGooey}
		style={inlineStyle}
		{...rest}
	>
		{#if isGooey}
			<GooeyText
				{pointer}
				maxWidth={isMultiline ? '100%' : undefined}
				style="--gooey-fill:var(--annotation-fill, #fff);--gooey-radius:var(--annotation-radius, 8px);--gooey-padding:var(--annotation-padding, 6px 8px)"
			>
				{@render label()}
			</GooeyText>
		{:else}
			{@render label()}
		{/if}
	</div>
</Anchored>

<style>
	.annotation {
		display: inline-flex;
		padding: var(--annotation-padding, 6px 8px);
		justify-content: center;
		align-items: center;
		gap: 10px;
		grid-row: span 1;
		grid-column: span 1;
		box-sizing: border-box;
		width: max-content;
		white-space: nowrap;

		background: var(--annotation-fill, #fff);
		box-shadow: inset 0 0 0 1px var(--annotation-stroke, transparent);

		color: var(--annotation-text, #000);
		font-feature-settings: 'ss01' on;
		font-family: var(--annotation-font-family, 'ABC Sans Nova', sans-serif);
		font-size: var(--annotation-font-size, 14px);
		font-style: normal;
		font-weight: var(--annotation-font-weight, 400);
		line-height: 100%;
		letter-spacing: var(--annotation-letter-spacing, 0.42px);
	}

	/* Gooey: GooeyText draws the background and padding instead. */
	.annotation.gooey {
		padding: 0;
		background: none;
		box-shadow: none;
	}

	/* Multiline: wrap up to the inline max-width. */
	.annotation.multiline {
		white-space: normal;
		overflow-wrap: break-word;
		text-align: left;
		line-height: var(--annotation-multiline-line-height, 120%);
	}

	.annotation.outline {
		--outline-default-text: #000;
		--outline-default-stroke: #fff;

		padding: 0;
		background: none;
		box-shadow: none;

		color: var(--annotation-outline-text, var(--outline-default-text));

		/* Stroke painted first at 2px; the glyph fill covers its inner half, leaving 1px. */
		-webkit-text-stroke: 2px var(--annotation-outline-stroke, var(--outline-default-stroke));
		paint-order: stroke fill;
		stroke-linejoin: round;
	}

	:global([data-scheme='dark']) .annotation.outline {
		--outline-default-text: #fff;
		--outline-default-stroke: #000;
	}
</style>
