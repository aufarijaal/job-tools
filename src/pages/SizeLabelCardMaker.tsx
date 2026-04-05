import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { read, utils } from 'xlsx'
import { toast } from 'sonner'
import {
  FileSpreadsheet, Upload, TableProperties, Palette,
  ChevronDown, X, Printer, Eye,
  GripVertical, ArrowUp, ArrowDown,
  Bold, AlignLeft, AlignCenter, AlignRight, Plus, Trash2,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 'upload' | 'data' | 'design'
type SortDir = 'asc' | 'desc'
interface SortRule { key: OutputCol; dir: SortDir }
type RowData = Record<OutputCol, string> & { _poddTs: number }
type FontSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl'
type FontWeight = 'normal' | 'semibold' | 'bold'
type TextAlign = 'left' | 'center' | 'right'

interface CardField {
  id: string
  columnKey: string
  staticText?: string
  label?: string
  showLabel: boolean
  fontSize: FontSize
  fontWeight: FontWeight
  textAlign: TextAlign
  italic: boolean
  prefix: string
  suffix: string
}

interface CardDesign {
  fields: CardField[]
  cardWidthMm: number
  cardHeightMm: number
  paddingMm: number
  bgColor: string
  borderColor: string
  borderWidthPx: number
  fontFamily: string
  showIndex: boolean
  showPageNumbers: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SIZE_COLS = [
  '1','1,5','2','2,5','3','3,5','4','4,5','5','5,5',
  '6','6,5','7','7,5','8','8,5','9','9,5','10','10,5',
  '11','11,5','12','12,5','13','13,5','14','14,5','15','16','17','18',
]

// Also match period-decimal variants (in case locale differs)
const SIZE_COLS_ALT: Record<string, string> = {}
SIZE_COLS.forEach((c) => { SIZE_COLS_ALT[c.replace(',', '.')] = c })

const OUTPUT_COLUMNS = [
  'FTY SAP#',
  'Order Number (GTN)',
  'Article Number',
  'Model Name',
  'PODD',
  'TOTAL QTY',
  'Ship to Country',
  'Sizes',
] as const

type OutputCol = (typeof OUTPUT_COLUMNS)[number]

const FONT_FAMILIES = [
  { label: 'System (sans-serif)', value: 'system-ui, sans-serif' },
  { label: 'Arial',               value: 'Arial, sans-serif' },
  { label: 'Georgia (serif)',     value: 'Georgia, serif' },
  { label: 'Courier (mono)',      value: '"Courier New", monospace' },
  { label: 'Impact',              value: 'Impact, sans-serif' },
]

const FONT_SIZE_MAP: Record<FontSize, string> = {
  xs: '10px', sm: '12px', base: '14px', lg: '16px',
  xl: '18px', '2xl': '22px', '3xl': '28px',
}

const FONT_SIZE_LABELS: Record<FontSize, string> = {
  xs: 'XS (10)', sm: 'S (12)', base: 'M (14)', lg: 'L (16)',
  xl: 'XL (18)', '2xl': '2XL (22)', '3xl': '3XL (28)',
}

const DEFAULT_FIELDS: CardField[] = [
  { id: 'f0', columnKey: 'Model Name',         showLabel: false, label: '',        fontSize: '2xl', fontWeight: 'bold',     textAlign: 'center', italic: false, prefix: '', suffix: '' },
  { id: 'f1', columnKey: 'FTY SAP#',           showLabel: true,  label: 'SAP',     fontSize: 'xl',  fontWeight: 'bold',     textAlign: 'center', italic: false, prefix: '', suffix: '' },
  { id: 'f2', columnKey: 'Order Number (GTN)', showLabel: true,  label: 'GTN',     fontSize: 'xl',  fontWeight: 'bold',     textAlign: 'center', italic: false, prefix: '', suffix: '' },
  { id: 'f3', columnKey: 'Article Number',     showLabel: true,  label: 'Art.',    fontSize: 'xs',  fontWeight: 'normal',   textAlign: 'left',   italic: false, prefix: '', suffix: '' },
  { id: 'f4', columnKey: 'PODD',               showLabel: false, label: '',        fontSize: 'sm',  fontWeight: 'normal',   textAlign: 'left',   italic: false, prefix: '', suffix: '' },
  { id: 'f5', columnKey: 'TOTAL QTY',          showLabel: false, label: '',        fontSize: 'sm',  fontWeight: 'normal',   textAlign: 'left',   italic: false, prefix: '', suffix: '' },
  { id: 'f6', columnKey: 'Ship to Country',    showLabel: true,  label: 'Ship to', fontSize: 'xs',  fontWeight: 'normal',   textAlign: 'left',   italic: false, prefix: '', suffix: '' },
  { id: 'f7', columnKey: 'Sizes',              showLabel: false, label: '',        fontSize: 'xs',  fontWeight: 'normal',   textAlign: 'left',   italic: false, prefix: '', suffix: '' },
]

const DEFAULT_SORT: SortRule[] = [
  { key: 'FTY SAP#', dir: 'asc' },
  { key: 'PODD',     dir: 'asc' },
]

const DEFAULT_DESIGN: CardDesign = {
  fields: DEFAULT_FIELDS,
  cardWidthMm: 90, cardHeightMm: 55, paddingMm: 5,
  bgColor: '#ffffff', borderColor: '#cccccc', borderWidthPx: 1,
  fontFamily: 'system-ui, sans-serif',
  showIndex: true,
  showPageNumbers: true,
}

// ─── Date helper ────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

function parseDateValue(v: unknown): Date | null {
  if (v instanceof Date && !isNaN(v.getTime())) return v
  if (typeof v === 'number' && v > 0)
    return new Date(Math.round((v - 25569) * 86400 * 1000))
  if (typeof v === 'string' && v.trim()) {
    const d = new Date(v.trim())
    if (!isNaN(d.getTime())) return d
  }
  return null
}

function formatPoddDate(v: unknown): string {
  const d = parseDateValue(v)
  if (!d) return String(v ?? '').trim()
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`
}

// ─── Row transformer ──────────────────────────────────────────────────────────

function transformRow(raw: Record<string, unknown>): RowData {
  // Normalise header keys (handle comma vs period decimal in size cols)
  const norm: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(raw)) {
    norm[k] = v
    const mapped = SIZE_COLS_ALT[k]
    if (mapped && !(mapped in norm)) norm[mapped] = v
  }

  let sizeCount = 0
  for (const col of SIZE_COLS) {
    const v = norm[col]
    if (v === '' || v == null) continue
    const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'))
    if (!isNaN(n) && n > 0) sizeCount++
  }

  const str = (col: string) => String(norm[col] ?? '').trim()

  const poddRaw  = norm['PODD']
  const poddDate = formatPoddDate(poddRaw)
  const poddTs   = parseDateValue(poddRaw)?.getTime() ?? 0
  const qty  = str('TOTAL QTY')

  return {
    'FTY SAP#':           str('FTY SAP#'),
    'Order Number (GTN)': str('Order Number (GTN)'),
    'Article Number':     str('Article Number'),
    'Model Name':         str('Model Name'),
    'PODD':               poddDate ? `PODD ${poddDate}` : '',
    _poddTs:              poddTs,
    'TOTAL QTY':          qty  ? `${qty} prs`   : '',
    'Ship to Country':    str('Ship to Country'),
    'Sizes':              sizeCount > 0 ? `${sizeCount} sizes` : '',
  }
}

// ─── CardPreview ──────────────────────────────────────────────────────────────

interface CardPreviewProps {
  design: CardDesign
  row: Record<string, unknown>
  index?: number
  total?: number
  forPrint?: boolean
}

function CardPreview({ design, row, index, total, forPrint = false }: CardPreviewProps) {
  return (
    <div
      style={{
        width: `${design.cardWidthMm}mm`,
        height: `${design.cardHeightMm}mm`,
        padding: `${design.paddingMm}mm`,
        background: design.bgColor,
        border: `${design.borderWidthPx}px solid ${design.borderColor}`,
        fontFamily: design.fontFamily,
        boxSizing: 'border-box',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: forPrint ? '1px' : '2px',
        breakInside: 'avoid',
        position: 'relative',
      }}
    >
      {design.showIndex && index != null && (
        <div style={{
          position: 'absolute', top: '2px', right: '3px',
          fontSize: '8px', lineHeight: '1', color: '#9ca3af',
          fontFamily: 'system-ui, sans-serif',
        }}>
          {index}{total != null ? `/${total}` : ''}
        </div>
      )}
      {design.fields.map((field) => {
        const raw = field.columnKey === '__static__'
          ? (field.staticText ?? '')
          : String(row[field.columnKey] ?? '')
        const value = field.prefix + raw + field.suffix
        const text  = field.showLabel && field.label ? `${field.label}: ${value}` : value
        return (
          <div
            key={field.id}
            style={{
              fontSize:   FONT_SIZE_MAP[field.fontSize],
              fontWeight: field.fontWeight,
              fontStyle:  field.italic ? 'italic' : 'normal',
              textAlign:  field.textAlign,
              lineHeight: '1.3',
              flexShrink: 0,
            }}
          >
            {text}
          </div>
        )
      })}
    </div>
  )
}

// ─── PrintArea ────────────────────────────────────────────────────────────────
// Groups cards into A4-landscape pages and injects page-number footers.
// Cards per page is estimated from card dimensions vs A4 landscape printable area.

interface PrintAreaProps {
  design: CardDesign
  rows: RowData[]
}

function PrintArea({ design, rows }: PrintAreaProps) {
  // A4 landscape printable area with 5mm margins: ~287mm × 200mm
  const perRow  = Math.max(1, Math.floor(287 / design.cardWidthMm))
  const perCol  = Math.max(1, Math.floor(200 / design.cardHeightMm))
  const perPage = perRow * perCol
  const total   = rows.length

  const pages: RowData[][] = []
  for (let i = 0; i < rows.length; i += perPage) {
    pages.push(rows.slice(i, i + perPage))
  }

  return (
    <div id="slcm-print-area">
      {pages.map((pageRows, pageIdx) => (
        <div key={pageIdx} style={{ display: 'contents' }}>
          {pageRows.map((row, j) => {
            const globalIdx = pageIdx * perPage + j
            return (
              <CardPreview
                key={globalIdx}
                design={design}
                row={row}
                index={globalIdx + 1}
                total={total}
                forPrint
              />
            )
          })}
          {design.showPageNumbers && (
            <div className="slcm-page-number">
              Page {pageIdx + 1} of {pages.length}
            </div>
          )}
          {pageIdx < pages.length - 1 && (
            <div className="slcm-page-break" />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SizeLabelCardMaker() {
  const [step, setStep]       = useState<Step>('upload')
  const [fileName, setFileName] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [rows, setRows]       = useState<RowData[]>([])
  const [sortRules, setSortRules] = useState<SortRule[]>(DEFAULT_SORT)
  const [isPrinting, setIsPrinting] = useState(false)
  const [printProgress, setPrintProgress] = useState(0)
  const [design, setDesign]   = useState<CardDesign>(() => {
    try {
      const saved = localStorage.getItem('slcm-design')
      if (saved) return { ...DEFAULT_DESIGN, ...JSON.parse(saved) }
    } catch { /* ignore */ }
    return DEFAULT_DESIGN
  })
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null)

  const sortedRows = useMemo(() => {
    if (!sortRules.length) return rows
    return [...rows].sort((a, b) => {
      for (const rule of sortRules) {
        let cmp: number
        if (rule.key === 'PODD') {
          cmp = a._poddTs - b._poddTs
        } else {
          cmp = a[rule.key].localeCompare(b[rule.key], undefined, { numeric: true, sensitivity: 'base' })
        }
        if (cmp !== 0) return rule.dir === 'asc' ? cmp : -cmp
      }
      return 0
    })
  }, [rows, sortRules])

  // Persist design to localStorage whenever it changes
  useEffect(() => {
    try { localStorage.setItem('slcm-design', JSON.stringify(design)) } catch { /* ignore */ }
  }, [design])

  // ── file loading ────────────────────────────────────────────────────────────

  function loadFile(file: File) {
    if (!file.name.match(/\.(xlsx|xls|ods|csv)$/i)) {
      toast.error('Please upload an Excel file (.xlsx, .xls, .ods, or .csv)')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const wb = read(e.target?.result, { type: 'array' })
        if (!wb.SheetNames.length) { toast.error('Workbook has no sheets.'); return }
        const sheet = wb.Sheets[wb.SheetNames[0]]
        const raw   = utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
        if (!raw.length) { toast.error('The sheet appears to be empty.'); return }
        setRows(raw.map(transformRow))
        setFileName(file.name)
        setStep('data')
        toast.success(`Loaded "${file.name}" — ${raw.length} rows`)
      } catch { toast.error('Failed to parse the file.') }
    }
    reader.readAsArrayBuffer(file as Blob)
  }

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setIsDragging(false)
    const f = e.dataTransfer.files[0]; if (f) loadFile(f)
  }, [])
  const handleDragOver  = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true)  }, [])
  const handleDragLeave = useCallback(() => setIsDragging(false), [])

  function reset() {
    setStep('upload'); setFileName(''); setRows([])
    setDesign(DEFAULT_DESIGN); setEditingFieldId(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── field helpers ───────────────────────────────────────────────────────────

  function addField() {
    const f: CardField = {
      id: `f-${Date.now()}`, columnKey: OUTPUT_COLUMNS[0],
      staticText: '', showLabel: false, label: '',
      fontSize: 'base', fontWeight: 'normal',
      textAlign: 'center', italic: false, prefix: '', suffix: '',
    }
    setDesign((d) => ({ ...d, fields: [...d.fields, f] }))
    setEditingFieldId(f.id)
  }

  function removeField(id: string) {
    setDesign((d) => ({ ...d, fields: d.fields.filter((f) => f.id !== id) }))
    if (editingFieldId === id) setEditingFieldId(null)
  }

  function updateField(id: string, patch: Partial<CardField>) {
    setDesign((d) => ({ ...d, fields: d.fields.map((f) => f.id === id ? { ...f, ...patch } : f) }))
  }

  function moveField(id: string, dir: 'up' | 'down') {
    setDesign((d) => {
      const idx = d.fields.findIndex((f) => f.id === id)
      if (idx < 0) return d
      const arr = [...d.fields]
      const t = dir === 'up' ? idx - 1 : idx + 1
      if (t < 0 || t >= arr.length) return d
      ;[arr[idx], arr[t]] = [arr[t], arr[idx]]
      return { ...d, fields: arr }
    })
  }

  // ── export handler ────────────────────────────────────────────────────────────

  function handleExport() {
    setIsPrinting(true)
    setPrintProgress(0)
    const total = rows.length
    const step = total > 0 ? 100 / total : 100
    let current = 0
    const interval = setInterval(() => {
      current += step * 3
      if (current >= 95) {
        clearInterval(interval)
        setPrintProgress(95)
        setTimeout(() => {
          setPrintProgress(100)
          setTimeout(() => {
            window.print()
            setIsPrinting(false)
            setPrintProgress(0)
          }, 300)
        }, 200)
      } else {
        setPrintProgress(Math.min(current, 95))
      }
    }, 30)
  }

  // ── print styles ────────────────────────────────────────────────────────────

  useEffect(() => {
    const style = document.createElement('style')
    style.id = 'slcm-print-style'
    style.textContent = `
      @page { size: A4 landscape; margin: 5mm; }
      @media print {
        body > *:not(#slcm-print-area) { display: none !important; }
        #slcm-print-area { display: flex !important; }
      }
      #slcm-print-area {
        display: none;
        background: white;
        padding: 0;
        box-sizing: border-box;
        flex-wrap: wrap;
        gap: 0;
        align-content: flex-start;
      }
      .slcm-page-break {
        width: 100%;
        flex-basis: 100%;
        page-break-after: always;
        break-after: page;
      }
      .slcm-page-number {
        width: 100%;
        flex-basis: 100%;
        text-align: center;
        font-size: 9px;
        color: #9ca3af;
        font-family: system-ui, sans-serif;
        padding: 1mm 0;
      }
    `
    if (!document.getElementById('slcm-print-style')) document.head.appendChild(style)
    return () => { document.getElementById('slcm-print-style')?.remove() }
  }, [])

  // ── derived ─────────────────────────────────────────────────────────────────

  const previewRow  = rows[0] ?? ({} as Record<OutputCol, string>)
  const totalCards   = sortedRows.length

  const STEPS: { key: Step; label: string; icon: React.ElementType }[] = [
    { key: 'upload', label: 'Upload',        icon: Upload         },
    { key: 'data',   label: 'Data',          icon: TableProperties },
    { key: 'design', label: 'Design & Export', icon: Palette       },
  ]
  const stepIdx: Record<Step, number> = { upload: 0, data: 1, design: 2 }

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Progress overlay */}
      {isPrinting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl px-10 py-8 flex flex-col items-center gap-4 min-w-[280px]">
            <Printer size={32} className="text-green-600" />
            <div className="text-center">
              <p className="font-semibold text-gray-800 text-base">Preparing PDF…</p>
              <p className="text-sm text-gray-500 mt-0.5">Rendering {rows.length} cards</p>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="h-2.5 bg-green-500 rounded-full transition-all duration-200"
                style={{ width: `${printProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-400">{Math.round(printProgress)}%</p>
          </div>
        </div>
      )}

      {/* Hidden print area — portalled directly into <body> so print CSS can target it */}
      {createPortal(
        <PrintArea design={design} rows={sortedRows} />,
        document.body
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md">
              <FileSpreadsheet size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Size Label Card Maker</h1>
              <p className="text-sm text-gray-500">Order summary → Size label cards → PDF export</p>
            </div>
          </div>
          {step !== 'upload' && (
            <button onClick={reset}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-600 transition-colors">
              <X size={14} /> Start over
            </button>
          )}
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-0">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            const cur  = stepIdx[step]
            const done = i < cur
            const active = i === cur
            return (
              <div key={s.key} className="flex items-center">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active ? 'bg-green-600 text-white shadow' : done ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                }`}>
                  <Icon size={15} /><span>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <ChevronDown size={16} className={`mx-1 -rotate-90 ${done ? 'text-green-500' : 'text-gray-300'}`} />
                )}
              </div>
            )
          })}
        </div>

        {/* ══ STEP 1: UPLOAD ═══════════════════════════════════════════════════ */}
        {step === 'upload' && (
          <div
            onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer select-none transition-colors ${
              isDragging ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-green-400 hover:bg-green-50/40'
            }`}
          >
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.ods,.csv" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f) }} />
            <FileSpreadsheet size={56} className={`mx-auto mb-4 ${isDragging ? 'text-green-500' : 'text-gray-300'}`} />
            <p className="text-lg font-semibold text-gray-700 mb-1">
              {isDragging ? 'Drop it here!' : 'Upload the order summary Excel file'}
            </p>
            <p className="text-sm text-gray-400">Drag & drop or click to browse · .xlsx, .xls, .ods, .csv</p>
            <p className="text-xs text-gray-300 mt-3">
              Reads: FTY SAP# · Order Number (GTN) · Article Number · Model Name · PODD · TOTAL QTY · Ship to Country · sizes
            </p>
          </div>
        )}

        {/* ══ STEP 2: DATA ═════════════════════════════════════════════════════ */}
        {step === 'data' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl border border-gray-200 p-4 shadow-sm text-sm">
              <FileSpreadsheet size={16} className="text-green-600" />
              <span className="font-medium text-gray-700 truncate max-w-xs">{fileName}</span>
              <span className="text-gray-300">·</span>
              <span className="text-gray-500">{rows.length} rows</span>
              <button onClick={() => setSortRules(DEFAULT_SORT)}
                className="text-xs px-3 py-1 rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-600 transition-colors">
                Reset sort
              </button>
              <button onClick={() => setStep('design')}
                className="ml-auto flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold text-sm shadow transition-colors">
                <Palette size={14} /> Design Card →
              </button>
            </div>

            {/* Sort config */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sort order</span>
                <button
                  onClick={() => setSortRules((prev) => [
                    ...prev,
                    { key: 'FTY SAP#', dir: 'asc' },
                  ])}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-600 transition-colors">
                  <Plus size={11} /> Add rule
                </button>
              </div>
              {sortRules.length === 0 && (
                <p className="text-xs text-gray-400 italic">No sort rules — rows appear in file order.</p>
              )}
              <div className="flex flex-wrap gap-2">
                {sortRules.map((rule, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5">
                    <span className="text-xs font-medium text-gray-400">{idx + 1}.</span>
                    <select
                      value={rule.key}
                      onChange={(e) => setSortRules((prev) => prev.map((r, i) => i === idx ? { ...r, key: e.target.value as OutputCol } : r))}
                      className="text-xs border-0 bg-transparent font-medium text-gray-700 focus:outline-none cursor-pointer">
                      {OUTPUT_COLUMNS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <button
                      onClick={() => setSortRules((prev) => prev.map((r, i) => i === idx ? { ...r, dir: r.dir === 'asc' ? 'desc' : 'asc' } : r))}
                      className="flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded bg-white border border-gray-200 hover:border-gray-400 text-gray-600 transition-colors font-mono">
                      {rule.dir === 'asc' ? <><ArrowUp size={10} /> asc</> : <><ArrowDown size={10} /> desc</>}
                    </button>
                    <button onClick={() => setSortRules((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-gray-300 hover:text-red-400 transition-colors">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-auto max-h-[60vh]">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50 sticky top-0 z-10">
                      <th className="w-10 px-3 py-3 text-center text-xs font-semibold text-gray-400 border-b border-gray-200">#</th>
                      {OUTPUT_COLUMNS.map((col) => (
                        <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 border-b border-gray-200 whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRows.slice(0, 100).map((row, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}>
                        <td className="px-3 py-2.5 text-center text-xs text-gray-400 border-b border-gray-100">{i + 1}</td>
                        {OUTPUT_COLUMNS.map((col) => (
                          <td key={col} className="px-4 py-2.5 text-gray-700 border-b border-gray-100 whitespace-nowrap max-w-xs truncate" title={row[col]}>
                            {row[col]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {sortedRows.length > 100 && (
                <div className="px-4 py-2.5 text-xs text-gray-400 bg-gray-50 border-t border-gray-200 text-center">
                  Showing first 100 of {sortedRows.length} rows
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ STEP 3: DESIGN & EXPORT ══════════════════════════════════════════ */}
        {step === 'design' && (
          <div className="space-y-4">
            {/* Top bar */}
            <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl border border-gray-200 p-4 shadow-sm text-sm">
              <Palette size={16} className="text-green-600" />
              <span className="font-medium text-gray-700">Card Designer</span>
              <span className="text-gray-300">·</span>
              <span className="text-gray-500">{rows.length} cards</span>
              <button onClick={() => setStep('data')}
                className="text-xs px-3 py-1 rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-600 transition-colors">
                ← Back to data
              </button>
              <button onClick={() => { setDesign(DEFAULT_DESIGN); localStorage.removeItem('slcm-design') }}
                className="text-xs px-3 py-1 rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-600 transition-colors">
                Reset to defaults
              </button>
              <button onClick={handleExport} disabled={isPrinting}
                className="ml-auto flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold text-sm shadow transition-colors">
                <Printer size={14} /> {isPrinting ? 'Preparing…' : 'Export PDF'}
              </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5">
              {/* Left: live preview + card settings */}
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Eye size={14} className="text-gray-500" />
                    <span className="text-sm font-semibold text-gray-700">Live Preview</span>
                    <span className="text-xs text-gray-400 ml-1">— first row</span>
                  </div>
                  <div className="flex justify-center overflow-auto">
                    <CardPreview design={design} row={previewRow} index={1} total={totalCards} />
                  </div>
                </div>

                {/* Card settings */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-800">Card Settings</h3>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input type="checkbox" checked={design.showIndex}
                          onChange={(e) => setDesign((d) => ({ ...d, showIndex: e.target.checked }))}
                          className="rounded" />
                        <span className="text-xs text-gray-600">Card index</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input type="checkbox" checked={design.showPageNumbers}
                          onChange={(e) => setDesign((d) => ({ ...d, showPageNumbers: e.target.checked }))}
                          className="rounded" />
                        <span className="text-xs text-gray-600">Page numbers</span>
                      </label>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {[
                      { label: 'Width (mm)',   min: 20,  max: 300, key: 'cardWidthMm'   as const },
                      { label: 'Height (mm)',  min: 10,  max: 300, key: 'cardHeightMm'  as const },
                      { label: 'Padding (mm)', min: 0,   max: 20,  key: 'paddingMm'     as const },
                      { label: 'Border (px)',  min: 0,   max: 10,  key: 'borderWidthPx' as const },
                    ].map(({ label, min, max, key }) => (
                      <label key={key} className="space-y-1">
                        <span className="text-xs text-gray-500">{label}</span>
                        <input type="number" min={min} max={max} value={(design as unknown as Record<string, number>)[key]}
                          onChange={(e) => setDesign((d) => ({ ...d, [key]: Number(e.target.value) }))}
                          className="w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-400" />
                      </label>
                    ))}
                    {(['bgColor', 'borderColor'] as const).map((key) => (
                      <label key={key} className="space-y-1">
                        <span className="text-xs text-gray-500">{key === 'bgColor' ? 'Background' : 'Border color'}</span>
                        <div className="flex items-center gap-2">
                          <input type="color" value={design[key]}
                            onChange={(e) => setDesign((d) => ({ ...d, [key]: e.target.value }))}
                            className="w-8 h-8 rounded border border-gray-300 cursor-pointer" />
                          <input type="text" value={design[key]}
                            onChange={(e) => setDesign((d) => ({ ...d, [key]: e.target.value }))}
                            className="flex-1 text-xs border border-gray-300 rounded-lg px-2 py-1.5 font-mono focus:outline-none focus:ring-2 focus:ring-green-400" />
                        </div>
                      </label>
                    ))}
                  </div>
                  <label className="space-y-1 block">
                    <span className="text-xs text-gray-500">Font family</span>
                    <select value={design.fontFamily} onChange={(e) => setDesign((d) => ({ ...d, fontFamily: e.target.value }))}
                      className="w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-green-400">
                      {FONT_FAMILIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                  </label>
                </div>
              </div>

              {/* Right: fields panel */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical size={14} className="text-gray-500" />
                    <h3 className="text-sm font-semibold text-gray-800">Fields</h3>
                    <span className="text-xs text-gray-400">{design.fields.length}</span>
                  </div>
                  <button onClick={addField}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors">
                    <Plus size={13} /> Add
                  </button>
                </div>

                {design.fields.length === 0 && (
                  <p className="text-xs text-gray-400 italic">No fields yet.</p>
                )}

                <div className="space-y-1.5">
                  {design.fields.map((field, idx) => {
                    const isEditing = editingFieldId === field.id
                    const displayKey = field.columnKey === '__static__'
                      ? `"${field.staticText || 'static text'}"` : field.columnKey
                    return (
                      <div key={field.id} className={`rounded-xl border transition-colors ${isEditing ? 'border-green-400 bg-green-50/20' : 'border-gray-200 bg-gray-50/30'}`}>
                        {/* Row header */}
                        <div className="flex items-center gap-2 px-3 py-2 cursor-pointer select-none"
                          onClick={() => setEditingFieldId(isEditing ? null : field.id)}>
                          <GripVertical size={13} className="text-gray-300 flex-shrink-0" />
                          <span className="flex-1 text-sm text-gray-700 truncate font-medium">{displayKey}</span>
                          <span className="text-xs text-gray-400 font-mono">{FONT_SIZE_LABELS[field.fontSize]}</span>
                          <button onClick={(e) => { e.stopPropagation(); moveField(field.id, 'up') }} disabled={idx === 0}
                            className="p-0.5 rounded hover:bg-gray-200 disabled:opacity-30"><ArrowUp size={12} /></button>
                          <button onClick={(e) => { e.stopPropagation(); moveField(field.id, 'down') }} disabled={idx === design.fields.length - 1}
                            className="p-0.5 rounded hover:bg-gray-200 disabled:opacity-30"><ArrowDown size={12} /></button>
                          <button onClick={(e) => { e.stopPropagation(); removeField(field.id) }}
                            className="p-0.5 rounded hover:bg-red-100 text-gray-400 hover:text-red-500"><X size={13} /></button>
                        </div>

                        {/* Expanded editor */}
                        {isEditing && (
                          <div className="border-t border-gray-200 px-3 pb-3 pt-2 space-y-3">
                            <div className="space-y-1">
                              <label className="text-xs text-gray-500">Data source</label>
                              <select value={field.columnKey} onChange={(e) => updateField(field.id, { columnKey: e.target.value })}
                                className="w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-green-400">
                                {OUTPUT_COLUMNS.map((c) => <option key={c} value={c}>{c}</option>)}
                                <option value="__static__">— Static text —</option>
                              </select>
                            </div>

                            {field.columnKey === '__static__' && (
                              <div className="space-y-1">
                                <label className="text-xs text-gray-500">Static text</label>
                                <input type="text" value={field.staticText ?? ''}
                                  onChange={(e) => updateField(field.id, { staticText: e.target.value })}
                                  className="w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-400"
                                  placeholder="Enter text…" />
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <label className="text-xs text-gray-500">Prefix</label>
                                <input type="text" value={field.prefix}
                                  onChange={(e) => updateField(field.id, { prefix: e.target.value })}
                                  className="w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-400" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs text-gray-500">Suffix</label>
                                <input type="text" value={field.suffix}
                                  onChange={(e) => updateField(field.id, { suffix: e.target.value })}
                                  className="w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-400" />
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              <input type="checkbox" id={`lbl-${field.id}`} checked={field.showLabel}
                                onChange={(e) => updateField(field.id, { showLabel: e.target.checked })} className="rounded" />
                              <label htmlFor={`lbl-${field.id}`} className="text-xs text-gray-500 whitespace-nowrap">Label prefix</label>
                              {field.showLabel && (
                                <input type="text" value={field.label ?? ''}
                                  onChange={(e) => updateField(field.id, { label: e.target.value })}
                                  className="flex-1 text-sm border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-400"
                                  placeholder="Label" />
                              )}
                            </div>

                            <div className="flex flex-wrap gap-2 items-center">
                              <select value={field.fontSize} onChange={(e) => updateField(field.id, { fontSize: e.target.value as FontSize })}
                                className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-green-400">
                                {(Object.keys(FONT_SIZE_LABELS) as FontSize[]).map((k) => (
                                  <option key={k} value={k}>{FONT_SIZE_LABELS[k]}</option>
                                ))}
                              </select>
                              <select value={field.fontWeight} onChange={(e) => updateField(field.id, { fontWeight: e.target.value as FontWeight })}
                                className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-green-400">
                                <option value="normal">Normal</option>
                                <option value="semibold">Semibold</option>
                                <option value="bold">Bold</option>
                              </select>
                              <button onClick={() => updateField(field.id, { italic: !field.italic })} title="Italic"
                                className={`p-1.5 rounded-lg border text-xs transition-colors ${field.italic ? 'bg-gray-800 text-white border-gray-800' : 'border-gray-300 hover:bg-gray-50'}`}>
                                <Bold size={12} className="italic" />
                              </button>
                              {(['left', 'center', 'right'] as TextAlign[]).map((a) => {
                                const Icon = a === 'left' ? AlignLeft : a === 'center' ? AlignCenter : AlignRight
                                return (
                                  <button key={a} onClick={() => updateField(field.id, { textAlign: a })} title={a}
                                    className={`p-1.5 rounded-lg border text-xs transition-colors ${field.textAlign === a ? 'bg-gray-800 text-white border-gray-800' : 'border-gray-300 hover:bg-gray-50'}`}>
                                    <Icon size={12} />
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
