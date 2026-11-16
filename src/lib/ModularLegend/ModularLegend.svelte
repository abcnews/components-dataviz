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
	};

	let {
		discreteLegends,
		continuousLegend,
		betweenTicks,
		otherLegends = [],
		continues
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

	const visibleBetweenTicks = $derived(betweenTicks?.slice(0, Math.max(count - 1, 0)));
</script>

<div
	class="legend"
	style:grid-template-columns={otherLegends.length
		? 'minmax(0, 1fr) max-content'
		: 'minmax(0, 1fr)'}
>
	<!-- Main legend (discrete or continuous): fills the remaining width -->
	<div
		class="legend__ticks"
		class:legend__ticks-continuous={continuousLegend}
		style:grid-template-columns={discreteLegends
			? visibleBetweenTicks
				? betweenColumns
				: equalColumns
			: undefined}
	>
		{#if discreteLegends && visibleBetweenTicks}
			{#each visibleBetweenTicks as tick, i}
				<div class="legend__textitem" style:grid-column={i + 2} title={tick}>{tick}</div>
			{/each}
		{:else if discreteLegends}
			{#each discreteLegends as { text }}
				<div class="legend__textitem" title={text}>{text}</div>
			{/each}
		{:else if continuousLegend}
			{#each continuousLegend.ticks as tick}
				<div class="legend__textitem" title={tick}>{tick}</div>
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

	<!-- Other legends: sized to the widest one, then all equal -->
	{#if otherLegends.length}
		<div class="legend__others">
			{#each otherLegends as { text, colour, image }, i}
				<div class="legend__textitem legend__textitem-other" style:grid-column={i + 1}>{text}</div>
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
		row-gap: 0.25rem;
		width: 100%;
		font-size: 0.75rem;
		line-height: 1.2;
	}

	/* Main ticks + track share the first column, and the same inner grid */
	.legend__ticks,
	.legend__track {
		display: grid;
		grid-column: 1;
	}
	.legend__ticks {
		grid-row: 1;
	}
	.legend__track {
		grid-row: 2;
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

	/* Continuous: first and last tick sit on the edges, the rest evenly between */
	.legend__ticks-continuous {
		display: flex;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.legend__textitem {
		min-width: 0;
		padding-inline: 0.125rem;
		text-align: center;
		/* Aggressively clamp to two lines */
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		overflow: hidden;
		overflow-wrap: anywhere;
	}
	.legend__ticks-continuous .legend__textitem {
		flex: 0 1 auto;
		padding-inline: 0;
		text-align: start;
	}
	.legend__ticks-continuous .legend__textitem:last-child {
		text-align: end;
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

	.legend__textitem-other {
		grid-row: 1;
		white-space: nowrap;
		display: block;
		overflow: visible;
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
