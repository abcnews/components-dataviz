<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ModularLegend from './ModularLegend.svelte';

	const discrete = [
		{ text: '0–20', colour: '#fde9c9' },
		{ text: '20–40', colour: '#f9c27e' },
		{ text: '40–60', colour: '#f08a4b' },
		{ text: '60–80', colour: '#d1495b' },
		{ text: '80+', colour: '#7a1f3d' }
	];

	// 5° buckets from 20–45: five swatches, four boundary values
	const temperature = [
		{ colour: '#4575b4' },
		{ colour: '#91bfdb' },
		{ colour: '#fee090' },
		{ colour: '#fc8d59' },
		{ colour: '#d73027' }
	];
	const temperatureTicks = ['25°', '30°', '35°', '40°'];

	const continuous = {
		steps: [
			{ colour: '#fde725', pct: '0%' },
			{ colour: '#35b779', pct: '50%' },
			{ colour: '#440154', pct: '100%' }
		],
		ticks: ['0', '25', '50', '75', '100']
	};

	const hatch = 'repeating-linear-gradient(45deg, #8a8a8a 0 2px, transparent 2px 5px)';

	const noData = [{ text: 'No data', colour: '#e4e4e4' }];
	const noDataHatched = [{ text: 'Not applicable', colour: '#f2f2f2', image: hatch }];

	const longLabels = [
		{ text: 'Extremely long category label that cannot possibly fit', colour: '#c6dbef' },
		{ text: 'Another verbose description of this bucket', colour: '#6baed6' },
		{ text: 'Supercalifragilisticexpialidocious', colour: '#3182bd' },
		{ text: 'Short', colour: '#08519c' }
	];

	const widths = [240, 400, 640];

	const { Story } = defineMeta({
		title: 'Components/ModularLegend',
		component: ModularLegend,
		tags: ['autodocs'],
		args: {
			discreteLegends: discrete,
			otherLegends: []
		},
		argTypes: {
			discreteLegends: {
				control: 'object',
				description:
					'Equal-width swatches. Labels are centred above each swatch and clamped to two lines. Use this **or** `continuousLegend`, not both.'
			},
			betweenTicks: {
				control: 'object',
				description:
					'Discrete only. Labels placed on the boundaries between swatches rather than over them, so a bucketed scale can show the value between two buckets. Expects `discreteLegends.length - 1` items. Swatch `text` is then unused.'
			},
			continuousLegend: {
				control: 'object',
				description:
					'A single gradient track that fills the available width. `steps` build the gradient; `ticks` are spaced evenly above it, first on the left edge and last on the right.'
			},
			otherLegends: {
				control: 'object',
				description:
					'Visually separated items (e.g. "No data"), equal in width to the widest. Accept an optional `image` (any CSS image) layered over `colour`.'
			},
			continues: {
				control: 'inline-radio',
				options: [undefined, 'start', 'end', 'both'],
				description:
					'Turns the main track\'s ends into arrows to show values carry on beyond the legend. `start` points left, `end` points right. Make sure the end labels still say so, e.g. "80+".'
			}
		}
	});
</script>

