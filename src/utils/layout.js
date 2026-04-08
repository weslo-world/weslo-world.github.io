/**
 * Computes all scene positions and sizes dynamically from the canvas dimensions.
 * Call at create() time. No hardcoded coordinates anywhere else.
 */
export function computeLayout(W, H) {
  const HUD_H = 52;
  const padding = 10;

  // Grid: square, 8×8, sized to fit comfortably in portrait layout
  const availableW = W - padding * 2;
  const availableH = H - HUD_H - padding * 3; // room for HUD + tray below
  const gridAreaH = availableH * 0.70; // grid gets 70% of vertical space
  const cellSize = Math.floor(Math.min(availableW, gridAreaH) / 8);
  const gridCols = 8;
  const gridRows = 8;
  const gridWidth = cellSize * gridCols;
  const gridHeight = cellSize * gridRows;
  const gridX = Math.floor((W - gridWidth) / 2); // left edge
  const gridY = HUD_H + padding;

  // Tray: 3 piece slots below grid
  const trayY = gridY + gridHeight + padding;
  const trayH = H - trayY - padding;
  // Pieces in tray are drawn at a smaller scale to fit
  const trayCellSize = Math.floor(Math.min(trayH / 4, cellSize * 0.65));
  const traySlotW = Math.floor(W / 3);

  // Quiz overlay card: centered, reasonable max size
  const quizW = Math.min(W - padding * 4, 420);
  const quizH = Math.min(H * 0.55, 380);
  const quizX = Math.floor(W / 2);
  const quizY = Math.floor(H / 2);

  return {
    W, H,
    HUD_H,
    padding,
    cellSize,
    gridCols,
    gridRows,
    gridWidth,
    gridHeight,
    gridX,
    gridY,
    trayY,
    trayH,
    trayCellSize,
    traySlotW,
    quizW,
    quizH,
    quizX,
    quizY,
    centerX: Math.floor(W / 2),
    centerY: Math.floor(H / 2),
  };
}
