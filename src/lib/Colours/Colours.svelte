<script lang="ts">
	import type { Snippet } from 'svelte';
	import { colourVariables, type Scheme } from './colours.js';

	interface Props {
		/** Which palette to define as CSS variables. */
		scheme?: Scheme;
		children?: Snippet;
		/** The wrapper element, so a parent can look up the tree from it. */
		element?: HTMLDivElement;
	}

	let { scheme = 'light', children, element = $bindable() }: Props = $props();

	// display: contents keeps the wrapper out of layout; the variables still inherit.
	const style = $derived(`display: contents; ${colourVariables(scheme)}`);
</script>

<div bind:this={element} {style} data-theme={scheme}>
	{@render children?.()}
</div>
