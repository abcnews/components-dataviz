<!-- GooeyText (Svelte 5): wrapping text on one joined "gooey" background; outside corners round, inside square.
     Usage: <GooeyText text="Some text" maxWidth={160} fill="#fff" />  Vars: --gooey-fill, --gooey-radius, --gooey-padding
     Text colour, font and line height are inherited. -->
<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';

	type Pointer = 'top-left' | 'top-right' | 'bottom-right' | 'bottom-left' | 'none';
	type Rect = { top: number; height: number; width: number };
	type Line = { centre: number; height: number; right: number };
	type Box = { top: number; bottom: number; width: number };

	interface Props extends HTMLAttributes<HTMLDivElement> {
		/** Text to show; ignored when `children` is passed. */
		text?: string;
		/** Max width incl. padding (number = px). Enables left-aligned wrapping; unset = one line. */
		maxWidth?: number | string;
		/** Squared-off corner (default 'bottom-left'). Right ones are line ends, not bounding-box corners. */
		pointer?: Pointer;
		/** Outside-corner radius (number = px); overrides --gooey-radius. Shrinks where it doesn't fit. */
		radius?: number | string;
		/** Background colour; overrides --gooey-fill. */
		fill?: string;
		class?: string;
		style?: string;
	}

	/** Line-length steps below this (px) are smoothed out. */
	const SMALLEST_STEP = 6;
	const EPSILON = 1e-6;

	/** Re-applies `step` until its output stops changing (as judged by `same`). */
	function settle<T>(step: (items: T[]) => T[], items: T[], same: (a: T, b: T) => boolean): T[] {
		const next = step(items);
		const unchanged = next.length === items.length && next.every((item, i) => same(item, items[i]));
		return unchanged ? items : settle(step, next, same);
	}

	const isTinyStep = (a: number, b: number) => a !== b && Math.abs(a - b) < SMALLEST_STEP;

	/** One left-to-right pass: neighbours that differ by a tiny step both take the wider width. */
	const smoothPass = (widths: number[]) =>
		widths.reduce<number[]>((out, width) => {
			const left = out.at(-1);
			if (left === undefined || !isTinyStep(left, width)) return [...out, width];
			const wider = Math.max(left, width);
			return [...out.slice(0, -1), wider, wider];
		}, []);

	/** Union of the boxes as stacked rects: between each pair of y edges, the widest box wins. */
	function stackBoxes(boxes: Box[]): Rect[] {
		const edges = [...new Set(boxes.flatMap((box) => [box.top, box.bottom]))].sort((a, b) => a - b);
		return edges.slice(1).flatMap((bottom, i) => {
			const top = edges[i];
			if (bottom - top < 0.01) return [];
			const widths = boxes
				.filter((box) => box.top <= top + EPSILON && box.bottom >= bottom - EPSILON)
				.map((box) => box.width);
			return widths.length ? [{ top, height: bottom - top, width: Math.max(...widths) }] : [];
		});
	}

	/** Joins vertically adjacent rects of equal width into one. */
	const mergeEqualNeighbours = (rects: Rect[]) =>
		rects.reduce<Rect[]>((merged, rect) => {
			const previous = merged.at(-1);
			if (previous?.width === rect.width) previous.height += rect.height;
			else merged.push({ ...rect });
			return merged;
		}, []);

	/** One pass: a rect shorter than `maxHeight` and narrower than both neighbours is widened to the narrower one. */
	const fillNotches = (rects: Rect[], maxHeight: number) =>
		rects.reduce<Rect[]>((out, rect, i) => {
			const left = out.at(-1);
			const right = rects[i + 1] as Rect | undefined;
			if (
				left &&
				right &&
				rect.height < maxHeight &&
				rect.width < left.width &&
				rect.width < right.width
			) {
				return [...out, { ...rect, width: Math.min(left.width, right.width) }];
			}
			return [...out, rect];
		}, []);

	/** CSS border-radius for one rect: outside corners round; inside corners and the pointer stay square. */
	function cornerRadii(
		rect: Rect,
		above: Rect | undefined,
		below: Rect | undefined,
		radius: number,
		pointer: Pointer
	) {
		const wanted = (name: Pointer) => (pointer === name ? 0 : radius);

		// Round at the shape's ends or where this rect sticks out past its neighbour, capped by the step.
		const side = (neighbour: Rect | undefined, end: number) =>
			!neighbour
				? end
				: rect.width > neighbour.width
					? Math.min(radius, rect.width - neighbour.width)
					: 0;

		const topLeft = above ? 0 : wanted('top-left');
		const topRight = side(above, wanted('top-right'));
		const bottomRight = side(below, wanted('bottom-right'));
		const bottomLeft = below ? 0 : wanted('bottom-left');

		// Shrink all four together if two corners on one side don't fit, like CSS.
		const fit = (sum: number, size: number) => (sum > 0 ? size / sum : 1);
		const scale = Math.min(
			1,
			fit(topLeft + bottomLeft, rect.height),
			fit(topRight + bottomRight, rect.height),
			fit(topLeft + topRight, rect.width),
			fit(bottomLeft + bottomRight, rect.width)
		);

		return [topLeft, topRight, bottomRight, bottomLeft]
			.map((corner) => `${corner * scale}px`)
			.join(' ');
	}

	/** Turns measured line widths into non-overlapping background rects with CSS corner radii. */
	function buildBands({
		boundaries, // y between neighbouring lines
		widths: measured, // line widths from x = 0
		height,
		paddingTop,
		paddingBottom,
		radius,
		pointer
	}: {
		boundaries: number[];
		widths: number[];
		height: number;
		paddingTop: number;
		paddingBottom: number;
		radius: number;
		pointer: Pointer;
	}) {
		const widths = settle(smoothPass, measured, (a, b) => a === b);

		// One box per line, padded like a single-line label so neighbours overlap by the padding.
		const boxes = widths.map((width, i) => ({
			top: Math.max(0, (boundaries[i - 1] ?? paddingTop) - paddingTop),
			bottom: Math.min(height, (boundaries[i] ?? height - paddingBottom) + paddingBottom),
			width
		}));

		// A notch (line shorter than both neighbours) thinner than the padding would look like a slot.
		const rects = settle(
			(list) => mergeEqualNeighbours(fillNotches(list, paddingTop + paddingBottom)),
			mergeEqualNeighbours(stackBoxes(boxes)),
			(a, b) => a.width === b.width
		);

		return rects.map((rect, i) => ({
			...rect,
			radii: cornerRadii(rect, rects[i - 1], rects[i + 1], radius, pointer)
		}));
	}

	let {
		text = '',
		children,
		maxWidth,
		pointer = 'bottom-left',
		radius,
		fill,
		class: className = '',
		style = '',
		...rest
	}: Props = $props();

	let root = $state<HTMLDivElement>();
	let layer = $state<HTMLDivElement>();
	let content = $state<HTMLDivElement>();
	let bands = $state.raw<ReturnType<typeof buildBands>>([]);

	let measured = $derived(bands.length > 0);
	let isWrapping = $derived(maxWidth != null && maxWidth !== '');

	const toCssLength = (value: number | string) =>
		typeof value === 'number' ? `${value}px` : value;
	const toNumber = (value: string) => parseFloat(value) || 0;

	// Plain rounded rectangle shown until the first measurement (and on the server).
	let fallbackRadius = $derived(
		(['top-left', 'top-right', 'bottom-right', 'bottom-left'] as const)
			.map((corner) => (corner === pointer ? '0px' : 'var(--gooey-radius, 8px)'))
			.join(' ')
	);

	let inlineStyle = $derived(
		[
			`border-radius:${fallbackRadius}`,
			fill !== undefined ? `--gooey-fill:${fill}` : undefined,
			radius !== undefined ? `--gooey-radius:${toCssLength(radius)}` : undefined,
			isWrapping ? `max-width:${toCssLength(maxWidth!)}` : undefined,
			style
		]
			.filter(Boolean)
			.join(';')
	);

	function measure() {
		if (!root || !layer || !content) return;

		const width = root.offsetWidth;
		const height = root.offsetHeight;
		if (!width || !height) return; // hidden or not laid out: keep current bands

		// offsetWidth/Height ignore transforms, so the ratio reveals ancestor scaling.
		const rootRect = root.getBoundingClientRect();
		const scaleX = rootRect.width / width || 1;
		const scaleY = rootRect.height / height || 1;
		const pixelRatio = window.devicePixelRatio || 1;
		const snap = (value: number) => Math.round(value * pixelRatio) / pixelRatio;

		const rootStyle = getComputedStyle(root);
		const paddingLeft = toNumber(rootStyle.paddingLeft);
		const paddingTop = snap(toNumber(rootStyle.paddingTop));
		const paddingBottom = snap(toNumber(rootStyle.paddingBottom));
		const wantedRadius = toNumber(getComputedStyle(layer).borderTopLeftRadius);

		// Group text fragments into visual lines.
		const range = document.createRange();
		range.selectNodeContents(content);
		const fragments = [...range.getClientRects()]
			.filter((rect) => rect.width > 0.5 && rect.height > 0.5)
			.sort((a, b) => a.top - b.top || a.left - b.left);

		const lines = fragments.reduce<Line[]>((grouped, rect) => {
			const centre = (rect.top + rect.bottom) / 2;
			const line = grouped.at(-1);
			if (line && Math.abs(centre - line.centre) < Math.min(rect.height, line.height) / 2) {
				line.right = Math.max(line.right, rect.right);
			} else {
				grouped.push({ centre, height: rect.height, right: rect.right });
			}
			return grouped;
		}, []);

		if (lines.length === 0) {
			bands = [];
			return;
		}

		// Lines are separated halfway between neighbouring line centres.
		const boundaries = lines
			.slice(1)
			.map((line, i) => snap(((lines[i].centre + line.centre) / 2 - rootRect.top) / scaleY));
		const widths = lines.map((line) =>
			Math.min(width, snap((line.right - rootRect.left) / scaleX + paddingLeft))
		);

		bands = buildBands({
			boundaries,
			widths,
			height,
			paddingTop,
			paddingBottom,
			radius: wantedRadius,
			pointer
		});
	}

	$effect(() => {
		void [text, children, maxWidth, pointer, radius]; // re-measure when these change
		if (!root || !content) return;

		measure();

		const resizeObserver = new ResizeObserver(measure);
		resizeObserver.observe(root);

		const mutationObserver = new MutationObserver(measure);
		mutationObserver.observe(content, { childList: true, characterData: true, subtree: true });

		document.fonts?.ready.then(measure);
		document.fonts?.addEventListener('loadingdone', measure);

		return () => {
			resizeObserver.disconnect();
			mutationObserver.disconnect();
			document.fonts?.removeEventListener('loadingdone', measure);
		};
	});