{#snippet frame(args, width: number)}
	<div class="surface">
		<div class="box" style="width:{width}px">
			<ModularLegend {...args} />
		</div>
	</div>
{/snippet}

<!-- Plain divs rather than a table: table cells size to content, which collapses every row to the same width -->
{#snippet widthRows(args)}
	<div class="surface">
		<div class="rows">
			{#each widths as width (width)}
				<div class="row">
					<code>{width}px</code>
					<div class="box" style="width:{width}px">
						<ModularLegend {...args} />
					</div>
				</div>
			{/each}
		</div>
	</div>
{/snippet}

{#snippet kitchenSink()}
	<div class="surface">
		<div class="rows">
			<div class="row">
				<code>Discrete</code>
				<div class="box">
					<ModularLegend discreteLegends={discrete} />
				</div>
			</div>
			<div class="row">
				<code>Discrete + other</code>
				<div class="box">
					<ModularLegend discreteLegends={discrete} otherLegends={noData} />
				</div>
			</div>
			<div class="row">
				<code>Between ticks</code>
				<div class="box">
					<ModularLegend discreteLegends={temperature} betweenTicks={temperatureTicks} />
				</div>
			</div>
			<div class="row">
				<code>Between ticks + other</code>
				<div class="box">
					<ModularLegend
						discreteLegends={temperature}
						betweenTicks={temperatureTicks}
						otherLegends={noData}
					/>
				</div>
			</div>
			<div class="row">
				<code>Continuous</code>
				<div class="box">
					<ModularLegend continuousLegend={continuous} />
				</div>
			</div>
			<div class="row">
				<code>Continuous + other</code>
				<div class="box">
					<ModularLegend continuousLegend={continuous} otherLegends={noData} />
				</div>
			</div>
			<div class="row">
				<code>Multiple other, with image</code>
				<div class="box">
					<ModularLegend
						continuousLegend={continuous}
						otherLegends={[...noData, ...noDataHatched]}
					/>
				</div>
			</div>
			<div class="row">
				<code>Discrete, continues end</code>
				<div class="box">
					<ModularLegend discreteLegends={discrete} continues="end" otherLegends={noData} />
				</div>
			</div>
			<div class="row">
				<code>Between ticks, continues both</code>
				<div class="box">
					<ModularLegend
						discreteLegends={temperature}
						betweenTicks={temperatureTicks}
						continues="both"
					/>
				</div>
			</div>
			<div class="row">
				<code>Continuous, continues start</code>
				<div class="box">
					<ModularLegend continuousLegend={continuous} continues="start" />
				</div>
			</div>
			<div class="row">
				<code>Text clamping</code>
				<div class="box narrow">
					<ModularLegend discreteLegends={longLabels} otherLegends={noData} />
				</div>
			</div>
		</div>
	</div>
{/snippet}

<Story name="Discrete" args={{ discreteLegends: discrete }}>
	{#snippet template(args)}
		{@render frame(args, 480)}
	{/snippet}
</Story>

<Story name="Between ticks" args={{ discreteLegends: temperature, betweenTicks: temperatureTicks }}>
	{#snippet template(args)}
		{@render frame(args, 480)}
	{/snippet}
</Story>

<Story name="Continuous" args={{ discreteLegends: undefined, continuousLegend: continuous }}>
	{#snippet template(args)}
		{@render frame(args, 480)}
	{/snippet}
</Story>

<Story name="Discrete with other" args={{ discreteLegends: discrete, otherLegends: noData }}>
	{#snippet template(args)}
		{@render frame(args, 480)}
	{/snippet}
</Story>

<Story
	name="Continuous with other"
	args={{ discreteLegends: undefined, continuousLegend: continuous, otherLegends: noData }}
>
	{#snippet template(args)}
		{@render frame(args, 480)}
	{/snippet}
</Story>

<Story
	name="Other with image"
	args={{ discreteLegends: discrete, otherLegends: [...noData, ...noDataHatched] }}
>
	{#snippet template(args)}
		{@render frame(args, 560)}
	{/snippet}
</Story>

<Story
	name="Continues"
	args={{ discreteLegends: discrete, continues: 'end', otherLegends: noData }}
>
	{#snippet template(args)}
		{@render frame(args, 480)}
	{/snippet}
</Story>

<Story
	name="Continues both ends"
	args={{
		discreteLegends: temperature,
		betweenTicks: temperatureTicks,
		continues: 'both'
	}}
>
	{#snippet template(args)}
		{@render frame(args, 480)}
	{/snippet}
</Story>

<Story
	name="Continues (continuous)"
	args={{ discreteLegends: undefined, continuousLegend: continuous, continues: 'both' }}
>
	{#snippet template(args)}
		{@render frame(args, 480)}
	{/snippet}
</Story>

<Story name="Text clamping" args={{ discreteLegends: longLabels, otherLegends: noData }}>
	{#snippet template(args)}
		{@render frame(args, 360)}
	{/snippet}
</Story>

<Story
	name="Widths"
	args={{ discreteLegends: discrete, otherLegends: noData }}
	parameters={{ controls: { disable: true } }}
>
	{#snippet template(args)}
		{@render widthRows(args)}
	{/snippet}
</Story>

<Story
	name="Widths (between ticks)"
	args={{ discreteLegends: temperature, betweenTicks: temperatureTicks, otherLegends: noData }}
	parameters={{ controls: { disable: true } }}
>
	{#snippet template(args)}
		{@render widthRows(args)}
	{/snippet}
</Story>

<Story
	name="Widths (continuous)"
	args={{ discreteLegends: undefined, continuousLegend: continuous, otherLegends: noData }}
	parameters={{ controls: { disable: true } }}
>
	{#snippet template(args)}
		{@render widthRows(args)}
	{/snippet}
</Story>

<Story name="Kitchen sink" parameters={{ controls: { disable: true } }}>
	{#snippet template()}
		{@render kitchenSink()}
	{/snippet}
</Story>

<style>
	.surface {
		display: inline-block;
		background: #fff;
		padding: 16px;
	}
	:global([data-scheme='dark']) .surface {
		background: #161c1e;
		color: #e8eef0;
	}
	.rows {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}
	.row {
		display: grid;
		grid-template-columns: 200px auto;
		align-items: end;
		gap: 16px;
	}
	.box {
		width: 480px;
	}
	.box.narrow {
		width: 360px;
	}
	/* Inline width on .box (Widths stories) wins over the defaults above */
</style>
