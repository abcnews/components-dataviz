<!--
  Annotation.svelte  (Svelte 5)

  A small label whose one square corner acts as an arrow, pointing at
  whatever it refers to.

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
                              Default: 'bottom-left'.
  fill          string        Background colour (overrides --annotation-fill).
  stroke        string        Outline colour (overrides --annotation-stroke).
  strokeWidth   number|string Outline width. Numbers are px.
  color         string        Text colour (overrides --annotation-text).
  bold          boolean       Sets font-weight to 700 (overrides
                              --annotation-font-weight). Default: false.
  class, style                Passed through to the root element.

  Anchoring is done with a transform, so it never affects layout and the
  label can't be pushed past its anchor, whatever its size.

  CSS variables (set on :root, or any ancestor, to restyle globally)
  ------------------------------------------------------------------
  --annotation-fill            Background.                  default #fff
  --annotation-stroke          Outline colour.              default transparent
  --annotation-stroke-width    Outline width.               default 1px
  --annotation-text            Text colour.                 default #000
  --annotation-radius          Rounded corner radius.       default 8px
  --annotation-pointer-radius  Radius of the arrow corner.  default 0
  --annotation-padding         Inner padding.               default 6px 8px
  --annotation-font-family     default "ABC Sans Nova", sans-serif
  --annotation-font-size       default 14px
  --annotation-font-weight     default 400
  --annotation-letter-spacing  default 0.42px

  Props set the variables inline on the element, so they win over globals
  for that instance only. Unset props leave the global values untouched.

  Note: the stroke is drawn with an inset box-shadow, so it follows the
  corner shapes (including the squared arrow corner) and never changes
  the label's size or position.
-->
<script>
	let {
		text = '',
		children,
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

	// Anchor → [fx, fy]: the fraction of the label's width/height that sits
	// before the anchor point (0 = start edge, 0.5 = middle, 1 = end edge).
	const ANCHORS = {
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

	const px = (v) => (typeof v === 'number' ? `${v}px` : v);

	// Corner order for border-radius: top-left, top-right, bottom-right, bottom-left
	const CORNERS = ['top-left', 'top-right', 'bottom-right', 'bottom-left'];

	let radius = $derived(
		CORNERS.map((c) =>
			c === pointer ? 'var(--annotation-pointer-radius, 0px)' : 'var(--annotation-radius, 8px)'
		).join(' ')
	);

	let transform = $derived.by(() => {
		const [fx, fy] = ANCHORS[anchor] ?? ANCHORS['top-left'];
		// Away from the anchor point: +1 when the label extends forward,
		// -1 when it extends backward, 0 when it straddles the point.
		const dx = (1 - 2 * fx) * offset;
		const dy = (1 - 2 * fy) * offset;
		if (!fx && !fy && !offset) return '';
		return `transform:translate(calc(${-fx * 100}% + ${dx}px), calc(${-fy * 100}% + ${dy}px))`;
	});

	let inlineStyle = $derived.by(() => {
		const parts = [`border-radius:${radius}`];

		if (fill !== undefined) parts.push(`--annotation-fill:${fill}`);
		if (stroke !== undefined) parts.push(`--annotation-stroke:${stroke}`);
		if (strokeWidth !== undefined) parts.push(`--annotation-stroke-width:${px(strokeWidth)}`);
		if (color !== undefined) parts.push(`--annotation-text:${color}`);
		if (bold) parts.push('--annotation-font-weight:700');
		if (transform) parts.push(transform);

		return parts.join(';') + (style ? `;${style}` : '');
	});
</script>

<div class="annotation {className}" style={inlineStyle} {...rest}>
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
</style>
