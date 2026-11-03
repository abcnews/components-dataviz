<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Annotation from './Annotation.svelte';
	import Icon from '../SVGSymbols/Icon.svelte';

	const anchors = [
		'top-left',
		'top',
		'top-right',
		'left',
		'center',
		'right',
		'bottom-left',
		'bottom',
		'bottom-right'
	];
	const pointers = ['top-left', 'top-right', 'bottom-right', 'bottom-left', 'none'];

	const white = '#FFFFFF';
	const black = '#000000';
	const blue = '#1E5AEB';
	const red = '#E71D38';

	// Dark mode accents (from the Figma dark annotation set).
	const darkBlue = '#6696FF';
	const darkRed = '#FF667B';

	// White fill with coloured text, then white text on coloured fills.
	const combos = [
		{ fill: white, text: black },
		{ fill: white, text: blue },
		{ fill: white, text: red },
		{ fill: red, text: white },
		{ fill: blue, text: white },
		{ fill: black, text: white }
	];

	// Same order as `combos`: white fill with coloured text, then coloured fills with
	// contrasting text. Black and white swap roles, and the accents are lightened.
	const darkCombos = [
		{ fill: black, text: white },
		{ fill: black, text: darkBlue },
		{ fill: black, text: darkRed },
		{ fill: darkRed, text: black },
		{ fill: darkBlue, text: black },
		{ fill: white, text: black }
	];

	const name = (hex: string) =>
		({
			[white]: 'white',
			[black]: 'black',
			[blue]: '#1E5AEB',
			[red]: '#E71D38',
			[darkBlue]: '#6696FF',
			[darkRed]: '#FF667B'
		})[hex] ?? hex;

	const { Story } = defineMeta({
		title: 'Components/Annotation',
		component: Annotation,
		tags: ['autodocs'],
		args: {
			text: 'Annotation',
			variant: 'filled',
			anchor: 'bottom-left',
			offset: 10,
			pointer: 'bottom-left',
			bold: false,
			strokeWidth: 1
		},
		argTypes: {
			text: { control: 'text' },
			variant: {
				control: 'select',
				options: ['filled', 'outline'],
				description:
					'`filled` is a padded label with a background. `outline` has no background or padding: just text with a border (white on light mode, black on dark mode).'
			},
			anchor: {
				control: 'select',
				options: anchors,
				description:
					'The point on the label that sits on the spot where the component is placed. `center` straddles it; `bottom-right` ends the label exactly at it.'
			},
			offset: {
				control: { type: 'range', min: 0, max: 48, step: 1 },
				description:
					'Pixels to push the label away from the anchor point, so it clears the symbol it points to. Ignored for `center`.'
			},
			pointer: {
				control: 'select',
				options: pointers,
				description: 'Which corner is squared off to act as the arrow, or `none`. Filled only.'
			},
			fill: {
				control: 'color',
				description: 'Overrides --annotation-fill for this instance. Filled only.'
			},
			stroke: {
				control: 'color',
				description:
					'Overrides --annotation-stroke (or --annotation-outline-stroke for `outline`) for this instance.'
			},
			strokeWidth: { control: { type: 'range', min: 0, max: 6, step: 0.5 } },
			color: {
				control: 'color',
				description:
					'Text colour. Overrides --annotation-text (or --annotation-outline-text for `outline`) for this instance.'
			},
			bold: { control: 'boolean' },
			children: { control: false },
			class: { control: false },
			style: { control: false }
		}
	});
</script>

