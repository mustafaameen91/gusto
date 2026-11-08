// ESC/POS commands for 80 mm thermal printers (Xprinter XP-C260M, Van-Gold VA80T and compatibles).
// Receipts are printed as a raster image so Arabic is shaped and right-to-left exactly as
// the screen renders it; these printers' built-in Arabic text mode can't do that.

const ESC = 0x1b;
const GS = 0x1d;

// 80 mm paper = 72 mm printable at 203 dpi = 576 dots
const PAPER_DOTS = { 80: 576, 58: 384 };

const init = () => Buffer.from([ESC, 0x40]); // ESC @ : reset
const feed = (lines = 4) => Buffer.from([ESC, 0x64, lines]); // ESC d n : feed n lines
const cut = () => Buffer.from([GS, 0x56, 0x42, 0x00]); // GS V 66 0 : feed to cutter + partial cut

// ESC p m t1 t2 : pulse the cash drawer. m = 0 (connector pin 2) or 1 (pin 5);
// on time 25×2 ms, off time 250×2 ms (standard values for 24 V drawers).
const drawerKick = (pin = 0) => Buffer.from([ESC, 0x70, pin ? 1 : 0, 25, 250]);

/**
 * Convert an RGBA/BGRA bitmap to ESC/POS raster (GS v 0), in bands so long receipts
 * never exceed the printer's buffer.
 * @param {Buffer} pixels  4 bytes per pixel
 * @param {number} width   pixels (≤ paper dots; narrower images are centred)
 * @param {number} height  pixels
 * @param {object} opts    { paperDots, threshold (0-255, darker than this prints), bgra }
 */
function rasterFromBitmap(pixels, width, height, { paperDots = 576, threshold = 160, bgra = true } = {}) {
  const bytesPerRow = paperDots / 8;
  const offsetX = Math.max(0, Math.floor((paperDots - width) / 2));
  const R = bgra ? 2 : 0;
  const B = bgra ? 0 : 2;

  // Trim blank rows at the bottom so the paper isn't wasted
  const rowIsBlank = (y) => {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const a = pixels[i + 3] / 255;
      const lum = (0.299 * pixels[i + R] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + B]) * a + 255 * (1 - a);
      if (lum < threshold) return false;
    }
    return true;
  };
  let lastRow = height - 1;
  while (lastRow > 0 && rowIsBlank(lastRow)) lastRow--;
  const rows = Math.min(height, lastRow + 1 + 8);

  const bitmap = Buffer.alloc(bytesPerRow * rows);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < width && x + offsetX < paperDots; x++) {
      const i = (y * width + x) * 4;
      const a = pixels[i + 3] / 255;
      const lum = (0.299 * pixels[i + R] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + B]) * a + 255 * (1 - a);
      if (lum < threshold) {
        const px = x + offsetX;
        bitmap[y * bytesPerRow + (px >> 3)] |= 0x80 >> (px & 7);
      }
    }
  }

  const BAND = 256;
  const parts = [];
  for (let y = 0; y < rows; y += BAND) {
    const h = Math.min(BAND, rows - y);
    parts.push(
      Buffer.from([GS, 0x76, 0x30, 0x00, bytesPerRow & 0xff, bytesPerRow >> 8, h & 0xff, h >> 8]),
      bitmap.subarray(y * bytesPerRow, (y + h) * bytesPerRow),
    );
  }
  return Buffer.concat(parts);
}

/** Full print job: reset, image, feed, cut, and optionally open the drawer */
function buildJob({ raster, openDrawer = false, drawerPin = 0, copies = 1 }) {
  const parts = [init()];
  if (openDrawer) parts.push(drawerKick(drawerPin));
  for (let c = 0; c < Math.max(1, copies); c++) parts.push(raster, feed(4), cut());
  return Buffer.concat(parts);
}

/** Drawer only (no paper) */
const drawerJob = (pin = 0) => Buffer.concat([init(), drawerKick(pin)]);

module.exports = { PAPER_DOTS, rasterFromBitmap, buildJob, drawerJob, init, cut, feed, drawerKick };
