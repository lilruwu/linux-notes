// clipboard.js — read an image off the *system* clipboard via the Tauri plugin.
// WebKitGTK (the Linux webview) often doesn't expose pasted images through the
// DOM `paste` event, so this bypasses the webview and asks the OS directly.
import { readImage } from "@tauri-apps/plugin-clipboard-manager";

// Returns a PNG data URL for the clipboard image, or null if there isn't one.
export async function readClipboardImageDataUrl() {
  try {
    const img = await readImage(); // throws when the clipboard holds no image
    const { width, height } = await img.size();
    const rgba = await img.rgba(); // Uint8Array, row-major RGBA
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.putImageData(new ImageData(new Uint8ClampedArray(rgba), width, height), 0, 0);
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}
