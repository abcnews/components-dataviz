# Svelte library

WIP future viz component library.

## Developing

```sh
npm run storybook
```

Everything inside `src/lib` is part of your library.

## Symbol SVGs

- The SVGs used by `Symbol` and `getSymbol` live in `public/symbols`, with the file names Figma exports.
- They are fetched at runtime from `HOSTED_SYMBOLS_BASE_URL` in `src/lib/SVGSymbols/getSymbol.ts`. Apps using the library need no set-up.
- Storybook loads them from the local `public/symbols` instead (the `__LOCAL_SYMBOLS__` define in `.storybook/main.ts`).
- After changing the artwork, upload `public/symbols` to `HOSTED_SYMBOLS_BASE_URL` before releasing.

## Publishing

To publish your library to [npm](https://www.npmjs.com):

```sh
npm run release
```
