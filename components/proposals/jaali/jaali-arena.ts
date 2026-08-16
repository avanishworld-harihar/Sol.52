/**
 * Jaali engineering arena — elevated GI MMS table layout.
 *
 * Residential rooftop shorthand (walkable-under-array stands):
 * - 1P / 2P / 3P = portrait modules stacked on one table along the tilt (N–S).
 * - 3P is the usual elevated table: three portrait modules, front edge south.
 * - Tables sit side-by-side east–west. A leftover 1P/2P table is centered.
 * - A single missing module sits in the *middle* of that table (true center),
 *   not the north/top cell and never a side-corner hole.
 */

export type JaaliArenaKind = "1P" | "2P" | "3P";

export type JaaliArenaLayout = {
  rows: number;
  cols: number;
  /** Row-major, north (top) → south (bottom). `false` is a reserved gap. */
  cells: boolean[];
  tableKind: JaaliArenaKind;
  heights: number[];
};

function assembleCentered(fullCount: number, fullH: number, remCount: number, remH: number): number[] {
  const total = fullCount + remCount;
  const heights = Array.from({ length: total }, () => 0);
  const remStart = Math.floor((total - remCount) / 2);
  for (let i = 0; i < remCount; i++) heights[remStart + i] = remH;
  for (let i = 0; i < total; i++) {
    if (heights[i] === 0) heights[i] = fullH;
  }
  return heights;
}

function columnHeights(count: number, maxH: number): number[] {
  const full = Math.floor(count / maxH);
  const rem = count % maxH;
  if (rem === 0) return Array.from({ length: Math.max(1, full) }, () => maxH);
  // 3+1 with four-plus tables → two 2P in the center (3+2+2+3), not a lonely 1P.
  if (rem === 1 && full >= 3) {
    return assembleCentered(full - 1, maxH, 2, 2);
  }
  return assembleCentered(full, maxH, 1, rem);
}

function pickKind(count: number): JaaliArenaKind {
  if (count >= 6) return "3P";
  if (count >= 4) return "2P";
  return count >= 2 ? "2P" : "1P";
}

/** Place `height` modules in a column of `rows`, keeping leftover gaps in the middle. */
function columnFill(height: number, rows: number): boolean[] {
  const out = Array.from({ length: rows }, () => false);
  if (height <= 0) return out;
  if (height >= rows) return Array.from({ length: rows }, () => true);
  const gap = rows - height;
  if (gap === 1) {
    const mid = Math.floor(rows / 2);
    return out.map((_, r) => r !== mid);
  }
  const start = Math.floor(gap / 2);
  for (let i = 0; i < height; i++) out[start + i] = true;
  return out;
}

export function jaaliArenaLayout(count: number): JaaliArenaLayout {
  const n = Math.max(0, Math.floor(count));
  if (n <= 0) {
    return { rows: 0, cols: 0, cells: [], tableKind: "1P", heights: [] };
  }
  if (n <= 3) {
    const kind: JaaliArenaKind = n === 3 ? "3P" : n === 2 ? "2P" : "1P";
    return {
      rows: n,
      cols: 1,
      cells: Array.from({ length: n }, () => true),
      tableKind: kind,
      heights: [n],
    };
  }

  const tableKind = pickKind(n);
  const rows = tableKind === "3P" ? 3 : 2;
  const heights = columnHeights(n, rows);
  const cols = heights.length;
  const fills = heights.map((h) => columnFill(h, rows));
  const cells: boolean[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push(fills[c][r]);
    }
  }
  return { rows, cols, cells, tableKind, heights };
}
