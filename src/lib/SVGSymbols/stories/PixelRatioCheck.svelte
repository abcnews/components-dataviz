<script lang="ts">
	import type { Attachment } from 'svelte/attachments';
	import Symbol from '../Symbol.svelte';
	import { getSymbol, type SymbolName } from '../getSymbol.js';

	interface Props {
		/** Symbol to test. */
		name: SymbolName;
		/** Any CSS colour or hex code. */
		colour: string;
		/** Light or dark outline. */
		scheme: 'light' | 'dark';
	}

	let { name, colour, scheme }: Props = $props();

	const WIDTHS = [8, 10, 12, 16, 19, 23, 30, 40];
	const PIXEL_RATIOS = [1, 2, 3, 4];
	const VARIANTS = ['stroke', 'fill'] as const;

	/** Magnification, so the strokes can be inspected pixel by pixel. */
	let zoom = $state(1);

	/**
	 * Rasterise the SVG into a canvas, as `map.addImage` would receive it. The canvas is a real
	 * bitmap, so scaling it back down with a CSS transform shows what the map would draw.
	 */
	const rasterise =
		(svg: string, size: number): Attachment<HTMLCanvasElement> =>
		(canvas) => {
			const image = new Image();
			image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
			image
				.decode()
				.then(() => canvas.getContext('2d')?.drawImage(image, 0, 0, size, size))
				.catch((error) => console.error(JSON.stringify({ rasteriseFailed: String(error), size })));
		};
</script>

<label>
	Zoom
	<input type="range" min="1" max="8" step="1" bind:value={zoom} />
	{zoom}×
</label>

<p>
	Each canvas is drawn at <code>width × pixelRatio</code> pixels, then scaled back to
	<code>width</code> CSS pixels with <code>transform: scale(1 / pixelRatio)</code>. The strokes
	should look the same weight in every column. Turn the zoom up to compare the pixels.
</p>

{#each VARIANTS as variant (variant)}
	<table>
		<caption>{variant}</caption>
		<thead>
			<tr>
				<th scope="col">width</th>
				<th scope="col">vector</th>
				{#each PIXEL_RATIOS as pixelRatio (pixelRatio)}
					<th scope="col">pixelRatio {pixelRatio}</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each WIDTHS as width (width)}
				<tr>
					<th scope="row">{width}px</th>
					<td>
						<div class="cell" style:width="{width * zoom}px" style:height="{width * zoom}px">
							<div class="scaled" style:transform="scale({zoom})">
								<Symbol {name} {variant} {colour} {scheme} {width} />
							</div>
						</div>
					</td>
					{#each PIXEL_RATIOS as pixelRatio (pixelRatio)}
						{@const size = Math.round(width * pixelRatio)}
						<td>
							<div class="cell" style:width="{width * zoom}px" style:height="{width * zoom}px">
								<canvas
									class="scaled"
									class:pixelated={zoom > 1}
									width={size}
									height={size}
									style:transform="scale({zoom / pixelRatio})"
									{@attach rasterise(getSymbol({ name, variant, width, scheme, colour, pixelRatio }), size)}
								></canvas>
							</div>
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
{/each}

<style>
	table {
		border-collapse: collapse;
		margin-bottom: 1.5rem;
	}
	th,
	td {
		padding: 0.5rem 0.75rem;
		text-align: left;
		vertical-align: middle;
	}
	.cell {
		position: relative;
	}
	.scaled {
		display: block;
		transform-origin: 0 0;
	}
	.pixelated {
		image-rendering: pixelated;
	}
</style>