</script>

<div
	bind:this={root}
	class="gooey {className}"
	class:wrap={isWrapping}
	class:measured
	style={inlineStyle}
	{...rest}
>
	<div bind:this={layer} class="layer" aria-hidden="true">
		{#each bands as band}
			<span
				class="band"
				style="top:{band.top}px;height:{band.height}px;width:{band.width}px;border-radius:{band.radii}"
			></span>
		{/each}
	</div>
	<div bind:this={content} class="content">
		{#if children}
			{@render children()}
		{:else}
			{text}
		{/if}
	</div>
</div>

<style>
	.gooey {
		position: relative;
		isolation: isolate;
		display: inline-block;
		box-sizing: border-box;
		width: max-content;
		padding: var(--gooey-padding, 6px 8px);
		text-wrap: balance;
	}

	/* Until measured: plain rounded rectangle (radius set inline). */
	.gooey:not(.measured) {
		background: var(--gooey-fill, #fff);
	}

	.gooey.wrap {
		white-space: normal;
		overflow-wrap: break-word;
		text-align: left;
	}

	/* Unpainted; only here so measure() can read --gooey-radius resolved to px. */
	.layer {
		position: absolute;
		inset: 0;
		pointer-events: none;
		border-top-left-radius: var(--gooey-radius, 8px);
	}

	.content {
		position: relative;
	}

	.band {
		position: absolute;
		left: 0;
		background: var(--gooey-fill, #fff);
	}
</style>
