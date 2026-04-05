# Size Label Card Maker

## Purpose
Size Label Card Maker converts an order summary Excel file into printable size label cards.
Upload your data, review and sort the rows, design the card layout, then export directly to PDF (A4 landscape).

## Workflow overview
The tool is split into three steps shown at the top of the page:

1. **Upload** — load an Excel file
2. **Data** — review rows and configure sort order
3. **Design & Export** — design the card and print to PDF

---

## Step 1 — Upload

Drag and drop an Excel file onto the upload area, or click it to browse.

**Supported formats**: `.xlsx`, `.xls`, `.ods`, `.csv`

The tool reads the following columns from the first sheet:

| Column | Description |
|---|---|
| `FTY SAP#` | Factory SAP number |
| `Order Number (GTN)` | GTN order number |
| `Article Number` | Article / style number |
| `Model Name` | Product model name |
| `PODD` | Planned on-dock date (displayed as "DD Month YYYY") |
| `TOTAL QTY` | Total quantity (displayed as "N prs") |
| `Ship to Country` | Destination country |
| `Sizes` | Count of non-zero size columns (displayed as "N sizes") |

Size columns recognized: 1, 1.5, 2 … 18 (comma or period as decimal separator).

---

## Step 2 — Data

After loading, all rows appear in a scrollable table (up to 100 rows shown at once).

### Sort order
Cards will be printed in the sort order you configure here.

- **Default sort**: FTY SAP# ascending, then PODD ascending.
- Click **Add rule** to add another sort level.
- Click the **asc / desc** button on a rule to toggle direction.
- Click **×** on a rule to remove it.
- Click **Reset sort** to restore the default two-rule sort.

When you are satisfied with the data, click **Design Card →** to continue.

---

## Step 3 — Design & Export

### Live Preview
The left panel shows a real-time preview of the first row's card using your current design settings.

### Card Settings

| Setting | Description |
|---|---|
| Width (mm) | Card width in millimetres |
| Height (mm) | Card height in millimetres |
| Padding (mm) | Inner margin inside the card |
| Border (px) | Border thickness in pixels |
| Background | Fill colour of the card |
| Border color | Colour of the card border |
| Font family | Typeface used for all text on the card |
| Card index | Show a small "N/total" counter in the top-right corner |
| Page numbers | Print a "Page N of N" footer at the bottom of each A4 page |

### Fields
Each card displays a list of **fields** stacked vertically. The right panel lets you manage them.

- **Add** — create a new field (click the green **Add** button).
- **Remove** — click **×** on a field row.
- **Reorder** — use **↑ / ↓** arrows, or drag the grip handle.
- **Edit** — click a field row to expand its settings:

| Option | Description |
|---|---|
| Data source | Which column to display, or **Static text** for fixed content |
| Static text | Text to show if data source is "Static text" |
| Prefix / Suffix | Text prepended / appended to the value |
| Label prefix | Toggle to prepend a short label (e.g. `SAP: 12345`) |
| Font size | XS (10px) → 3XL (28px) |
| Font weight | Normal / Semibold / Bold |
| Italic | Toggle italic style |
| Alignment | Left / Center / Right |

### Exporting to PDF
Click **Export PDF** to open the browser print dialog with A4 landscape settings pre-applied.
Cards are laid out automatically — as many as fit per page based on card dimensions.

> **Tip**: In the print dialog, set **Margins → None** and disable any browser headers/footers for the cleanest output.

### Resetting
- **Reset to defaults** — restores the default card design (fields, colours, dimensions). Your uploaded data is kept.
- **Start over** — clears everything including the uploaded file.

## Notes
- Card design (fields, dimensions, colours) is saved automatically in the browser and restored on your next visit.
- PODD dates are parsed from Excel date values or text and formatted as "DD Month YYYY".
- If a size column uses a period instead of a comma as the decimal separator, it is still recognised correctly.
