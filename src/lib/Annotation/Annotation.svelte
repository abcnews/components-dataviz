<!--
  Annotation.svelte  (Svelte 5)

  A small label whose one square corner acts as an arrow, pointing at
  whatever it refers to. Has two variants: `filled` (default) and `outline`.

  The component does no absolute positioning. Place it (or a zero-size
  wrapper around it) at the point you want to annotate, and `anchor`
  decides which point of the label sits on that spot:

    <div style="position:absolute; left:100px; top:100px">
      <Annotation text="Peak" anchor="bottom-right" pointer="bottom-right" offset={8} />
    </div>

  Props
  -----
  text          string        Label text (or pass children instead).
  children      snippet       Label content, used instead of `text`.
  variant       'filled' | 'outline'
                              'filled'  is a padded label with a background.
                              'outline' has no background and no padding: just
                              text with a border drawn around the glyphs.
                              Light mode: black text, white border.
                              Dark mode:  white text, black border.
                              Default: 'filled'.
  anchor        'top-left' | 'top' | 'top-right'
                | 'left' | 'center' | 'right'
                | 'bottom-left' | 'bottom' | 'bottom-right'
                              Which point of the label sits on the spot where
                              the component is placed. Default: 'top-left'
                              (no shift).
  offset        number        Pixels to push the label away from the anchor
                              point, along the direction it already extends
                              (so it clears the symbol it points to). Applies
                              to edge and corner anchors; ignored for
                              'center'. Default: 0.
  pointer       'top-left' | 'top-right' | 'bottom-right' | 'bottom-left' | 'none'
                              Which corner is squared off to act as the arrow.
                              Filled variant only. Default: 'bottom-left'.
  fill          string        Background colour (overrides --annotation-fill).
                              Filled variant only.
  stroke        string        Outline colour (overrides --annotation-stroke, or
                              --annotation-outline-stroke for the outline variant).
  strokeWidth   number|string Outline width. Numbers are px. (overrides
                              --annotation-stroke-width, or
                              --annotation-outline-stroke-width for the outline
                              variant).
  color         string        Text colour (overrides --annotation-text, or
                              --annotation-outline-text for the outline variant).
  bold          boolean       Sets font-weight to 700 (overrides
                              --annotation-font-weight). Default: false.
  class, style                Passed through to the root element.

  Anchoring is done with a transform, so it never affects layout and the
  label can't be pushed past its anchor, whatever its size.

  CSS variables (set on :root, or any ancestor, to restyle globally)
  ------------------------------------------------------------------
  Both variants
  --annotation-font-family           default "ABC Sans Nova", sans-serif
  --annotation-font-size             default 14px
  --annotation-font-weight           default 400
  --annotation-letter-spacing        default 0.42px

  Filled variant
  --annotation-fill                  Background.                  default #fff
  --annotation-stroke                Outline colour.              default transparent
  --annotation-stroke-width          Outline width.               default 1px
  --annotation-text                  Text colour.                 default #000
  --annotation-radius                Rounded corner radius.       default 8px
  --annotation-pointer-radius        Radius of the arrow corner.  default 0
  --annotation-padding               Inner padding.               default 6px 8px

  Outline variant
  --annotation-outline-text          Text colour.    default #000 (#fff in dark)
  --annotation-outline-stroke        Border colour.  default #fff (#000 in dark)
  --annotation-outline-stroke-width  Visible border width.           default 2px

  Props set the variables inline on the element, so they win over globals
  for that instance only. Unset props leave the global values untouched.

  Dark mode for the outline variant is switched on by a `.dark` class on any
  ancestor. To follow the OS setting instead, set the outline variables in a
  media query:

    @media (prefers-color-scheme: dark) {
      :root {
        --annotation-outline-text: #fff;
        --annotation-outline-stroke: #000;
      }
    }

  Note: in the filled variant the stroke is drawn with an inset box-shadow,
  so it follows the corner shapes (including the squared arrow corner) and
  never changes the label's size or position. In the outline variant the
  border is a text stroke painted underneath the glyph fill: the full stroke
  is doubled and the inner half is hidden, so the width you set is the width
  you see and the glyph shapes are never thinned.
