<script lang="ts">
	import type { SymbolName } from '../../SVGSymbols/getSymbol.js';
	import SymbolPicker from '../SymbolPicker.svelte';

	let name = $state<SymbolName>('square');
	let variant = $state<'fill' | 'stroke'>('fill');
	let colour = $state('blue');
</script>

<!-- scheme defaults to 'auto', which follows the Storybook toolbar through data-theme. -->
<SymbolPicker bind:name bind:variant bind:colour showSchemeToggle />
