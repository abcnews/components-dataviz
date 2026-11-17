<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import {
		SequentialPalette,
		DivergentPalette,
		getSequentialSteppedPalette,
		getSequentialContinuousPaletteInterpolator,
		getDivergentSteppedPalette,
		getDivergentContinuousPaletteInterpolator,
		getNamedColour
	} from '@abcnews/palette';
	import ModularLegend from './ModularLegend.svelte';

	const low = getNamedColour('sd-0-l');

	// Sequential red, 4 steps: the zero colour plus four reds
	const reds = getSequentialSteppedPalette(4, SequentialPalette.Red);

	// Neutral below 25, then the sequential red palette
	const discrete = [
		{ text: '<25', colour: reds[0] },
		{ text: '25–50', colour: reds[1] },
		{ text: '50–75', colour: reds[2] },
		{ text: '75–100', colour: reds[3] },
		{ text: '100+', colour: reds[4] }
	];

	// 5° buckets: grey for <25, then four reds up to 40, with boundary values 25°–40°.
	// Open-ended at both ends, so use with continues="both".
	const temperature = [{ colour: low }, ...reds.slice(1).map((colour) => ({ colour }))];
	const temperatureTicks = ['25°', '30°', '35°', '40°'];

	// Sequential continuous: the full blue ramp across 0–100
	const blue = getSequentialContinuousPaletteInterpolator(SequentialPalette.Blue);
	const continuous = {
		steps: Array.from({ length: 9 }, (_, i) => ({ colour: blue(i / 8), pct: `${(i * 100) / 8}%` })),
		ticks: ['0', '25', '50', '75', '100']
	};

	// Diverging discrete: six buckets either side of zero, open-ended at both ends.
	// The library always includes a neutral middle colour, so it's dropped here.
	// Boundary labels sit between swatches, with 0 at the centre.
	const diverging = getDivergentSteppedPalette(3, DivergentPalette.RedBlue)
		.filter((_, i) => i !== 3)
		.map((colour) => ({ colour }));
	const divergingTicks = ['−10', '−5', '0', '+5', '+10'];

	// Diverging continuous: dark blue → light centre → dark red
	const redBlue = getDivergentContinuousPaletteInterpolator(DivergentPalette.RedBlue);
	const divergingContinuous = {
		steps: Array.from({ length: 20 }, (_, i) => ({
			colour: redBlue(i / 19),
			pct: `${(i * 100) / 19}%`
		})),
		ticks: ['−10', '−5', '0', '+5', '+10']
	};

	const hatch = `repeating-linear-gradient(45deg, ${getNamedColour('grey-l')} 0 2px, transparent 2px 5px)`;

	const noData = [{ text: 'No data', colour: low, image: hatch }];
	const notApplicable = [{ text: 'Not applicable', colour: getNamedColour('taupe-l') }];

	const longLabels = [
		{ text: 'Extremely long category label that cannot possibly fit', colour: reds[0] },
		{ text: 'Another verbose description of this bucket', colour: reds[1] },
		{ text: 'Supercalifragilisticexpialidocious', colour: reds[2] },
		{ text: 'Short', colour: reds[4] }
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
			startAnnotation: {
				control: 'text',
				description:
					'Short annotation under the bottom left of the legend, e.g. "Cooler". Inherits text colour from the page.'
			},
			endAnnotation: {
				control: 'text',
				description:
					'Short annotation under the bottom right of the legend, e.g. "Hotter". Inherits text colour from the page.'
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
				<code>Multiple other</code>
				<div class="box">
					<ModularLegend
						continuousLegend={continuous}
						otherLegends={[...noData, ...notApplicable]}
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
				<code>Diverging, between ticks</code>
				<div class="box">
					<ModularLegend
						discreteLegends={diverging}
						betweenTicks={divergingTicks}
						continues="both"
					/>
				</div>
			</div>
			<div class="row">
				<code>Diverging, continuous</code>
				<div class="box">
					<ModularLegend continuousLegend={divergingContinuous} continues="both" />
				</div>
			</div>
			<div class="row">
				<code>Annotations</code>
				<div class="box">
					<ModularLegend
						discreteLegends={temperature}
						betweenTicks={temperatureTicks}
						continues="both"
						startAnnotation="Cooler"
						endAnnotation="Hotter"
					/>
				</div>
			</div>
			<div class="row">
				<code>Annotations + other</code>
				<div class="box">
					<ModularLegend
						continuousLegend={continuous}
						otherLegends={noData}
						startAnnotation="Cooler"
						endAnnotation="Hotter"
					/>
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
	name="Multiple other"
	args={{ discreteLegends: discrete, otherLegends: [...noData, ...notApplicable] }}
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

<Story
	name="Diverging"
	args={{ discreteLegends: diverging, betweenTicks: divergingTicks, continues: 'both' }}
>
	{#snippet template(args)}
		{@render frame(args, 480)}
	{/snippet}
</Story>

<Story
	name="Diverging (continuous)"
	args={{
		discreteLegends: undefined,
		continuousLegend: divergingContinuous,
		continues: 'both'
	}}
>
	{#snippet template(args)}
		{@render frame(args, 480)}
	{/snippet}
</Story>

<Story
	name="Annotations"
	args={{
		discreteLegends: temperature,
		betweenTicks: temperatureTicks,
		continues: 'both',
		startAnnotation: 'Cooler',
		endAnnotation: 'Hotter'
	}}
>
	{#snippet template(args)}
		{@render frame(args, 480)}
	{/snippet}
</Story>

<Story
	name="Annotations (continuous, with other)"
	args={{
		discreteLegends: undefined,
		continuousLegend: continuous,
		otherLegends: noData,
		startAnnotation: 'Cooler',
		endAnnotation: 'Hotter'
	}}
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
		color: #000;
		padding: 16px;
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
