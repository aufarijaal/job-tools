# Carton Viewer

## Purpose
Carton Viewer is an interactive 3D tool for visualising a carton box and placing sticker labels on any face.
Open a carton from the Carton Catalog to start with its exact dimensions, or adjust the size directly on this page.

## Navigating the 3D view

| Action | How |
|---|---|
| Rotate | Click and drag on the canvas |
| Zoom | Scroll wheel |
| Auto-rotate | Happens automatically when no sticker is being dragged |

## Adjusting box dimensions
Use the **W / H / D** input fields at the top of the page to change the box width, height, and depth in real time.

## Sticker types

The **sticker palette** on the right lists the available sticker types:

- **Built-in stickers**: Fragile ⚠️, This Way Up ⬆️, Recycle ♻️, Star ⭐, Heart ❤️, Approved ✅
- **Custom image stickers**: click **+ Add image** to upload your own PNG/JPG/GIF. The image is used as a texture on a flat card placed on the box face.

## Placing a sticker
1. Select a sticker type from the palette (click it to highlight).
2. Click **Place on Face** and then click the desired face on the 3D box, or click directly on the face while a sticker type is active.
3. A sticker appears at the centre of that face.

## Moving a sticker
Click on a placed sticker to select it (blue highlight), then drag it to the desired position on the same face.

## Resizing a sticker
With a sticker selected, use the **Size** slider in the sticker panel to make it larger or smaller.

## Deselecting a sticker
Click the already-selected sticker again (without dragging) to deselect it, or click elsewhere on the canvas.

## Deleting a sticker
Select the sticker and click the **Delete** (✕) button in the sticker control panel.

## Notes
- Each sticker is locked to the face it was placed on and will not slide to another face during dragging.
- OrbitControls are automatically paused while you are dragging a sticker so the view stays still.
- Custom image stickers are stored as object URLs and are session-only; they will not persist after the app is restarted.
