# Carton Catalog

## Purpose
Carton Catalog lets you maintain a named library of carton box sizes (Width × Height × Depth).
Each entry gets an animated 3D preview and can be opened in the interactive Carton Viewer for sticker placement.

## Adding a carton manually
1. Click **+ New Carton**.
2. Fill in the **Name**, optional **Description**, and the three dimensions in metres (**W**, **H**, **D**).
3. Click **Save** to add the entry to the catalog.

## Importing from Excel
1. Click **Import Excel**.
2. Select an `.xlsx` or `.xls` file. The tool reads the first sheet and looks for the following columns (case-insensitive):

   | Column | Aliases accepted |
   |---|---|
   | `name` | — |
   | `width` | `w`, `width_mm` |
   | `height` | `h`, `height_mm` |
   | `depth` | `d`, `depth_mm` |
   | `description` | `desc`, `note`, `notes` |

3. An **Import Preview** dialog opens showing all detected rows. Rows with errors (missing name, invalid dimensions) are highlighted.
4. Check or uncheck individual rows as needed. Click the header checkbox to select/deselect all.
5. Click **Import N Cartons** to add the selected rows to the catalog.

## Editing a carton
Hover over a catalog card and click the **pencil** icon. Adjust the fields and click **Save**.

## Deleting a carton
Hover over a catalog card and click the **trash** icon. The deletion is immediate and cannot be undone.

## Opening in Carton Viewer
Click the **View** button (arrow icon) on any catalog card to open that carton in the Carton Viewer tool.

## 3D Preview
Each card shows a live rotating 3D box rendered at the correct aspect ratio. The preview updates automatically when you edit dimensions.

## Notes
- Dimensions are stored in **metres**. The catalog displays them as entered; the Carton Viewer scales them visually.
- Carton data is stored locally in the app's SQLite database and persists between sessions.
