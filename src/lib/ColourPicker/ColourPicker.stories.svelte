<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ColourPicker from './ColourPicker.svelte';

	const { Story } = defineMeta({
		title: 'Colours/ColourPicker',
		component: ColourPicker,
		tags: ['autodocs']
	});

	const customColours = { coral: '#ff7f50', mint: '#3eb489', plum: '#8e4585', sand: '#c2b280' };
</script>

<script lang="ts">
	let standardColour = $state('blue');
	let customColour = $state('mint');
</script>

<Story name="Standard colours">
	<ColourPicker bind:colour={standardColour} />
	<p>{standardColour}</p>
</Story>

<Story name="Custom colours">
	<ColourPicker bind:colour={customColour} colours={customColours} />
	<p>{customColour}</p>
</Story>
