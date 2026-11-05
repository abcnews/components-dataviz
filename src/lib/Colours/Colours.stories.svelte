<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Colours from './Colours.svelte';
	import { COLOUR_NAMES, colourVariableName, colours } from './colours.js';

	const { Story } = defineMeta({
		title: 'Icons/Colours',
		component: Colours,
		tags: ['autodocs']
	});
</script>

<!-- The scheme follows the Storybook toolbar's light/dark toggle (set up in .storybook/preview.ts). -->
<Story name="Palette">
	{#snippet template(_args, context)}
		{@const scheme = context.globals.scheme === 'dark' ? 'dark' : 'light'}
		<Colours {scheme}>
			<ul>
				{#each COLOUR_NAMES as name (name)}
					<li>
						<span style:background="var({colourVariableName(name)})"></span>
						<code>{colourVariableName(name)}</code>
						{colours[scheme][name]}
					</li>
				{/each}
			</ul>
		</Colours>
	{/snippet}
</Story>

<style>
	ul {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	li {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	span {
		width: 1.5rem;
		height: 1.5rem;
	}
</style>
