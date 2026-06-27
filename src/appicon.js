// appicon.js — retint the window icon to match the current theme accent.
// Drawn on a canvas (no SVG → no canvas tainting) and pushed to the OS via
// Tauri. Best-effort: some desktops (e.g. GNOME) ignore per-window icons, and
// in a plain browser this no-ops.
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Image as TauriImage } from "@tauri-apps/api/image";

function darken(hex, amt) {
  const h = hex.replace("#", "").trim();
  const full = h.length === 3 ? h.replace(/./g, (c) => c + c) : h;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return hex;
  const r = Math.round(((n >> 16) & 255) * (1 - amt));
  const g = Math.round(((n >> 8) & 255) * (1 - amt));
  const b = Math.round((n & 255) * (1 - amt));
  return `rgb(${r},${g},${b})`;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
}

// Mirror of the static notepad icon, in the supplied accent colour.
function drawNotepad(ctx, S, accent) {
  const u = (v) => (v * S) / 512;
  ctx.clearRect(0, 0, S, S);

  ctx.save();
  roundRect(ctx, 0, 0, S, S, u(114));
  ctx.clip();

  ctx.fillStyle = "#F6F4EC";
  ctx.fillRect(0, 0, S, S);

  ctx.fillStyle = "#E5E2D8";
  for (const [x, y, w] of [[92, 236, 328], [92, 290, 328], [92, 344, 244], [92, 398, 300]]) {
    roundRect(ctx, u(x), u(y), u(w), u(22), u(11));
    ctx.fill();
  }

  const g = ctx.createLinearGradient(0, 0, u(120), u(170));
  g.addColorStop(0, accent);
  g.addColorStop(1, darken(accent, 0.18));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, u(150));
  ctx.fillStyle = "rgba(0,0,0,0.08)";
  ctx.fillRect(0, u(150), S, u(3));

  for (const cx of [121, 241, 361]) {
    ctx.fillStyle = "#FBFAF6";
    roundRect(ctx, u(cx - 10), u(110), u(20), u(86), u(10));
    ctx.fill();
    ctx.fillStyle = darken(accent, 0.32);
    ctx.beginPath();
    ctx.arc(u(cx), u(126), u(4.6), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  ctx.strokeStyle = "rgba(0,0,0,0.10)";
  ctx.lineWidth = u(3);
  roundRect(ctx, u(2), u(2), S - u(4), S - u(4), u(112));
  ctx.stroke();
}

// Sync the native window (and its titlebar decorations) to the active mode.
// `theme` is "light" | "dark" to force it, or null to follow the system theme
// (used by the "Automático" mode). Best-effort: a no-op outside the Tauri
// runtime, and on desktops/platforms that don't honour the request.
export async function applyWindowTheme(theme) {
  if (typeof window === "undefined" || !window.__TAURI_INTERNALS__) return;
  try {
    await getCurrentWindow().setTheme(theme || null);
  } catch (e) {
    console.debug("native window theme sync skipped:", e);
  }
}

let lastAccent = null;

export async function applyThemedIcon() {
  // Only meaningful inside the Tauri runtime.
  if (typeof window === "undefined" || !window.__TAURI_INTERNALS__) return;
  try {
    const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
    if (!accent || accent === lastAccent) return;
    lastAccent = accent;

    const S = 256;
    const canvas = document.createElement("canvas");
    canvas.width = S;
    canvas.height = S;
    drawNotepad(canvas.getContext("2d"), S, accent);

    const rgba = new Uint8Array(canvas.getContext("2d").getImageData(0, 0, S, S).data);
    const icon = await TauriImage.new(rgba, S, S);
    await getCurrentWindow().setIcon(icon);
  } catch (e) {
    // Best-effort: not all desktops honour per-window icons.
    console.debug("themed window icon skipped:", e);
  }
}
