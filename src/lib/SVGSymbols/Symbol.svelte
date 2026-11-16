<script lang="ts">
	import { getSymbol, type SymbolName } from './getSymbol.js';

	interface Props {
		name: SymbolName;
		variant?: 'fill' | 'stroke';
		width?: number;
		scheme?: 'light' | 'dark';
		colour?: string;
		label?: string;
		class?: string;
	}

	let {
		name,
		variant = 'fill',
		width = 16,
		scheme = 'light',
		colour,
		label,
		class: className
	}: Props = $props();

	// The artwork loads on demand, so this is a promise; the span keeps its place until it arrives.
	const svg = $derived(getSymbol({ name, variant, width, scheme, colour }));
</script>

<span
	class={className}
	role={label ? 'img' : undefined}
	aria-label={label}
	aria-hidden={label ? undefined : true}
>
	{#await svg then markup}
		{@html markup}
	{/await}
</span>

<style>
	span {
		display: inline-flex;
		line-height: 0;
	}
</style>