-->
<script>
	let {
		text = '',
		children,
		variant = 'filled',
		anchor = 'top-left',
		offset = 0,
		pointer = 'bottom-left',
		fill,
		stroke,
		strokeWidth,
		color,
		bold = false,
		class: className = '',
		style = '',
		...rest
	} = $props();

	let isOutline = $derived(variant === 'outline');

	// Fraction of the label's width/height that sits before the anchor point
	// (0 = start edge, 0.5 = middle, 1 = end edge).
	function getAnchorFractions(anchorName) {
		const fractionsByAnchor = {
			'top-left': [0, 0],
			top: [0.5, 0],
			'top-right': [1, 0],
			left: [0, 0.5],
			center: [0.5, 0.5],
			right: [1, 0.5],
			'bottom-left': [0, 1],
			bottom: [0.5, 1],
			'bottom-right': [1, 1]
		};

		return fractionsByAnchor[anchorName] ?? fractionsByAnchor['top-left'];
	}

	function buildAnchorTransform(anchorName, offsetInPixels) {
		const [horizontalFraction, verticalFraction] = getAnchorFractions(anchorName);
		const isUnshifted = horizontalFraction === 0 && verticalFraction === 0 && !offsetInPixels;

		if (isUnshifted) return undefined;

		// Away from the anchor point: positive when the label extends forward,
		// negative when it extends backward, zero when it straddles the point.
		const pixelsAwayFromAnchor = (fraction) => (1 - 2 * fraction) * offsetInPixels;
		const horizontalShift = `${-horizontalFraction * 100}% + ${pixelsAwayFromAnchor(horizontalFraction)}px`;
		const verticalShift = `${-verticalFraction * 100}% + ${pixelsAwayFromAnchor(verticalFraction)}px`;

		return `transform:translate(calc(${horizontalShift}), calc(${verticalShift}))`;
	}

	function buildBorderRadius(pointerCorner) {
		// Order required by border-radius: top-left, top-right, bottom-right, bottom-left
		const cornersInOrder = ['top-left', 'top-right', 'bottom-right', 'bottom-left'];

		return cornersInOrder
			.map((corner) =>
				corner === pointerCorner
					? 'var(--annotation-pointer-radius, 0px)'
					: 'var(--annotation-radius, 8px)'
			)
			.join(' ');
	}

	function buildCustomProperties({ isOutline, fill, stroke, strokeWidth, color, bold }) {
		const toCssLength = (value) => (typeof value === 'number' ? `${value}px` : value);

		const colourProperties = isOutline
			? [
					['--annotation-outline-stroke', stroke],
					['--annotation-outline-stroke-width', toCssLength(strokeWidth)],
					['--annotation-outline-text', color]
				]
			: [
					['--annotation-fill', fill],
					['--annotation-stroke', stroke],
					['--annotation-stroke-width', toCssLength(strokeWidth)],
					['--annotation-text', color]
				];

		return [...colourProperties, ['--annotation-font-weight', bold ? '700' : undefined]]
			.filter(([, value]) => value !== undefined)
			.map(([propertyName, value]) => `${propertyName}:${value}`);
	}

	let inlineStyle = $derived(
		[
			isOutline ? undefined : `border-radius:${buildBorderRadius(pointer)}`,
			...buildCustomProperties({ isOutline, fill, stroke, strokeWidth, color, bold }),
			buildAnchorTransform(anchor, offset),
			style
		]
			.filter(Boolean)
			.join(';')
	);
</script>

<div class="annotation {className}" class:outline={isOutline} style={inlineStyle} {...rest}>
	{#if children}
		{@render children()}
	{:else}
		{text}
	{/if}
</div>

<style>
	.annotation {
		display: inline-flex;
		padding: var(--annotation-padding, 6px 8px);
		justify-content: center;
		align-items: center;
		gap: 10px;
		grid-row: span 1;
		grid-column: span 1;
		box-sizing: border-box;
		width: max-content;
		white-space: nowrap;

		background: var(--annotation-fill, #fff);
		box-shadow: inset 0 0 0 var(--annotation-stroke-width, 1px)
			var(--annotation-stroke, transparent);

		color: var(--annotation-text, #000);
		font-feature-settings: 'ss01' on;
		font-family: var(--annotation-font-family, 'ABC Sans Nova', sans-serif);
		font-size: var(--annotation-font-size, 14px);
		font-style: normal;
		font-weight: var(--annotation-font-weight, 400);
		line-height: 100%;
		letter-spacing: var(--annotation-letter-spacing, 0.42px);
	}

	.annotation.outline {
		--outline-default-text: #000;
		--outline-default-stroke: #fff;

		padding: 0;
		background: none;
		box-shadow: none;

		color: var(--annotation-outline-text, var(--outline-default-text));

		/* Paint the stroke first so the glyph fill covers its inner half. */
		-webkit-text-stroke: calc(var(--annotation-outline-stroke-width, 2px) * 2)
			var(--annotation-outline-stroke, var(--outline-default-stroke));
		paint-order: stroke fill;
		stroke-linejoin: round;
	}

	:global(.dark) .annotation.outline {
		--outline-default-text: #fff;
		--outline-default-stroke: #000;
	}
</style>
