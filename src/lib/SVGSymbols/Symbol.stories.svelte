<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Symbol from './Symbol.svelte';
	import { SYMBOL_NAMES } from './getSymbol.js';

	const names = SYMBOL_NAMES;
	const sizes = [8, 12, 16, 20, 32];
	const variants = ['stroke', 'fill'] as const;

	const { Story } = defineMeta({
		title: 'Symbols/Symbol',
		component: Symbol,
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

{#snippet symbolTable(colour: string | undefined, scheme: 'light' | 'dark')}
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
								<Symbol
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

<Story name="All symbols" parameters={{ controls: { include: ['colour'] } }}>
	{#snippet template(args, context)}
		{@render symbolTable(args.colour, context.globals.scheme === 'dark' ? 'dark' : 'light')}
	{/snippet}
</Story>

<style>
	table {
		border-collapse: collapse;
	}
	th,
	td {
		padding: 8px 12px;
		text-align: center;
		border-bottom: 1px solid #eee;
	}
	:global([data-scheme='dark']) :is(th, td) {
		border-bottom-color: #2a3336;
	}
	th[scope='row'] {
		text-align: left;
	}
	.size {
		font-weight: normal;
	}
</style>
