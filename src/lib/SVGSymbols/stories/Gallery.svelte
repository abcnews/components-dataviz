<!-- Story helper: every icon, both variants, at one width. -->
<script lang="ts">
  import Symbol from '../Symbol.svelte';
  import { listIcons, listTiers, type IconStyle } from '../icons.ts';

  interface Props {
    width?: number;
  }

  let { width = 32 }: Props = $props();

  const variants: IconStyle[] = ['stroked', 'filled'];
  const names = listIcons();

  function has(name: string, variant: IconStyle): boolean {
    try {
      listTiers(name, variant);
      return true;
    } catch {
      return false;
    }
  }
</script>

<div class="grid">
  {#each names as name (name)}
    <div class="cell">
      <div class="pair">
        {#each variants as variant (variant)}
          {#if has(name, variant)}
            <Symbol {name} {width} {variant} label="{name} ({variant})" />
          {:else}
            <span class="missing" style:width="{width}px" title="No {variant} variant">–</span>
          {/if}
        {/each}
      </div>
      <code>{name}</code>
    </div>
  {/each}
</div>

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 16px;
  }
  .cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 16px 8px;
    border: 1px solid #e3e3e3;
    border-radius: 8px;
  }
  .pair {
    display: flex;
    gap: 16px;
    align-items: center;
    min-height: 40px;
  }
  .missing {
    text-align: center;
    color: #bbb;
    font: 14px system-ui, sans-serif;
  }
  code {
    font-size: 12px;
    color: #555;
  }
</style>
