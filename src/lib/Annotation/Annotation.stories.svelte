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

	/** Storybook's toolbar sets this global; the same value ends up on <html data-scheme>. */
	const isDark = (context: { globals: Record<string, unknown> }) => context.globals.scheme === 'dark';

	/** Filled annotations have no scheme-aware defaults, so the dark scheme gets the Figma dark set. */
	const withSchemeColours = (args: Record<string, unknown>, dark: boolean) =>
		dark ? { fill: black, color: white, stroke: black, ...args } : args;

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

	const multilineText = 'A longer annotation that wraps onto several lines';
	const multilineWidth = 140;

	const px = (value: number | string | undefined) =>
		typeof value === 'number' ? `${value}px` : (value ?? '0px');

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
			maxWidth: undefined,
			gooey: false
		},
		// x / y are only meaningful in the "Placed" stories, which switch the controls back on.
		parameters: { controls: { exclude: ['x', 'y'] } },
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
			x: {
				control: 'number',
				description:
					"Pins the anchor point this many px from the left of the nearest positioned ancestor (or any CSS length as a string). Leave `x` and `y` unset to use the parent's origin."
			},
			y: {
				control: 'number',
				description:
					'Pins the anchor point this many px from the top of the nearest positioned ancestor.'
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
			color: {
				control: 'color',
				description:
					'Text colour. Overrides --annotation-text (or --annotation-outline-text for `outline`) for this instance.'
			},
			maxWidth: {
				control: { type: 'number', min: 40, step: 10 },
				description:
					'Turns on the multiline version: text wraps and the label is never wider than this many px (padding included for `filled`). Leave empty for a single line.'
			},
			gooey: {
				control: 'boolean',
				description:
					'Replaces the solid rectangle with a gooey background that hugs each line of wrapped text. Filled only. Needs `maxWidth` to wrap onto several lines.'
			},
			bold: { control: 'boolean' },
			children: { control: false },
			class: { control: false },
			style: { control: false }
		}
	});
</script>

