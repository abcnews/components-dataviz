<!--
  Story helper: renders each bespoke tier of an icon at the width where it is
  unscaled (listTiers().width). Useful for checking the source artwork.
-->
<script lang="ts">
  import Symbol from '../Symbol.svelte';
  import { listTiers, type IconStyle } from '../icons.ts';

  interface Props {
    name: string;
    variant?: IconStyle;
  }

  let { name, variant = 'stroked' }: Props = $props();

  const result = $derived.by(() => {
    try {
      return { tiers: listTiers(name, variant), error: null };
    } catch (err) {
      return { tiers: [], error: err instanceof Error ? err.message : String(err) };
    }
  });
</script>

{#if result.error}
  <p class="error">{result.error}</p>
{:else}
  <div class="tiers">
    {#each result.tiers as t (t.tier)}
      <figure>
        <Symbol {name} width={t.width} {variant} label="{name} tier {t.tier}" />
        <figcaption>
          tier {t.tier}<br />
          {Math.round(t.width * 1000) / 1000}px
        </figcaption>
      </figure>
    {/each}
  </div>
{/if}

<style>
  .tiers {
    display: flex;
    align-items: flex-end;
    flex-wrap: wrap;
    gap: 32px;
  }
  figure {
    margin: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
  figcaption {
    font: 12px/1.4 system-ui, sans-serif;
    color: #666;
    text-align: center;
  }
  .error {
    font: 14px system-ui, sans-serif;
    color: #b00020;
  }
</style>