{#snippet playground(args, dark: boolean)}
	<div class="stage" class:dark class:split={args.variant === 'outline'}>
		<!-- Zero-size spot at the stage centre; the story places the annotation here -->
		<div class="point">
			<span class="marker">
				<Icon name="circle" variant="filled" width={12} color={dark ? darkRed : red} {dark} />
			</span>
			<Annotation {...args} />
		</div>
	</div>
{/snippet}

{#snippet colours(args, rows: { fill: string; text: string }[], dark: boolean)}
	<div class="surface" class:dark>
		<table>
			<thead>
				<tr>
					<th scope="col">Fill</th>
					<th scope="col">Text</th>
					<th scope="col">Regular</th>
					<th scope="col">Bold</th>
					<th scope="col">Outline</th>
					<th scope="col">Outline Bold</th>
				</tr>
			</thead>
			<tbody>
				{#each rows as { fill, text } (fill + text)}
					<tr>
						<td><code>{name(fill)}</code></td>
						<td><code>{name(text)}</code></td>
						<td>
							<Annotation text={args.text} pointer={args.pointer} {fill} color={text} />
						</td>
						<td>
							<Annotation text={args.text} pointer={args.pointer} {fill} color={text} bold />
						</td>
						{#if (dark && text === '#000000') || (!dark && text === '#FFFFFF')}
							<td></td><td></td>
						{:else}
							<td>
								<Annotation
									text={args.text}
									pointer={args.pointer}
									{fill}
									color={text}
									variant="outline"
								/>
							</td>
							<td>
								<Annotation
									text={args.text}
									pointer={args.pointer}
									{fill}
									color={text}
									bold
									variant="outline"
								/>
							</td>
						{/if}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/snippet}

{#snippet outlineOverrides(args, dark: boolean)}
	<div class="stage split" class:dark>
		<div class="row" style="top: 40px">
			<Annotation variant="outline" text="Default" anchor="center" strokeWidth={args.strokeWidth} />
		</div>
		<div class="row" style="top: 90px">
			<Annotation
				variant="outline"
				text="Props: blue text, red border"
				anchor="center"
				color={dark ? darkBlue : blue}
				stroke={dark ? darkRed : red}
				strokeWidth={args.strokeWidth}
			/>
		</div>
		<div
			class="row"
			style="top: 140px; --annotation-outline-text: {dark
				? darkRed
				: red}; --annotation-outline-stroke: {dark ? white : black}"
		>
			<Annotation variant="outline" text="CSS variables on an ancestor" anchor="center" bold />
		</div>
	</div>
{/snippet}

<Story name="Playground">
	{#snippet template(args)}
		{@render playground(args, false)}
	{/snippet}
</Story>

<Story
	name="Playground (dark)"
	args={{ fill: black, color: white, stroke: black }}
	parameters={{ backgrounds: { default: 'dark' } }}
>
	{#snippet template(args)}
		{@render playground(args, true)}
	{/snippet}
</Story>

<Story name="Outline" args={{ variant: 'outline', strokeWidth: 2 }}>
	{#snippet template(args)}
		{@render playground(args, false)}
	{/snippet}
</Story>

<Story
	name="Outline (dark)"
	args={{ variant: 'outline', strokeWidth: 2 }}
	parameters={{ backgrounds: { default: 'dark' } }}
>
	{#snippet template(args)}
		{@render playground(args, true)}
	{/snippet}
</Story>

<Story
	name="Outline overrides"
	args={{ strokeWidth: 2 }}
	parameters={{ controls: { include: ['strokeWidth'] } }}
>
	{#snippet template(args)}
		{@render outlineOverrides(args, false)}
	{/snippet}
</Story>

<Story
	name="Outline overrides (dark)"
	args={{ strokeWidth: 2 }}
	parameters={{
		controls: { include: ['strokeWidth'] },
		backgrounds: { default: 'dark' }
	}}
>
	{#snippet template(args)}
		{@render outlineOverrides(args, true)}
	{/snippet}
</Story>

<Story name="Colours" parameters={{ controls: { include: ['text', 'pointer'] } }}>
	{#snippet template(args)}
		{@render colours(args, combos, false)}
	{/snippet}
</Story>

<Story
	name="Colours (dark)"
	parameters={{
		controls: { include: ['text', 'pointer'] },
		backgrounds: { default: 'dark' }
	}}
>
	{#snippet template(args)}
		{@render colours(args, darkCombos, true)}
	{/snippet}
</Story>

<style>
	.stage {
		position: relative;
		width: 400px;
		height: 240px;
		background: #c8d6ea;
		overflow: hidden;
	}
	.stage.dark {
		background: #161c1e;
	}
	.point {
		position: absolute;
		left: 200px;
		top: 120px;
		width: 0;
		height: 0;
	}
	.marker {
		position: absolute;
		left: 0;
		top: 0;
		line-height: 0;
		transform: translate(-50%, -50%);
		pointer-events: none;
	}
	.row {
		position: absolute;
		left: 200px;
		width: 0;
		height: 0;
	}
	.surface {
		display: inline-block;
		background: #c8d6ea;
		padding: 16px;
	}
	.surface.dark {
		background: #161c1e;
		color: #e8eef0;
	}
	.surface.dark th,
	.surface.dark td {
		border-bottom-color: #2a3336;
	}
	table {
		border-collapse: collapse;
	}
	th,
	td {
		padding: 10px 16px;
		text-align: left;
		border-bottom: 1px solid rgba(0, 0, 0, 0.1);
	}
	th {
		font-weight: normal;
	}
</style>
