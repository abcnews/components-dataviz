<!-- Anchored (Svelte 5): wraps any content so that one of its points (`anchor`) sits on a target point,
     optionally pushed away from that point by `offset`. Pure CSS: no measuring, no JS maths.
     Where is the target point?
       - Inherited (default): the wrapper starts at its parent's origin, so put it in a zero-size spot
         (e.g. a 0x0 absolutely positioned element) and the anchor lands exactly there.
       - Set with `x` / `y`: the wrapper positions itself against its nearest positioned ancestor.
     <Anchored anchor="bottom-right" offset={8} x={120} y={80}><Annotation text="Peak" /></Anchored>
     With the defaults (anchor 'top-left', offset 0, no x/y) nothing is added to the DOM: the children
     render as if the wrapper were not there.
     The content must have a size of its own (not a percentage of the wrapper), because the shift is a
     percentage of the content's rendered box. -->
<script lang="ts" module>
	export type Anchor =
		| 'top-left'
		| 'top'
		| 'top-right'
		| 'left'
		| 'center'
		| 'right'
		| 'bottom-left'
		| 'bottom'
		| 'bottom-right';
</script>

<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		/** Point on the content that sits on the target point (default 'top-left', no shift). */
		anchor?: Anchor;
		/** Px to push the content away from the anchor so it clears the symbol it points to; ignored
		 *  on a centred axis. */
		offset?: number;
		/** Horizontal target point, from the left edge of the nearest positioned ancestor. Number = px;
		 *  strings are any CSS length. Setting `x` or `y` makes the wrapper absolutely positioned
		 *  (a missing one counts as 0). Leave both unset to inherit the parent's origin. */
		x?: number | string;
		/** Vertical target point, from the top edge of the nearest positioned ancestor. See `x`. */
		y?: number | string;
		class?: string;
		style?: string;
	}

	let {
		anchor = 'top-left',
		offset = 0,
		x,
		y,
		children,
		class: className = '',
		style = '',
		...rest
	}: Props = $props();

	const toLength = (value: number | string) => (typeof value === 'number' ? `${value}px` : value);

	let isPlaced = $derived(x !== undefined || y !== undefined);
	// Top-left with no offset is the identity, so skip the wrapper entirely.
	let isActive = $derived(isPlaced || anchor !== 'top-left' || Boolean(offset));

	let inlineStyle = $derived(
		[
			offset ? `--anchor-offset:${offset}px` : undefined,
			isPlaced ? `left:${toLength(x ?? 0)};top:${toLength(y ?? 0)}` : undefined,
			style
		]
			.filter(Boolean)
			.join(';')
	);
</script>

{#if isActive}
	<div
		class="anchored {className}"
		class:placed={isPlaced}
		data-anchor={anchor}
		style={inlineStyle}
		{...rest}
	>
		{@render children?.()}
	</div>
{:else}
	{@render children?.()}
{/if}

<style>
	/* --anchor-x / --anchor-y: fraction of the content's own width / height that sits before the
	   anchor point (0 = start, 0.5 = middle, 1 = end). */
	.anchored {
		--anchor-x: 0;
		--anchor-y: 0;

		/* A flex container blockifies the child, so there is no line box (strut) adding height
		   under it, and shrink-wraps it so the percentages below match the content's real size. */
		display: flex;
		width: max-content;

		/* Percentages in translate() refer to this box. The offset term is +offset at 0, -offset at 1
		   and 0 at 0.5: always away from the anchor. */
		transform: translate(
			calc(var(--anchor-x) * -100% + (1 - 2 * var(--anchor-x)) * var(--anchor-offset, 0px)),
			calc(var(--anchor-y) * -100% + (1 - 2 * var(--anchor-y)) * var(--anchor-offset, 0px))
		);
	}

	.anchored.placed {
		position: absolute;
	}

	.anchored[data-anchor='top'] {
		--anchor-x: 0.5;
	}
	.anchored[data-anchor='top-right'] {
		--anchor-x: 1;
	}
	.anchored[data-anchor='left'] {
		--anchor-y: 0.5;
	}
	.anchored[data-anchor='center'] {
		--anchor-x: 0.5;
		--anchor-y: 0.5;
	}
	.anchored[data-anchor='right'] {
		--anchor-x: 1;
		--anchor-y: 0.5;
	}
	.anchored[data-anchor='bottom-left'] {
		--anchor-y: 1;
	}
	.anchored[data-anchor='bottom'] {
		--anchor-x: 0.5;
		--anchor-y: 1;
	}
	.anchored[data-anchor='bottom-right'] {
		--anchor-x: 1;
		--anchor-y: 1;
	}
</style>
