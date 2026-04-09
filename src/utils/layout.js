/**
 * Computes all scene positions and sizes dynamically from the canvas dimensions.
 * Call at create() time. No hardcoded coordinates anywhere else.
 *
 * Portrait (H > W):
 *   5% of W padding on each side, 5% of H extra at the bottom.
 *   Tray flush below field; each slot = 1/3 field width (square).
 *   Field+tray block centered in remaining vertical space.
 *
 * Landscape (W > H):
 *   5% of H padding above content (below HUD), 10% of H at the bottom (5% base + 5% extra).
 *   Tray flush to right of field; each slot = 1/3 field height (square).
 *   Field+tray block centered horizontally.
 */
export function computeLayout(W, H) {
  const HUD_H = 52;
  const landscape = W > H;

  const quizX = Math.floor(W / 2);
  const quizY = Math.floor(H / 2);
  const centerX = Math.floor(W / 2);
  const centerY = Math.floor(H / 2);
  const quizW = Math.min(W * 0.9, 420);

  if (landscape) {
    const topPad    = Math.floor(H * 0.05);
    const bottomPad = Math.floor(H * 0.15); // 5% base + 10% extra
    const sidePad   = Math.floor(W * 0.02); // small side margin
    const availableW = W - sidePad * 2;
    const availableH = H - HUD_H - topPad - bottomPad;

    // Total content width = cellSize*8 (field) + cellSize*8/3 (tray) = cellSize*32/3
    const cellSize = Math.floor(Math.min(availableW / (32 / 3), availableH / 8));

    const gridWidth  = cellSize * 8;
    const gridHeight = cellSize * 8;
    const traySlotH  = Math.floor(gridHeight / 3);
    const trayW      = traySlotH; // square slots

    const totalContentW = gridWidth + trayW;
    const gridX = Math.floor((W - totalContentW) / 2);
    const gridY = HUD_H + topPad + Math.floor((availableH - gridHeight) / 2);
    const trayX = gridX + gridWidth; // flush against field
    const trayY = gridY;
    const trayH = gridHeight;

    const trayCellSize = Math.floor(traySlotH / 5);

    return {
      W, H, HUD_H, landscape,
      cellSize,
      gridCols: 8, gridRows: 8,
      gridWidth, gridHeight, gridX, gridY,
      trayX, trayW, trayY, trayH, traySlotH, traySlotW: trayW,
      trayCellSize,
      quizW, quizH: Math.min(H * 0.7, 420),
      quizX, quizY, centerX, centerY,
    };
  }

  // Portrait
  const sidePad   = Math.floor(W * 0.05);
  const bottomPad = Math.floor(H * 0.15); // 5% base + 10% extra
  const availableW = W - sidePad * 2;
  const availableH = H - HUD_H - bottomPad;

  // Total content height = cellSize*8 (field) + cellSize*8/3 (tray) = cellSize*32/3
  const cellSize = Math.floor(Math.min(availableW / 8, availableH / (32 / 3)));

  const gridWidth  = cellSize * 8;
  const gridHeight = cellSize * 8;
  const traySlotW  = Math.floor(gridWidth / 3);
  const trayH      = traySlotW; // square slots

  const totalContentH = gridHeight + trayH;
  const gridX = sidePad + Math.floor((availableW - gridWidth) / 2);
  const gridY = HUD_H + Math.floor((availableH - totalContentH) / 2);
  const trayY = gridY + gridHeight; // flush against field

  const trayCellSize = Math.floor(traySlotW / 5);

  return {
    W, H, HUD_H, landscape,
    cellSize,
    gridCols: 8, gridRows: 8,
    gridWidth, gridHeight, gridX, gridY,
    trayY, trayH, trayCellSize, traySlotW,
    quizW, quizH: Math.min(H * 0.55, 380),
    quizX, quizY, centerX, centerY,
  };
}