{#snippet playground(args, dark: boolean)}
	<div class="stage" class:split={args.variant === 'outline'}>
		<!-- Zero-size spot at the stage centre; the story places the annotation here -->
		<div class="point">
			<span class="marker">
				<Icon name="circle" variant="filled" width={12} colour={dark ? darkRed : red} scheme={dark ? 'dark' : 'light'} />
			</span>
			<Annotation {...withSchemeColours(args, dark)} />
		</div>
	</div>
{/snippet}

{#snippet placed(args, dark: boolean)}
	<div class="stage" class:split={args.variant === 'outline'}>
		<!-- No point wrapper: x / y place the annotation against the stage -->
		<span class="marker" style="left:{px(args.x)};top:{px(args.y)}">
			<Icon name="circle" variant="filled" width={12} colour={dark ? darkRed : red} scheme={dark ? 'dark' : 'light'} />
		</span>
		<Annotation {...withSchemeColours(args, dark)} />
	</div>
{/snippet}

{#snippet anchorGrid(args, dark: boolean)}
	<div class="surface">
		<div class="grid">
			{#each anchors as anchor (anchor)}
				<div class="cell">
					<code class="cell-label">{anchor}</code>
					<div class="point">
						<Annotation {...withSchemeColours(args, dark)} {anchor} offset={8} />
						<span class="marker">
							<Icon
								name="circle"
								variant="filled"
								width={8}
								colour={dark ? darkRed : red}
								scheme={dark ? 'dark' : 'light'}
							/>
						</span>
					</div>
				</div>
			{/each}
		</div>
	</div>
{/snippet}

{#snippet colours(args, rows: { fill: string; text: string }[], dark: boolean)}
	<div class="surface">
		<table>
			<thead>
				<tr>
					<th scope="col">Fill</th>
					<th scope="col">Text</th>
					<th scope="col">Regular</th>
					<th scope="col">Bold</th>
					<th scope="col">Outline</th>
					<th scope="col">Outline Bold</th>
					<th scope="col">Multiline</th>
					<th scope="col">Multiline Outline</th>
					<th scope="col">Gooey</th>
				</tr>
			</thead>
			<tbody>
				{#each rows as { fill, text } (fill + text)}
					{@const hideOutline = (dark && text === '#000000') || (!dark && text === '#FFFFFF')}
					<tr>
						<td><code>{name(fill)}</code></td>
						<td><code>{name(text)}</code></td>
						<td>
							<Annotation text={args.text} pointer={args.pointer} {fill} color={text} />
						</td>
						<td>
							<Annotation text={args.text} pointer={args.pointer} {fill} color={text} bold />
						</td>
						{#if hideOutline}
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
						<td>
							<Annotation
								text={multilineText}
								maxWidth={multilineWidth}
								pointer={args.pointer}
								{fill}
								color={text}
							/>
						</td>
						<td>
							{#if !hideOutline}
								<Annotation
									text={multilineText}
									maxWidth={multilineWidth}
									pointer={args.pointer}
									{fill}
									color={text}
									variant="outline"
								/>
							{/if}
						</td>
						<td>
							<Annotation
								text={multilineText}
								maxWidth={multilineWidth}
								pointer={args.pointer}
								{fill}
								color={text}
								gooey
							/>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/snippet}

{#snippet outlineOverrides(args, dark: boolean)}
	<div class="stage split">
		<div class="row" style="top: 40px">
			<Annotation variant="outline" text="Default" anchor="center" />
		</div>
		<div class="row" style="top: 90px">
			<Annotation
				variant="outline"
				text="Props: blue text, red border"
				anchor="center"
				color={dark ? darkBlue : blue}
				stroke={dark ? darkRed : red}
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
	{#snippet template(args, context)}
		{@render playground(args, isDark(context))}
	{/snippet}
</Story>

<Story name="Outline" args={{ variant: 'outline' }}>
	{#snippet template(args, context)}
		{@render playground(args, isDark(context))}
	{/snippet}
</Story>

<Story
	name="Multiline"
	args={{ text: multilineText, maxWidth: multilineWidth, anchor: 'bottom-left' }}
>
	{#snippet template(args, context)}
		{@render playground(args, isDark(context))}
	{/snippet}
</Story>

<Story
	name="Multiline outline"
	args={{ text: multilineText, maxWidth: multilineWidth, variant: 'outline' }}
>
	{#snippet template(args, context)}
		{@render playground(args, isDark(context))}
	{/snippet}
</Story>

<Story
	name="Gooey"
	args={{ text: multilineText, maxWidth: multilineWidth, gooey: true, anchor: 'bottom-left' }}
>
	{#snippet template(args, context)}
		{@render playground(args, isDark(context))}
	{/snippet}
</Story>

<Story name="Anchors" parameters={{ controls: { include: ['text', 'variant', 'pointer', 'bold'] } }}>
	{#snippet template(args, context)}
		{@render anchorGrid(args, isDark(context))}
	{/snippet}
</Story>

<Story
	name="Placed"
	args={{ x: 120, y: 90, anchor: 'bottom-left' }}
	parameters={{ controls: { exclude: [] } }}
>
	{#snippet template(args, context)}
		{@render placed(args, isDark(context))}
	{/snippet}
</Story>

<Story name="Outline overrides" parameters={{ controls: { disable: true } }}>
	{#snippet template(args, context)}
		{@render outlineOverrides(args, isDark(context))}
	{/snippet}
</Story>

<Story name="Colours" parameters={{ controls: { include: ['text', 'pointer'] } }}>
	{#snippet template(args, context)}
		{@render colours(args, isDark(context) ? darkCombos : combos, isDark(context))}
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
	:global([data-scheme='dark']) .stage {
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
	.grid {
		display: grid;
		grid-template-columns: repeat(3, 160px);
		gap: 12px;
	}
	.cell {
		position: relative;
		height: 110px;
		background: rgba(255, 255, 255, 0.35);
	}
	:global([data-scheme='dark']) .surface .cell {
		background: rgba(255, 255, 255, 0.06);
	}
	.cell .point {
		left: 80px;
		top: 55px;
	}
	.cell-label {
		position: absolute;
		left: 6px;
		top: 4px;
		font-size: 11px;
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
	:global([data-scheme='dark']) .surface {
		background: #161c1e;
		color: #e8eef0;
	}
	:global([data-scheme='dark']) .surface th,
	:global([data-scheme='dark']) .surface td {
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
