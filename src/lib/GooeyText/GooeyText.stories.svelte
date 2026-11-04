<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import GooeyText from './GooeyText.svelte';

	const pointers = ['top-left', 'bottom-left', 'top-right', 'bottom-right', 'none'];

	const sample = 'A longer annotation that wraps onto several lines of different lengths';

	/** Storybook's toolbar sets this global; the same value ends up on <html data-scheme>. */
	const isDark = (context: { globals: Record<string, unknown> }) => context.globals.scheme === 'dark';

	/** GooeyText has no scheme-aware fill, so dark gets a black fill unless the `fill` control is set. */
	const withSchemeFill = (args: Record<string, unknown>, dark: boolean) =>
		dark ? { fill: '#000000', ...args } : args;

	const { Story } = defineMeta({
		title: 'Components/GooeyText',
		component: GooeyText,
		tags: ['autodocs'],
		args: {
			text: sample,
			maxWidth: 180,
			pointer: 'bottom-left',
			radius: 8
		},
		argTypes: {
			text: { control: 'text' },
			maxWidth: {
				control: { type: 'number', min: 40, step: 10 },
				description:
					'Maximum width in px, padding included. Lets the text wrap onto several lines. Leave empty for a single line.'
			},
			pointer: {
				control: 'select',
				options: pointers,
				description:
					'Which corner is squared off. The left corners are corners of the whole shape; the right ones are the end of the first / last line.'
			},
			radius: {
				control: { type: 'range', min: 0, max: 16, step: 1 },
				description:
					'Radius in px of the outside corners, including the ends of lines that stick out past their neighbours. Inside corners where lines meet are always square. Overrides --gooey-radius. Reduced where the shape is too small to fit it.'
			},
			fill: {
				control: 'color',
				description: 'Background colour. Overrides --gooey-fill. Use an opaque colour.'
			},
			children: { control: false },
			class: { control: false },
			style: { control: false }
		}
	});
</script>

{#snippet stage(args, dark: boolean)}
	<div class="stage">
		<GooeyText {...withSchemeFill(args, dark)} />
	</div>
{/snippet}

<Story name="Playground">
	{#snippet template(args, context)}
		{@render stage(args, isDark(context))}
	{/snippet}
</Story>

<Story
	name="Pointers"
	parameters={{ controls: { include: ['text', 'maxWidth', 'radius', 'fill'] } }}
>
	{#snippet template(args, context)}
		<div class="stage grid">
			{#each pointers as pointer (pointer)}
				<figure>
					<GooeyText {...withSchemeFill(args, isDark(context))} {pointer} />
					<figcaption><code>{pointer}</code></figcaption>
				</figure>
			{/each}
		</div>
	{/snippet}
</Story>

<Story name="Single line" args={{ text: 'One line, no maxWidth', maxWidth: undefined }}>
	{#snippet template(args, context)}
		{@render stage(args, isDark(context))}
	{/snippet}
</Story>

<style>
	.stage {
		display: flex;
		flex-wrap: wrap;
		gap: 24px;
		padding: 24px;
		background: #c8d6ea;
		color: #000;
		font-family: 'ABC Sans Nova', sans-serif;
		font-size: 14px;
		line-height: 120%;
		letter-spacing: 0.42px;
	}
	:global([data-scheme='dark']) .stage {
		background: #161c1e;
		color: #fff;
	}
	.grid {
		width: 640px;
	}
	figure {
		margin: 0;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 8px;
	}
	figcaption {
		font-size: 12px;
		opacity: 0.7;
	}
</style>
