<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Icon from './Icon.svelte';
	import { listIcons, listTiers, type IconStyle } from './icons.ts';

	const names = listIcons();
	const sizes = [8, 12, 16, 20, 32];
	const variants: IconStyle[] = ['stroked', 'filled'];

	const has = (name: string, variant: IconStyle) => {
		try {
			listTiers(name, variant);
			return true;
		} catch {
			return false;
		}
	};

	const { Story } = defineMeta({
		title: 'Icons/Icon',
		component: Icon,
		tags: ['autodocs'],
		args: { name: names[0] ?? '', width: 32, variant: 'stroked', color: '#1a1a1a' },
		argTypes: {
			name: { control: 'select', options: names },
			width: { control: { type: 'range', min: 4, max: 160, step: 1 } },
			variant: { control: 'inline-radio', options: variants },
			color: {
				control: 'color',
				description:
					'Passed to generateIcon(), which writes it into the SVG fill/stroke attributes. Works the same outside Svelte.'
			},
			label: { control: 'text' },
			class: { control: false }
		}
	});
</script>

<Story name="Playground" />

<Story name="All icons" parameters={{ controls: { include: ['color'] } }}>
	{#snippet template(args)}
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
									{#if has(name, variant)}
										<Icon
											{name}
											width={size}
											{variant}
											color={args.color}
											label="{name} {variant} {size}px"
										/>
									{/if}
								</td>
							{/each}
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
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
	.size {
		font-weight: normal;
	}
</style>
