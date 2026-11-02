/**
 * Minimal SVG path toolkit shared by the importer script and the icon generator.
 *
 * Paths are normalised to four absolute commands: M, L, C, Z.
 * Input may use M L H V C Z in upper or lower case. Anything else (S, Q, T, A)
 * throws, so unsupported geometry fails loudly instead of rendering wrongly.
 */

export type Seg =
  | { type: 'M' | 'L'; x: number; y: number }
  | { type: 'C'; x1: number; y1: number; x2: number; y2: number; x: number; y: number }
  | { type: 'Z' };

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

const SUPPORTED = 'mlhvcz';

export function parsePath(d: string): Seg[] {
  const tokens = d.match(/[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g) ?? [];
  const segs: Seg[] = [];
  let i = 0;
  let cmd = '';
  let cx = 0, cy = 0; // current point
  let sx = 0, sy = 0; // start of current subpath

  const num = (): number => {
    const t = tokens[i++];
    const v = Number(t);
    if (t === undefined || Number.isNaN(v)) throw new Error(`Malformed path data near "${t ?? 'end of input'}"`);
    return v;
  };

  while (i < tokens.length) {
    const t = tokens[i] as string;
    if (/[a-zA-Z]/.test(t)) {
      cmd = t;
      i++;
      if (!SUPPORTED.includes(cmd.toLowerCase())) {
        throw new Error(`Unsupported path command "${cmd}" (supported: M L H V C Z)`);
      }
    } else if (cmd === '' || cmd.toLowerCase() === 'z') {
      throw new Error(`Unexpected number "${t}" in path data`);
    }

    const rel = cmd === cmd.toLowerCase();
    const ox = rel ? cx : 0;
    const oy = rel ? cy : 0;

    switch (cmd.toLowerCase()) {
      case 'z':
        segs.push({ type: 'Z' });
        cx = sx;
        cy = sy;
        break;
      case 'm': {
        const x = num() + ox;
        const y = num() + oy;
        segs.push({ type: 'M', x, y });
        cx = sx = x;
        cy = sy = y;
        cmd = rel ? 'l' : 'L'; // extra coordinate pairs after M are implicit lineto
        break;
      }
      case 'l': {
        const x = num() + ox;
        const y = num() + oy;
        segs.push({ type: 'L', x, y });
        cx = x;
        cy = y;
        break;
      }
      case 'h': {
        const x = num() + ox;
        segs.push({ type: 'L', x, y: cy });
        cx = x;
        break;
      }
      case 'v': {
        const y = num() + oy;
        segs.push({ type: 'L', x: cx, y });
        cy = y;
        break;
      }
      case 'c': {
        const x1 = num() + ox, y1 = num() + oy;
        const x2 = num() + ox, y2 = num() + oy;
        const x = num() + ox, y = num() + oy;
        segs.push({ type: 'C', x1, y1, x2, y2, x, y });
        cx = x;
        cy = y;
        break;
      }
    }
  }
  return segs;
}

export function serializePath(segs: Seg[], digits = 5): string {
  const p = 10 ** digits;
  const f = (v: number) => String(Math.round(v * p) / p);
  return segs
    .map((s) => {
      switch (s.type) {
        case 'Z':
          return 'Z';
        case 'C':
          return `C${f(s.x1)} ${f(s.y1)} ${f(s.x2)} ${f(s.y2)} ${f(s.x)} ${f(s.y)}`;
        default:
          return `${s.type}${f(s.x)} ${f(s.y)}`;
      }
    })
    .join('');
}

/** Apply any affine point mapping (translate / scale / rotate). Béziers stay exact under affine maps. */
export function mapPoints(segs: Seg[], fn: (x: number, y: number) => [number, number]): Seg[] {
  return segs.map((s): Seg => {
    switch (s.type) {
      case 'Z':
        return s;
      case 'C': {
        const [x1, y1] = fn(s.x1, s.y1);
        const [x2, y2] = fn(s.x2, s.y2);
        const [x, y] = fn(s.x, s.y);
        return { type: 'C', x1, y1, x2, y2, x, y };
      }
      default: {
        const [x, y] = fn(s.x, s.y);
        return { type: s.type, x, y };
      }
    }
  });
}

const cubicAt = (p0: number, p1: number, p2: number, p3: number, t: number): number => {
  const m = 1 - t;
  return m * m * m * p0 + 3 * m * m * t * p1 + 3 * m * t * t * p2 + t * t * t * p3;
};

/** Parameter values in (0,1) where a 1-D cubic Bézier has zero slope. */
function cubicExtrema(p0: number, p1: number, p2: number, p3: number): number[] {
  const a = -p0 + 3 * p1 - 3 * p2 + p3;
  const b = 2 * (p0 - 2 * p1 + p2);
  const c = p1 - p0;
  const inRange = (t: number) => t > 0 && t < 1;
  if (Math.abs(a) < 1e-12) {
    return Math.abs(b) < 1e-12 ? [] : [-c / b].filter(inRange);
  }
  const disc = b * b - 4 * a * c;
  if (disc < 0) return [];
  const root = Math.sqrt(disc);
  return [(-b + root) / (2 * a), (-b - root) / (2 * a)].filter(inRange);
}

/** Exact geometric bounds (stroke not included). */
export function pathBounds(segs: Seg[]): Bounds {
  const b: Bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  const add = (x: number, y: number) => {
    b.minX = Math.min(b.minX, x);
    b.minY = Math.min(b.minY, y);
    b.maxX = Math.max(b.maxX, x);
    b.maxY = Math.max(b.maxY, y);
  };
  let cx = 0, cy = 0, sx = 0, sy = 0;
  for (const s of segs) {
    switch (s.type) {
      case 'M':
        add(s.x, s.y);
        cx = sx = s.x;
        cy = sy = s.y;
        break;
      case 'L':
        add(s.x, s.y);
        cx = s.x;
        cy = s.y;
        break;
      case 'C': {
        add(s.x, s.y);
        const ts = [...cubicExtrema(cx, s.x1, s.x2, s.x), ...cubicExtrema(cy, s.y1, s.y2, s.y)];
        for (const t of ts) {
          add(cubicAt(cx, s.x1, s.x2, s.x, t), cubicAt(cy, s.y1, s.y2, s.y, t));
        }
        cx = s.x;
        cy = s.y;
        break;
      }
      case 'Z':
        cx = sx;
        cy = sy;
        break;
    }
  }
  if (!Number.isFinite(b.minX)) throw new Error('Cannot compute bounds of an empty path');
  return b;
}

export function unionBounds(list: Bounds[]): Bounds {
  if (list.length === 0) throw new Error('Cannot union an empty list of bounds');
  return list.reduce((a, b) => ({
    minX: Math.min(a.minX, b.minX),
    minY: Math.min(a.minY, b.minY),
    maxX: Math.max(a.maxX, b.maxX),
    maxY: Math.max(a.maxY, b.maxY),
  }));
}
