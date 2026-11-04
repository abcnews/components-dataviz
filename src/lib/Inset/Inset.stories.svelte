<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Inset from './Inset.svelte';
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
	const px = (value: number | string | undefined) =>
		typeof value === 'number' ? `${value}px` : (value ?? '0px');

	const images = [
		'https://live-production.wcms.abc-cdn.net.au/468fc76d61b45f7f6bc14b29eca23772?impolicy=wcms_crop_resize&cropH=3333&cropW=5000&xPos=0&yPos=0&width=862&height=575',
		'https://live-production.wcms.abc-cdn.net.au/29e8047482359a707f5daf9385d900f5?impolicy=wcms_crop_resize&cropH=720&cropW=1280&xPos=0&yPos=120&width=862&height=485',
		'https://live-production.wcms.abc-cdn.net.au/cfdc087172e1a2279617bf757a4b273e?impolicy=wcms_crop_resize&cropH=3942&cropW=7008&xPos=0&yPos=365&width=862&height=485'
	];

	// Sizes that hit each radius step: 4px, 8px, 12px.
	const sizes = [32, 40, 48, 50, 64, 72, 96, 128];

	const red = '#E71D38';
	const darkRed = '#FF667B';

	const { Story } = defineMeta({
		title: 'Components/Inset',
		component: Inset,
		tags: ['autodocs'],
		args: {
			src: images[0],
			alt: '',
			size: 96,
			shape: 'circle',
			position: 'center',
			fit: 'cover',
			loading: 'eager'
		},
		// x / y are only meaningful in the "Placed" stories, which switch the controls back on.
		parameters: { controls: { exclude: ['x', 'y'] } },
		argTypes: {
			src: { control: 'text' },
			alt: {
				control: 'text',
				description: 'Alt text. Leave empty for decorative images.'
			},
			size: {
				control: { type: 'range', min: 24, max: 200, step: 1 },
				description:
					'Width and height in px (or any CSS length as a string). The corner radius of `rounded` follows it: <=40px 4px, <=50px 8px, >=72px 12px.'
			},
			shape: {
				control: 'inline-radio',
				options: ['circle', 'rounded'],
				description:
					'`circle` uses border-radius 100vw. `rounded` is a square with a size-based radius.'
			},
			colour: {
				control: 'color',
				description:
					'Border colour. Overrides --image-border-colour and the default (white in light mode, black in dark mode). The border is always 1px.'
			},
			position: {
				control: 'text',
				description: 'CSS object-position, to choose which part of the image stays in frame.'
			},
			fit: { control: 'inline-radio', options: ['cover', 'contain'] },
			loading: { control: 'inline-radio', options: ['lazy', 'eager'] },
			anchor: {
				control: 'select',
				options: anchors,
				description:
					'The point on the inset that sits on the spot where it is placed. Unset = not anchored. Needs a fixed `size`, not a percentage.'
			},
			offset: {
				control: { type: 'range', min: 0, max: 48, step: 1 },
				description:
					'Pixels to push the inset away from the anchor point, so it clears the symbol it points to. Ignored for `center`.'
			},
			x: {
				control: 'number',
				description:
					'Pins the anchor point this many px from the left of the nearest positioned ancestor (or any CSS length as a string).'
			},
			y: {
				control: 'number',
				description:
					'Pins the anchor point this many px from the top of the nearest positioned ancestor.'
			},
			class: { control: false },
			style: { control: false }
		}
	});
</script>

