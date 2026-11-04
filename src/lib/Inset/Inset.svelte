<!-- Inset (Svelte 5): an image cropped to a circle or a rounded square, with a themed border.
     Corner radius follows the rendered width: <=40px 4px, <=50px 8px, >=72px 12px (51-71px stays 8px).
     <Inset src="/me.jpg" alt="Jo Smith" size={48} shape="circle" />
     Border: always 1px; white in light mode, black under a [data-scheme="dark"] ancestor (set by the consumer). Change the colour with the
     `colour` prop or the --image-border-colour var.
     Other vars: --image-radius (rounded only), --image-fill (placeholder colour while loading).
     Placement: `anchor` sets which point of the inset sits on the spot it is placed at (see Anchored, which
     does the work), `offset` pushes it away from that point, and `x` / `y` pin it against the nearest
     positioned ancestor. <Inset src="/me.jpg" anchor="center" /> or <Inset src="/me.jpg" anchor="bottom" offset={8} x={120} y={80} />
     Anchored insets need a fixed `size` (px or rem), not a percentage. -->
<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import Anchored, { type Anchor } from '../Anchored/Anchored.svelte';

	interface Props extends HTMLAttributes<HTMLSpanElement> {
		/** Image URL. */
		src: string;
		/** Alt text. Leave empty (default) for purely decorative images. */
		alt?: string;
		/** Width and height. Number = px; strings are any CSS length, e.g. '100%' or '4rem' (default 48).
		 *  Percentages only work when the inset is not anchored (`anchor`, `offset`, `x` or `y`). */
		size?: number | string;
		/** 'circle' (border-radius 100vw) or 'rounded' square whose radius depends on the size (default 'circle'). */
		shape?: 'circle' | 'rounded';
		/** Border colour (overrides --image-border-colour and the light/dark default). Width is fixed at 1px. */
		colour?: string;
		/** CSS object-position, to choose which part of the image stays visible (default 'center'). */
		position?: string;
		/** CSS object-fit (default 'cover'). */
		fit?: 'cover' | 'contain';
		loading?: 'lazy' | 'eager';
		/** Inset point that sits at the placement spot (default: not anchored, so the inset is placed as usual). */
		anchor?: Anchor;
		/** Px to push the inset away from the anchor so it clears the symbol it points to; ignored for 'center'. */
		offset?: number;
		/** Pin the anchor point at this distance from the left of the nearest positioned ancestor
		 *  (number = px, or any CSS length). Leave `x` and `y` unset to use the parent's origin. */
		x?: number | string;
		/** Pin the anchor point at this distance from the top of the nearest positioned ancestor. */
		y?: number | string;
		class?: string;
		style?: string;
	}

	let {
		src,
		alt = '',
		size = 48,
		shape = 'circle',
		colour,
		position = 'center',
		fit = 'cover',
		loading = 'lazy',
		anchor,
		offset,
		x,
		y,
		class: className = '',
		style = '',
		...rest
	}: Props = $props();

	let inlineStyle = $derived(
		[
			`--image-size:${typeof size === 'number' ? `${size}px` : size}`,
			colour !== undefined ? `--image-border-colour:${colour}` : undefined,
			style
		]
			.filter(Boolean)
			.join(';')
	);
</script>

<Anchored {anchor} {offset} {x} {y}>
	<span class="image {className}" style={inlineStyle} {...rest}>
		<span class="frame" class:circle={shape === 'circle'}>
			<img
				{src}
				{alt}
				{loading}
				decoding="async"
				style:object-fit={fit}
				style:object-position={position}
			/>
		</span>
	</span>
</Anchored>

<style>
	/* The outer span is the size container: the radius query below needs an ancestor to measure,
	   so it works for any CSS size, not just numbers. */
	.image {
		display: inline-block;
		container-type: inline-size;
		width: var(--image-size, 48px);
		max-width: 100%;
		line-height: 0;
		vertical-align: middle;
	}

	.frame {
		--image-radius-auto: 12px;
		--image-border-colour-default: #fff;
		--image-fill-default: #e4e7ea;

		display: block;
		box-sizing: border-box;
		width: 100%;
		aspect-ratio: 1;
		overflow: hidden;
		background: var(--image-fill, var(--image-fill-default));
		border: 1px solid var(--image-border-colour, var(--image-border-colour-default));
		border-radius: var(--image-radius, var(--image-radius-auto));
	}

	@container (width <= 71.99px) {
		.frame {
			--image-radius-auto: 8px;
		}
	}

	@container (width <= 40px) {
		.frame {
			--image-radius-auto: 4px;
		}
	}

	/* Declared after the queries so a circle always wins. */
	.frame.circle {
		border-radius: 100vw;
	}

	img {
		display: block;
		width: 100%;
		height: 100%;
	}

	:global([data-scheme='dark']) .frame {
		--image-border-colour-default: #000;
		--image-fill-default: #2a3336;
	}
</style>
