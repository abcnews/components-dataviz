/**
 * src/icons/icons.ts
 *
 * Vite entry point. Imports every icon under ./svg at build time (as raw text)
 * and exposes the generator. Adding an icon is just adding files to
 * src/icons/svg/<name>/ — nothing here needs to change.
 *
 *   import { generateIcon } from './icons/icons.ts';
 *
 *   generateIcon({ name: 'doughnut', width: 32, variant: 'stroked' }); // -> "<svg …>"
 *   document.body.insertAdjacentHTML('beforeend', svg);
 *
 * Requires Vite 5+ (the `query: '?raw'` form of import.meta.glob).
 */

/// <reference types="vite/client" />

import { createIconGenerator } from './generator.ts';

const files = import.meta.glob<string>('./svg/*/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
});

export const { generateIcon, listIcons, listTiers } = createIconGenerator(files);
export type { IconRequest, IconStyle, TierInfo } from './generator.ts';
