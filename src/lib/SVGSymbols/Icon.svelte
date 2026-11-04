<script lang="ts">
	import { getSymbol } from './getSymbol.js';

	interface Props {
		name: string;
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

	const svg = $derived(getSymbol({ name, variant, width, scheme, colour }));
</script>

<span
	class={className}
	role={label ? 'img' : undefined}
	aria-label={label}
	aria-hidden={label ? undefined : true}
>
	{@html svg}
</span>

<style>
	span {
		display: inline-flex;
		line-height: 0;
	}
</style>
