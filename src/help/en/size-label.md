# Size Label Card Maker

## Purpose
Size Label Card Maker converts an order summary Excel file into printable size label cards.
Upload your data, review and sort the rows, choose a layout preset or design your own, then export directly to PDF (A4 landscape).

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
| `接单日-Released date` | Order released date (displayed as "Released D Mon YYYY") |
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

### Layout Presets
A palette of built-in presets appears at the top of the design panel. Click any preset card to instantly apply its full design (fields, dimensions, colours, barcode setting, and layout style). The following built-in presets are available:

| Preset | Description |
|---|---|
| **Classic** | All fields, vertical layout, linear barcode |
| **Bold** | Large model name, thick border, linear barcode |
| **Compact** | Small card, fewer fields, no barcode |
| **Side QR** | Text on the left, QR code on the right |
| **Wide Label** | Wide strip card, large linear barcode |
| **SAP Hero** | Giant SAP# centred, blue border, linear barcode |
| **SAP + QR** | Large SAP# on the left, QR code on the right |
| **Size Breakdown** | Per-size quantity grid at the bottom, linear barcode |

Click **Preview Presets PDF** (top of the page) to print a reference sheet containing sample cards for every preset.

#### Saving your own preset
When you have a design you want to reuse:
1. Click **Save as preset** (bookmark icon) in the design panel.
2. Enter a name and press **Save**.

User presets appear in the preset palette alongside the built-in ones. You can **rename** (pencil icon) or **delete** (trash icon) any user preset at any time.

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
| Layout style | **Vertical** — all fields then code stacked top-to-bottom; **Side Code Right** — fields on the left, barcode/QR on the right; **Size Grid** — fields followed by a per-size quantity grid |
| Card index | Show a small "N/total" counter in the top-right corner |
| Page numbers | Print a "Page N of N" footer at the bottom of each A4 page |
| PDF Scale | Zoom factor applied to each card when printing (0.5 × – 2 ×). Use values below 1 to fit more cards per page. |

### Barcode / QR Code

| Setting | Description |
|---|---|
| Show barcode | Toggle the code on or off |
| Type | **Linear (CODE128)** — traditional 1-D barcode; **QR Code** — 2-D square code |
| Height (mm) | Rendered height of the code element (width scales automatically for linear; size is square for QR) |

The barcode value is always the **FTY SAP#** of each card's row.

### Fields
Each card displays a list of **fields**. The right panel lets you manage them.

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
Cards are laid out automatically — as many as fit per page based on card dimensions and PDF scale.

> **Tip**: In the print dialog, set **Margins → None** and disable any browser headers/footers for the cleanest output.

### Saving and loading the configuration
Use the **Export Config** and **Import Config** buttons at the top of the page to save and restore the complete design setup:

- **Export Config** — downloads a `.json` file containing the current card design, all user presets, and the PDF scale setting.
- **Import Config** — loads a previously exported `.json` file and restores the design, user presets, and PDF scale.

This is useful for sharing a design with colleagues or backing up your work before experimenting.

### Resetting
- **Reset to defaults** — restores the default card design (fields, colours, dimensions). Your uploaded data is kept.
- **Start over** — clears everything including the uploaded file.

## Notes
- Card design (fields, dimensions, colours) and user presets are saved automatically in the browser and restored on your next visit.
- PODD dates are parsed from Excel date values or text and formatted as "DD Month YYYY".
- Released dates (column `接单日-Released date`) are formatted as "Released D Mon YYYY".
- If a size column uses a period instead of a comma as the decimal separator, it is still recognised correctly.
