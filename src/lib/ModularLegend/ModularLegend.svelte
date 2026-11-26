<script lang="ts">
	type OtherLegend = {
		text: string;
		colour: string;
		/** Optional CSS image, e.g. a hatch pattern `repeating-linear-gradient(...)` or `url(...)` */
		image?: string;
	};

	type DiscreteLegend = {
		colour: string;
		image?: string;
		/** Label centred above the swatch. Not needed when using `betweenTicks`. */
		text?: string;
	};

	type ContinuousLegend = {
		/** Gradient stops, e.g. { colour: '#fde725', pct: '0%' } */
		steps: { colour: string; pct: string }[];
		/** Evenly spaced tick labels (equivalent of DiscreteLegend.text[]) */
		ticks: string[];
	};

	type Props = (
		| {
				discreteLegends: DiscreteLegend[];
				/**
				 * Labels placed on the boundaries between swatches instead of centred over them,
				 * e.g. 5 buckets from 20–45 → ['25', '30', '35', '40']. Expects discreteLegends.length - 1 items.
				 */
				betweenTicks?: string[];
				continuousLegend?: never;
		  }
		| { continuousLegend: ContinuousLegend; discreteLegends?: never; betweenTicks?: never }
	) & {
		/** Visually separated items (e.g. "No data"). Usually just one. */
		otherLegends?: OtherLegend[];
		/**
		 * Shape the main track's ends as arrows to show values carry on past the legend.
		 * `start` points left, `end` points right. Doesn't affect `otherLegends`.
		 */
		continues?: 'start' | 'end' | 'both';
		/** Short annotation under the bottom left of the legend, e.g. "Cooler". */
		startAnnotation?: string;
		/** Short annotation under the bottom right of the legend, e.g. "Hotter". */
		endAnnotation?: string;
		/**
		 * Forces the small or large layout. When unset, switches to large at 700px viewport width.
		 * Set it when the viewport doesn't reflect the page, e.g. inside an iframe.
		 */
		size?: 'small' | 'large';
	};

	let {
		discreteLegends,
		continuousLegend,
		betweenTicks,
		otherLegends = [],
		continues,
		startAnnotation,
		endAnnotation,
		size
	}: Props = $props();

	const count = $derived(discreteLegends?.length ?? 0);

	const gradient = $derived(
		continuousLegend
			? `linear-gradient(to right, ${continuousLegend.steps
					.map((s) => `${s.colour} ${s.pct}`)
					.join(', ')})`
			: undefined
	);

	const equalColumns = $derived(`repeat(${count}, minmax(0, 1fr))`);

	/**
	 * Half-width columns at each end, full-width columns between: the centre of
	 * column k then lands exactly on the boundary between swatch k and k + 1.
	 */
	const betweenColumns = $derived(
		['0.5fr', ...Array(Math.max(count - 1, 0)).fill('1fr'), '0.5fr']
			.map((fr) => `minmax(0, ${fr})`)
			.join(' ')
	);

	/**
	 * Each swatch is at most --swatch-max wide (45px small, 60px large; override with
	 * --legend-swatch-max)
	 */
	const mainColumn = $derived(
		discreteLegends
			? `minmax(0, calc(${count} * var(--swatch-max) + ${Math.max(count - 1, 0)} * var(--segment-gap)))`
			: 'minmax(0, 1fr)'
	);

	const visibleBetweenTicks = $derived(betweenTicks?.slice(0, Math.max(count - 1, 0)));
</script>

<div
	class="legend"
	data-size={size}
	style:grid-template-columns={otherLegends.length ? `${mainColumn} max-content` : mainColumn}
