<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Anchored from './Anchored.svelte';
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

	const red = '#E71D38';
	const darkRed = '#FF667B';

	/** Storybook's toolbar sets this global; the same value ends up on <html data-scheme>. */
	const isDark = (context: { globals: Record<string, unknown> }) => context.globals.scheme === 'dark';

	const px = (value: number | string | undefined) =>
		typeof value === 'number' ? `${value}px` : (value ?? '0px');

	const { Story } = defineMeta({
		title: 'Components/Anchored',
		component: Anchored,
		tags: ['autodocs'],
		args: {
			anchor: 'bottom-left',
			offset: 10
		},
		// x / y are only meaningful in the "Placed" stories, which switch the controls back on.
		parameters: { controls: { exclude: ['x', 'y'] } },
		argTypes: {
			anchor: {
				control: 'select',
				options: anchors,
				description:
					'The point on the content that sits on the target point. `center` straddles it; `bottom-right` ends the content exactly at it. With the default (`top-left`), no offset and no `x`/`y`, the wrapper adds nothing to the DOM.'
			},
			offset: {
				control: { type: 'range', min: 0, max: 48, step: 1 },
				description:
					'Pixels to push the content away from the anchor point, so it clears the symbol it points to. Ignored on a centred axis.'
			},
			x: {
				control: 'number',
				description:
					"Target point, from the left of the nearest positioned ancestor. Number = px, or any CSS length as a string. Setting `x` or `y` makes the wrapper absolutely positioned; leave both unset to use the parent's origin."
			},
			y: {
				control: 'number',
				description:
					'Target point, from the top of the nearest positioned ancestor. A missing `x` or `y` counts as 0.'
			},
			children: { control: false },
			class: { control: false },
			style: { control: false }
		}
	});
</script>

{#snippet playground(args, dark: boolean)}
	<div class="stage">
		<!-- Zero-size spot at the stage centre; the wrapper inherits it as its target point -->
		<div class="point">
			<Anchored {...args}>
				<div class="swatch">Content</div>
			</Anchored>
			<!-- After the content so the dot stays visible on top of it -->
			<span class="marker">
				<Icon name="circle" variant="filled" width={12} colour={dark ? darkRed : red} scheme={dark ? 'dark' : 'light'} />
			</span>
		</div>
	</div>
{/snippet}

{#snippet placed(args, dark: boolean)}
	<div class="stage">
		<!-- No point wrapper: x / y place the content against the stage -->
		<Anchored {...args}>
			<div class="swatch">Content</div>
		</Anchored>
		<span class="marker" style="left:{px(args.x)};top:{px(args.y)}">
			<Icon name="circle" variant="filled" width={12} colour={dark ? darkRed : red} scheme={dark ? 'dark' : 'light'} />
		</span>
	</div>
{/snippet}

{#snippet anchorGrid(dark: boolean)}
	<div class="surface">
		<div class="grid">
			{#each anchors as anchor (anchor)}
				<div class="cell">
					<code class="cell-label">{anchor}</code>
					<div class="point small">
						<Anchored {anchor} offset={8}>
							<div class="swatch small">Content</div>
						</Anchored>
						<span class="marker">
							<Icon name="circle" variant="filled" width={8} colour={dark ? darkRed : red} scheme={dark ? 'dark' : 'light'} />
						</span>
					</div>
				</div>
			{/each}
		</div>
	</div>
{/snippet}

<Story name="Playground">
	{#snippet template(args, context)}
		{@render playground(args, isDark(context))}
	{/snippet}
</Story>

<Story name="Anchors" parameters={{ controls: { disable: true } }}>
	{#snippet template(_args, context)}
		{@render anchorGrid(isDark(context))}
	{/snippet}
</Story>

<Story
	name="Placed"
	args={{ x: 120, y: 90, anchor: 'center', offset: 0 }}
	parameters={{ controls: { exclude: [] } }}
>
	{#snippet template(args, context)}
		{@render placed(args, isDark(context))}
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
	.swatch {
		box-sizing: border-box;
		width: 96px;
		height: 56px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 8px;
		background: #1e5aeb;
		color: #fff;
		font:
			14px/1 'ABC Sans Nova',
			sans-serif;
	}
	.swatch.small {
		width: 56px;
		height: 32px;
		border-radius: 4px;
		font-size: 11px;
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
	:global([data-scheme='dark']) .surface .cell {
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
</style>
