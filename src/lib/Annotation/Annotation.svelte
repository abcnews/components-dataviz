<!-- Annotation (Svelte 5): small label whose one square corner works as an arrow. Variants: filled (default), outline.
     Place it at the target point; `anchor` sets which label point sits there. <Annotation text="Peak" anchor="bottom-right" offset={8} />
     Style with --annotation-* vars (defaults in the CSS); the outline variant flips to dark under a `.dark` ancestor. -->
<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import GooeyText from '../GooeyText/GooeyText.svelte';

	type Anchor =
		| 'top-left'
		| 'top'
		| 'top-right'
		| 'left'
		| 'center'
		| 'right'
		| 'bottom-left'
		| 'bottom'
		| 'bottom-right';
	type Pointer = 'top-left' | 'top-right' | 'bottom-right' | 'bottom-left' | 'none';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		/** Label text; ignored when `children` is passed. */
		text?: string;
		/** 'filled' (default): padded label with background. 'outline': bare text with a 1px glyph
		 *  border, black on white (inverted under `.dark`). */
		variant?: 'filled' | 'outline';
		/** Label point that sits at the placement spot (default 'top-left', no shift). */
		anchor?: Anchor;
		/** Px to push the label away from the anchor so it clears the symbol; ignored for 'center'. */
		offset?: number;
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

	// Fraction of the label's [width, height] before the anchor point (0 = start, 1 = end).
	function getAnchorFractions(anchorName: Anchor) {
		const fractionsByAnchor: Record<Anchor, [number, number]> = {
			'top-left': [0, 0],
			top: [0.5, 0],
			'top-right': [1, 0],
			left: [0, 0.5],
			center: [0.5, 0.5],
			right: [1, 0.5],
			'bottom-left': [0, 1],
			bottom: [0.5, 1],
			'bottom-right': [1, 1]
		};

		return fractionsByAnchor[anchorName] ?? fractionsByAnchor['top-left'];
	}

	function buildAnchorTransform(anchorName: Anchor, offsetInPixels: number) {
		const [horizontalFraction, verticalFraction] = getAnchorFractions(anchorName);
		const isUnshifted = horizontalFraction === 0 && verticalFraction === 0 && !offsetInPixels;

		if (isUnshifted) return undefined;

		// Pixels away from the anchor: + forward, - backward, 0 when straddling it.
		const pixelsAwayFromAnchor = (fraction: number) => (1 - 2 * fraction) * offsetInPixels;
		const horizontalShift = `${-horizontalFraction * 100}% + ${pixelsAwayFromAnchor(horizontalFraction)}px`;
		const verticalShift = `${-verticalFraction * 100}% + ${pixelsAwayFromAnchor(verticalFraction)}px`;

		return `transform:translate(calc(${horizontalShift}), calc(${verticalShift}))`;
	}

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
			buildAnchorTransform(anchor, offset),
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

	:global(.dark) .annotation.outline {
		--outline-default-text: #fff;
		--outline-default-stroke: #000;
	}
</style>