>
	<!-- Class / boundary labels + track (discrete or continuous): fills the remaining width -->
	<div
		class="legend__labels"
		class:legend__labels-continuous={continuousLegend}
		style:grid-template-columns={discreteLegends
			? visibleBetweenTicks
				? betweenColumns
				: equalColumns
			: undefined}
		style:column-gap={discreteLegends && !visibleBetweenTicks ? 'var(--segment-gap)' : undefined}
	>
		{#if discreteLegends && visibleBetweenTicks}
			{#each visibleBetweenTicks as tick, i}
				<div class="legend__label" style:grid-column={i + 2} title={tick}>{tick}</div>
			{/each}
		{:else if discreteLegends}
			{#each discreteLegends as { text }}
				<div class="legend__label" title={text}>{text}</div>
			{/each}
		{:else if continuousLegend}
			{#each continuousLegend.ticks as tick}
				<div class="legend__label" title={tick}>{tick}</div>
			{/each}
		{/if}
	</div>

	<div class="legend__track" data-continues={continues} style:grid-template-columns={equalColumns}>
		{#if discreteLegends}
			{#each discreteLegends as { colour, image }}
				<div
					class="legend__trackitem"
					style:background-color={colour}
					style:background-image={image}
				></div>
			{/each}
		{:else}
			<div class="legend__trackitem legend__trackitem-continuous" style:background={gradient}></div>
		{/if}
	</div>

	<!-- Scale context labels: bottom left and right, aligned to the main track -->
	{#if startAnnotation || endAnnotation}
		<div class="legend__context-labels">
			{#if startAnnotation}
				<span class="legend__context-label">{startAnnotation}</span>
			{/if}
			{#if endAnnotation}
				<span class="legend__context-label legend__context-label-end">{endAnnotation}</span>
			{/if}
		</div>
	{/if}

	<!-- Other legends: sized to the widest one, then all equal -->
	{#if otherLegends.length}
		<div class="legend__others">
			{#each otherLegends as { text, colour, image }, i}
				<div class="legend__label legend__label-other" style:grid-column={i + 1}>{text}</div>
				<div
					class="legend__trackitem legend__trackitem-other"
					style:grid-column={i + 1}
					style:background-color={colour}
					style:background-image={image}
				></div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.legend {
		display: grid;
		grid-template-rows: auto var(--legend-track-height, 0.75rem);
		column-gap: var(--legend-gap, 1.5rem);
		--legend-row-gap: calc(0.25rem - 2px);
		/* Small layout by default; the large layout overrides these three below */
		--swatch-max: var(--legend-swatch-max, 45px);
		--label-font-size: 14px;
		--context-label-font-size: 12px;
		--segment-gap: var(--legend-segment-gap, 1px);
		row-gap: var(--legend-row-gap);
		width: 100%;
		/* Text colour always comes from the page, so light and dark mode just work */
		color: inherit;
		font-size: 0.75rem;
		line-height: 1.2;
	}

	/* Main labels + track share the first column, and the same inner grid */
	.legend__labels,
	.legend__track {
		display: grid;
		grid-column: 1;
	}
	.legend__labels {
		grid-row: 1;
	}
	.legend__track {
		grid-row: 2;
		/* Gap between swatches; the page shows through */
		column-gap: var(--segment-gap);
		/* Clips the first and last swatch (or the gradient) to rounded ends */
		overflow: hidden;
		border-radius: var(--legend-radius, 4px);
	}

	/*
	 * "Continues" arrows: the track is masked by a solid body plus an arrowhead pinned to each
	 * marked end. The head's diagonal is 8:12 (width:height) and sized from the track height.
	 * Each head image also carries a flat, full-height strip (--pad) on its inner side. The body
	 * stops exactly where the diagonal begins, so the overlap that hides the seam sits inside
	 * that strip rather than poking out past the diagonal as a square step.
	 */
	.legend__track[data-continues] {
		--head: calc(var(--legend-track-height, 0.75rem) * 2 / 3);
		--pad: calc(var(--head) / 8);
		--head-size: calc(var(--head) + var(--pad)) 100%;
		--body: linear-gradient(#000, #000);
		--head-end: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 9 12' preserveAspectRatio='none'%3E%3Cpath d='M0 0H1L8.2 5.4Q9 6 8.2 6.6L1 12H0Z'/%3E%3C/svg%3E");
		--head-start: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 9 12' preserveAspectRatio='none'%3E%3Cpath d='M9 0H8L0.8 5.4Q0 6 0.8 6.6L8 12H9Z'/%3E%3C/svg%3E");
	}

	.legend__track[data-continues='end'] {
		-webkit-mask:
			var(--body) left / calc(100% - var(--head)) 100% no-repeat,
			var(--head-end) right / var(--head-size) no-repeat;
		mask:
			var(--body) left / calc(100% - var(--head)) 100% no-repeat,
			var(--head-end) right / var(--head-size) no-repeat;
		border-top-right-radius: 0;
		border-bottom-right-radius: 0;
	}

	.legend__track[data-continues='start'] {
		-webkit-mask:
			var(--body) right / calc(100% - var(--head)) 100% no-repeat,
			var(--head-start) left / var(--head-size) no-repeat;
		mask:
			var(--body) right / calc(100% - var(--head)) 100% no-repeat,
			var(--head-start) left / var(--head-size) no-repeat;
		border-top-left-radius: 0;
		border-bottom-left-radius: 0;
	}

	.legend__track[data-continues='both'] {
		-webkit-mask:
			var(--body) center / calc(100% - 2 * var(--head)) 100% no-repeat,
			var(--head-start) left / var(--head-size) no-repeat,
			var(--head-end) right / var(--head-size) no-repeat;
		mask:
			var(--body) center / calc(100% - 2 * var(--head)) 100% no-repeat,
			var(--head-start) left / var(--head-size) no-repeat,
			var(--head-end) right / var(--head-size) no-repeat;
		border-radius: 0;
	}

	/* Continuous: first and last label sit on the edges, the rest evenly between */
	.legend__labels-continuous {
		display: flex;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.legend__label {
		min-width: 0;
		font-size: var(--label-font-size);
		/*
		 * Swatches are capped at 45px (60px in the large layout) and can shrink further, so labels can be wider than their column. Centre them
		 * on it and let them spill equally to both sides rather than wrapping or clipping.
		 */
		display: flex;
		justify-content: center;
		white-space: nowrap;
	}
	.legend__labels-continuous .legend__label {
		flex: 0 1 auto;
		justify-content: flex-start;
	}
	.legend__labels-continuous .legend__label:last-child {
		justify-content: flex-end;
	}

	/*
	 * Spans both outer rows and inherits them via subgrid so the other swatches line up with
	 * the main track. `1fr` auto columns in a max-content grid all take the widest item's width.
	 */
	.legend__others {
		grid-column: 2;
		grid-row: 1 / 3;
		display: grid;
		grid-template-rows: subgrid;
		grid-auto-flow: column;
		grid-auto-columns: 1fr;
		column-gap: var(--legend-gap, 1.5rem);
	}

	.legend__label-other {
		grid-row: 1;
		white-space: nowrap;
		display: block;
		text-align: center;
	}

	/*
	 * Third row is implicit, so it only exists when there are scale context labels.
	 * 8px below the track in total (the row gap supplies part of it).
	 */
	.legend__context-labels {
		grid-column: 1;
		grid-row: 3;
		display: flex;
		gap: 8px;
		margin-top: calc(8px - var(--legend-row-gap));
	}
	.legend__context-label {
		min-width: 0;
		color: inherit;
		text-wrap-style: balance;
		font-feature-settings: 'ss01' on;
		font-family: 'ABC Sans Nova', sans-serif;
		font-size: var(--context-label-font-size);
		font-style: normal;
		font-weight: 400;
		line-height: 100%;
		letter-spacing: 0.03em;
	}
	.legend__context-label-end {
		margin-inline-start: auto;
		text-align: end;
	}

	/*
	 * Large layout: swatches up to 60px, class/boundary labels 16px, scale context labels 14px.
	 * Forced with size="large", or picked by viewport width when `size` is unset.
	 */
	.legend[data-size='large'] {
		--swatch-max: var(--legend-swatch-max, 60px);
		--label-font-size: 16px;
		--context-label-font-size: 14px;
	}
	@media (min-width: 700px) {
		.legend:not([data-size]) {
			--swatch-max: var(--legend-swatch-max, 60px);
			--label-font-size: 16px;
			--context-label-font-size: 14px;
		}
	}

	.legend__trackitem {
		min-width: 0;
		height: 100%;
	}
	.legend__trackitem-continuous {
		grid-column: 1 / -1;
	}
	.legend__trackitem-other {
		grid-row: 2;
		min-width: 1.5rem;
		border-radius: var(--legend-radius, 4px);
	}
</style>
