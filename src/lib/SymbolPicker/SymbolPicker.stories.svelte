<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Demo from './stories/Demo.svelte';
	import SymbolPicker from './SymbolPicker.svelte';

	const { Story } = defineMeta({
		title: 'Icons/SymbolPicker',
		component: SymbolPicker,
		tags: ['autodocs']
	});
</script>

<Story name="Playground">
	<Demo />
</Story>
