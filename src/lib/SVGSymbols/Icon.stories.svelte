<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Icon from './Icon.svelte';
	import { SYMBOL_NAMES } from './getSymbol.js';

	const names = SYMBOL_NAMES;
	const sizes = [8, 12, 16, 20, 32];
	const variants = ['stroke', 'fill'] as const;

	const { Story } = defineMeta({
		title: 'Icons/Icon',
		component: Icon,
		tags: ['autodocs'],
		args: {
			name: 'square',
			width: 32,
			variant: 'stroke',
			colour: '#1E5AEB',
			scheme: 'light'
		},
		argTypes: {
			name: { control: 'select', options: names },
			width: { control: { type: 'range', min: 4, max: 160, step: 1 } },
			variant: { control: 'inline-radio', options: variants },
			colour: {
				control: 'color',
				description:
					'Any CSS colour or hex code. Passed to getSymbol(), which swaps it into the SVG. Works the same outside Svelte.'
			},
			scheme: {
				control: 'inline-radio',
				options: ['light', 'dark'],
				description: 'Light draws the outline in white, dark draws it in black.'
			},
			label: { control: 'text' },
			class: { control: false }
		}
	});
</script>

<Story name="Playground" />

{#snippet iconTable(colour: string | undefined, scheme: 'light' | 'dark')}
	<table>
		<thead>
			<tr>
				<th></th>
				{#each variants as variant}
					<th colspan={sizes.length}>{variant}</th>
				{/each}
			</tr>
			<tr>
				<th></th>
				{#each variants as variant}
					{#each sizes as size}
						<th class="size">{size}</th>
					{/each}
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each names as name (name)}
				<tr>
					<th scope="row"><code>{name}</code></th>
					{#each variants as variant}
						{#each sizes as size}
							<td>
								<Icon
									{name}
									width={size}
									{variant}
									{colour}
									{scheme}
									label="{name} {variant} {size}px"
								/>
							</td>
						{/each}
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
{/snippet}

<Story name="All icons" parameters={{ controls: { include: ['colour'] } }}>
	{#snippet template(args)}
		{@render iconTable(args.colour, 'light')}
	{/snippet}
</Story>

<Story name="Dark mode" parameters={{ controls: { include: ['colour'] } }}>
	{#snippet template(args)}
		<div class="dark-surface">
			{@render iconTable(args.colour, 'dark')}
		</div>
	{/snippet}
</Story>

<style>
	:global(body) {
		background: #c8d6ea;
	}
	table {
		border-collapse: collapse;
	}
	th,
	td {
		padding: 8px 12px;
		text-align: center;
		border-bottom: 1px solid #eee;
	}
	th[scope='row'] {
		text-align: left;
	}
	.dark-surface {
		background: #161c1e;
		color: #e8eef0;
		padding: 16px;
	}
	.dark-surface th,
	.dark-surface td {
		border-bottom-color: #2a3336;
	}
	.size {
		font-weight: normal;
	}
</style>