{#snippet playground(args, dark: boolean)}
	<div class="stage" class:dark>
		<Inset {...args} />
	</div>
{/snippet}

{#snippet anchoredPlayground(args, dark: boolean)}
	<div class="stage pinned" class:dark>
		<!-- Zero-size spot at the stage centre; the inset is anchored to it -->
		<div class="point">
			<Inset {...args} />
			<!-- After the inset so the dot stays visible on top of it -->
			<span class="marker">
				<Icon name="circle" variant="filled" width={12} color={dark ? darkRed : red} {dark} />
			</span>
		</div>
	</div>
{/snippet}

{#snippet placedPlayground(args, dark: boolean)}
	<div class="stage pinned" class:dark>
		<!-- No point wrapper: x / y place the inset against the stage -->
		<Inset {...args} />
		<span class="marker" style="left:{px(args.x)};top:{px(args.y)}">
			<Icon name="circle" variant="filled" width={12} color={dark ? darkRed : red} {dark} />
		</span>
	</div>
{/snippet}

{#snippet anchorGrid(dark: boolean)}
	<div class="surface" class:dark>
		<div class="grid">
			{#each anchors as anchor (anchor)}
				<div class="cell">
					<code class="cell-label">{anchor}</code>
					<div class="point">
						<Inset src={images[0]} size={40} {anchor} offset={8} loading="eager" />
						<span class="marker">
							<Icon name="circle" variant="filled" width={8} color={dark ? darkRed : red} {dark} />
						</span>
					</div>
				</div>
			{/each}
		</div>
	</div>
{/snippet}

{#snippet sizeTable(dark: boolean)}
	<div class="surface" class:dark>
		<table>
			<thead>
				<tr>
					<th scope="col">Size</th>
					<th scope="col">Circle</th>
					<th scope="col">Rounded</th>
				</tr>
			</thead>
			<tbody>
				{#each sizes as size (size)}
					<tr>
						<td><code>{size}px</code></td>
						<td><Inset src={images[size % 3]} {size} shape="circle" loading="eager" /></td>
						<td><Inset src={images[size % 3]} {size} shape="rounded" loading="eager" /></td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/snippet}

{#snippet examples(dark: boolean)}
	<div class="surface" class:dark>
		<div class="row">
			{#each images as src, i (src)}
				<Inset {src} size={96} shape={i === 1 ? 'rounded' : 'circle'} loading="eager" />
			{/each}
		</div>
	</div>
{/snippet}

{#snippet borderOverrides(dark: boolean)}
	<div class="surface" class:dark>
		<table>
			<tbody>
				<tr>
					<td><code>Default</code></td>
					<td>
						<Inset src={images[0]} size={72} loading="eager" />
						<Inset src={images[0]} size={72} shape="rounded" loading="eager" />
					</td>
				</tr>
				<tr>
					<td><code>colour prop</code></td>
					<td>
						<Inset src={images[1]} size={72} colour={dark ? darkRed : red} loading="eager" />
						<Inset
							src={images[1]}
							size={72}
							shape="rounded"
							colour={dark ? darkRed : red}
							loading="eager"
						/>
					</td>
				</tr>
				<tr>
					<td><code>--image-border-colour</code></td>
					<td style="--image-border-colour: {dark ? darkRed : red}">
						<Inset src={images[2]} size={72} loading="eager" />
						<Inset src={images[2]} size={72} shape="rounded" loading="eager" />
					</td>
				</tr>
				<tr>
					<td><code>--image-radius</code></td>
					<td style="--image-radius: 24px">
						<Inset src={images[0]} size={72} shape="rounded" loading="eager" />
						<Inset src={images[0]} size={96} shape="rounded" loading="eager" />
					</td>
				</tr>
			</tbody>
		</table>
	</div>
{/snippet}

<Story name="Playground" parameters={{ controls: { exclude: ['anchor', 'offset', 'x', 'y'] } }}>
	{#snippet template(args)}
		{@render playground(args, false)}
	{/snippet}
</Story>

<Story
	name="Playground (dark)"
	parameters={{
		controls: { exclude: ['anchor', 'offset', 'x', 'y'] },
		backgrounds: { default: 'dark' }
	}}
>
	{#snippet template(args)}
		{@render playground(args, true)}
	{/snippet}
</Story>

<Story
	name="Rounded"
	args={{ shape: 'rounded', src: images[1] }}
	parameters={{ controls: { exclude: ['anchor', 'offset', 'x', 'y'] } }}
>
	{#snippet template(args)}
		{@render playground(args, false)}
	{/snippet}
</Story>

<Story
	name="Rounded (dark)"
	args={{ shape: 'rounded', src: images[1] }}
	parameters={{
		controls: { exclude: ['anchor', 'offset', 'x', 'y'] },
		backgrounds: { default: 'dark' }
	}}
>
	{#snippet template(args)}
		{@render playground(args, true)}
	{/snippet}
</Story>

<Story name="Anchored" args={{ anchor: 'bottom-left', offset: 10 }}>
	{#snippet template(args)}
		{@render anchoredPlayground(args, false)}
	{/snippet}
</Story>

<Story
	name="Anchored (dark)"
	args={{ anchor: 'bottom-left', offset: 10 }}
	parameters={{ backgrounds: { default: 'dark' } }}
>
	{#snippet template(args)}
		{@render anchoredPlayground(args, true)}
	{/snippet}
</Story>

<Story name="Anchors" parameters={{ controls: { disable: true } }}>
	{#snippet template()}
		{@render anchorGrid(false)}
	{/snippet}
</Story>

<Story
	name="Anchors (dark)"
	parameters={{ controls: { disable: true }, backgrounds: { default: 'dark' } }}
>
	{#snippet template()}
		{@render anchorGrid(true)}
	{/snippet}
</Story>

<Story
	name="Placed"
	args={{ x: 120, y: 90, anchor: 'center', offset: 0 }}
	parameters={{ controls: { exclude: [] } }}
>
	{#snippet template(args)}
		{@render placedPlayground(args, false)}
	{/snippet}
</Story>

<Story
	name="Placed (dark)"
	args={{ x: 120, y: 90, anchor: 'center', offset: 0 }}
	parameters={{ controls: { exclude: [] }, backgrounds: { default: 'dark' } }}
>
	{#snippet template(args)}
		{@render placedPlayground(args, true)}
	{/snippet}
</Story>

<Story name="Examples" parameters={{ controls: { disable: true } }}>
	{#snippet template()}
		{@render examples(false)}
	{/snippet}
</Story>

<Story
	name="Examples (dark)"
	parameters={{ controls: { disable: true }, backgrounds: { default: 'dark' } }}
>
	{#snippet template()}
		{@render examples(true)}
	{/snippet}
</Story>

<Story name="Sizes" parameters={{ controls: { disable: true } }}>
	{#snippet template()}
		{@render sizeTable(false)}
	{/snippet}
</Story>

<Story
	name="Sizes (dark)"
	parameters={{ controls: { disable: true }, backgrounds: { default: 'dark' } }}
>
	{#snippet template()}
		{@render sizeTable(true)}
	{/snippet}
</Story>

<Story name="Border colour" parameters={{ controls: { disable: true } }}>
	{#snippet template()}
		{@render borderOverrides(false)}
	{/snippet}
</Story>

<Story
	name="Border colour (dark)"
	parameters={{ controls: { disable: true }, backgrounds: { default: 'dark' } }}
>
	{#snippet template()}
		{@render borderOverrides(true)}
	{/snippet}
</Story>

<style>
	.stage {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 400px;
		height: 240px;
		background: #c8d6ea;
	}
	.stage.dark {
		background: #161c1e;
	}
	/* Anchored stories: a positioned box, not a centring flex container. */
	.stage.pinned {
		display: block;
		position: relative;
		overflow: hidden;
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
		grid-template-columns: repeat(3, 140px);
		gap: 12px;
	}
	.cell {
		position: relative;
		height: 110px;
		background: rgba(255, 255, 255, 0.35);
	}
	.surface.dark .cell {
		background: rgba(255, 255, 255, 0.06);
	}
	.cell .point {
		left: 70px;
		top: 55px;
	}
	.cell-label {
		position: absolute;
		left: 6px;
		top: 4px;
		font-size: 11px;
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
	.row {
		display: flex;
		gap: 16px;
		align-items: center;
	}
	table {
		border-collapse: collapse;
	}
	th,
	td {
		padding: 10px 16px;
		text-align: left;
		vertical-align: middle;
		border-bottom: 1px solid rgba(0, 0, 0, 0.1);
	}
	td :global(.image + .image) {
		margin-left: 12px;
	}
	th {
		font-weight: normal;
	}
</style>
