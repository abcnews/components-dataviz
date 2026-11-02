<!-- Story helper: renders one icon across a range of widths to show tier switching. -->
<script lang="ts">
  import Icon from '../Icon.svelte';
  import type { IconStyle } from '../icons.ts';

  interface Props {
    name: string;
    variant?: IconStyle;
    widths?: number[];
  }

  let { name, variant = 'stroked', widths = [8, 12, 16, 20, 24, 32, 48, 64, 96] }: Props = $props();
</script>

<div class="ladder">
  {#each widths as w (w)}
    <figure>
      <Icon {name} width={w} {variant} label="{name} at {w}px" />
      <figcaption>{w}px</figcaption>
    </figure>
  {/each}
</div>

<style>
  .ladder {
    display: flex;
    align-items: flex-end;
    flex-wrap: wrap;
    gap: 24px;
  }
  figure {
    margin: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
  figcaption {
    font: 12px/1 system-ui, sans-serif;
    color: #666;
  }
</style>
