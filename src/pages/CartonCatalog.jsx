import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import * as XLSX from 'xlsx'

// ── Mini 3-D card preview ─────────────────────────────────────────────────────
const FACE_COLORS = ['#D97706','#B45309','#F59E0B','#92400E','#FBBF24','#D97706']

function PreviewBox({ w, h, d }) {
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 5, 3]} intensity={1.2} />
      <mesh position={[0, h / 2, 0]}>
        <boxGeometry args={[w, h, d]} />
        {FACE_COLORS.map((c, i) => (
          <meshStandardMaterial key={i} attach={`material-${i}`} color={c} roughness={0.75} />
        ))}
      </mesh>
      <ContactShadows position={[0, -0.01, 0]} opacity={0.4} scale={Math.max(w, d) * 4} blur={1.6} far={h * 1.2} />
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={3}
        minPolarAngle={Math.PI / 4} maxPolarAngle={Math.PI / 2.2} />
    </>
  )
}

// ── Import preview modal ──────────────────────────────────────────────────────
function ImportPreview({ rows, onConfirm, onCancel }) {
  const [checked, setChecked] = useState(() => rows.map((_, i) => i))
  const toggle = (i) => setChecked(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i])
  const toggleAll = () => setChecked(p => p.length === rows.length ? [] : rows.map((_, i) => i))

  const cellStyle = { padding: '7px 10px', fontSize: '0.78rem', color: '#d1d5db', borderBottom: '1px solid rgba(255,255,255,0.06)', whiteSpace: 'nowrap' }
  const headStyle = { ...cellStyle, color: '#f59e0b', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em' }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
    }}>
      <div style={{
        background: '#1f2937', borderRadius: 18, padding: '24px 28px',
        maxWidth: '90vw', width: 620, maxHeight: '80vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 64px rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.1)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#f9fafb' }}>
            Import Preview
            <span style={{ marginLeft: 10, fontSize: '0.75rem', color: '#6b7280', fontWeight: 400 }}>
              {checked.length} of {rows.length} selected
            </span>
          </h2>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 20 }}>✕</button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, background: '#111827' }}>
              <tr>
                <th style={{ ...headStyle, width: 36 }}>
                  <input type="checkbox" checked={checked.length === rows.length} onChange={toggleAll} />
                </th>
                <th style={headStyle}>Name</th>
                <th style={headStyle}>W (mm)</th>
                <th style={headStyle}>H (mm)</th>
                <th style={headStyle}>D (mm)</th>
                <th style={headStyle}>Description</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} style={{ background: checked.includes(i) ? 'rgba(245,158,11,0.05)' : 'transparent' }}>
                  <td style={cellStyle}>
                    <input type="checkbox" checked={checked.includes(i)} onChange={() => toggle(i)} />
                  </td>
                  <td style={{ ...cellStyle, color: r.error ? '#f87171' : '#f9fafb', fontWeight: 600 }}>
                    {r.name || <span style={{ color: '#f87171' }}>Missing</span>}
                    {r.error && <span style={{ marginLeft: 6, fontSize: '0.68rem', color: '#f87171' }}>({r.error})</span>}
                  </td>
                  <td style={cellStyle}>{r.width_mm ?? '—'}</td>
                  <td style={cellStyle}>{r.height_mm ?? '—'}</td>
                  <td style={cellStyle}>{r.depth_mm ?? '—'}</td>
                  <td style={{ ...cellStyle, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.description || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '9px 0', borderRadius: 9, border: '1.5px solid #374151', background: 'transparent', color: '#9ca3af', cursor: 'pointer', fontSize: '0.88rem' }}>Cancel</button>
          <button
            onClick={() => onConfirm(checked.map(i => rows[i]).filter(r => !r.error))}
            disabled={checked.filter(i => !rows[i].error).length === 0}
            style={{ flex: 2, padding: '9px 0', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#1f2937', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem' }}
          >
            Import {checked.filter(i => !rows[i]?.error).length} Carton{checked.filter(i => !rows[i]?.error).length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Excel parser ──────────────────────────────────────────────────────────────
function parseExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const wb   = XLSX.read(e.target.result, { type: 'array' })
        const ws   = wb.Sheets[wb.SheetNames[0]]
        const data = XLSX.utils.sheet_to_json(ws, { defval: '' })
        const rows = data.map(row => {
          // case-insensitive key lookup
          const get = (...keys) => {
            for (const k of keys) {
              const found = Object.keys(row).find(rk => rk.toLowerCase().trim() === k.toLowerCase())
              if (found !== undefined) return row[found]
            }
            return ''
          }
          const name     = String(get('name') || '').trim()
          const width_mm = parseFloat(get('width', 'w', 'width_mm'))
          const height_mm= parseFloat(get('height', 'h', 'height_mm'))
          const depth_mm = parseFloat(get('depth', 'd', 'depth_mm'))
          const description = String(get('description', 'desc', 'note', 'notes') || '').trim()

          let error = null
          if (!name)                   error = 'name required'
          else if (isNaN(width_mm))   error = 'invalid width'
          else if (isNaN(height_mm))  error = 'invalid height'
          else if (isNaN(depth_mm))   error = 'invalid depth'

          return { name, width_mm, height_mm, depth_mm, description, error }
        })
        resolve(rows)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

const DEFAULT_FORM = { name: '', description: '', width: 1.6, height: 2.0, depth: 1.2 }

function CartonForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial ?? DEFAULT_FORM)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    onSave(form)
  }

  const labelStyle = { fontSize: '0.75rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }
  const inputStyle = {
    width: '100%', padding: '8px 10px', borderRadius: 8,
    border: '1.5px solid #d1d5db', background: '#f9fafb',
    fontSize: '0.9rem', color: '#111827', outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
    }}>
      <form onSubmit={handleSubmit} style={{
        background: '#1f2937', borderRadius: 18, padding: '28px 32px', minWidth: 360, maxWidth: '90vw',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)', color: '#f9fafb',
        border: '1px solid rgba(255,255,255,0.1)',
      }}>
        <h2 style={{ margin: '0 0 20px', fontSize: '1.2rem', fontWeight: 700 }}>
          {initial ? 'Edit Carton' : 'New Carton'}
        </h2>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Name</label>
          <input style={{ ...inputStyle, marginTop: 4 }} value={form.name}
            onChange={e => set('name', e.target.value)} placeholder="e.g. Standard Export Box" required />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Description</label>
          <textarea style={{ ...inputStyle, marginTop: 4, resize: 'vertical', minHeight: 64 }}
            value={form.description} onChange={e => set('description', e.target.value)}
            placeholder="Notes, material, usage…" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
          {[['width','W'],['height','H'],['depth','D']].map(([key, lbl]) => (
            <div key={key}>
              <label style={labelStyle}>{lbl} (m)</label>
              <input type="number" step="0.1" min="0.1" max="10"
                style={{ ...inputStyle, marginTop: 4 }}
                value={form[key]}
                onChange={e => set(key, parseFloat(e.target.value) || 0.1)} />
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" onClick={onCancel} style={{
            flex: 1, padding: '10px 0', borderRadius: 9, border: '1.5px solid #374151',
            background: 'transparent', color: '#9ca3af', cursor: 'pointer', fontSize: '0.9rem',
          }}>Cancel</button>
          <button type="submit" style={{
            flex: 2, padding: '10px 0', borderRadius: 9, border: 'none',
            background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#1f2937',
            cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem',
          }}>Save</button>
        </div>
      </form>
    </div>
  )
}

// ── Card ─────────────────────────────────────────────────────────────────────
function CartonCard({ carton, isSelected, onClick, onEdit, onDelete, onView }) {
  return (
    <div
      onClick={onClick}
      style={{
        borderRadius: 18, overflow: 'hidden', cursor: 'pointer',
        border: `2px solid ${isSelected ? '#f59e0b' : 'rgba(255,255,255,0.08)'}`,
        background: isSelected
          ? 'linear-gradient(160deg,rgba(245,158,11,0.15),rgba(30,30,40,0.9))'
          : 'rgba(255,255,255,0.04)',
        boxShadow: isSelected ? '0 0 28px rgba(245,158,11,0.35)' : '0 4px 20px rgba(0,0,0,0.3)',
        transform: isSelected ? 'scale(1.035)' : 'scale(1)',
        transition: 'all 0.2s ease',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* 3-D mini preview */}
      <div style={{ height: 160, background: '#111827' }}>
        <Canvas camera={{ position: [0, carton.height * 0.9, carton.depth * 2.4], fov: 42 }}
          style={{ background: 'transparent' }}>
          <PreviewBox w={carton.width} h={carton.height} d={carton.depth} />
        </Canvas>
      </div>

      {/* Info */}
      <div style={{ padding: '14px 16px', flex: 1 }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: '#f9fafb', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {carton.name}
        </p>
        <p style={{ margin: '4px 0 0', fontSize: '0.72rem', color: '#9ca3af' }}>
          {carton.width.toFixed(1)} × {carton.height.toFixed(1)} × {carton.depth.toFixed(1)} m
        </p>
        {carton.description ? (
          <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: '#6b7280', lineHeight: 1.4,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {carton.description}
          </p>
        ) : null}
      </div>

      {/* Actions */}
      {isSelected && (
        <div style={{ display: 'flex', gap: 6, padding: '0 12px 12px' }}>
          <button onClick={(e) => { e.stopPropagation(); onView() }} style={actionBtn('#f59e0b','#1f2937')}>
            Open Viewer
          </button>
          <button onClick={(e) => { e.stopPropagation(); onEdit() }} style={actionBtn('transparent','#9ca3af', '1.5px solid #374151')}>
            Edit
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete() }} style={actionBtn('#ef4444','#fff')}>
            ✕
          </button>
        </div>
      )}
    </div>
  )
}

function actionBtn(bg, color, border = 'none') {
  return {
    flex: bg === '#ef4444' ? '0 0 auto' : 1,
    padding: '7px 10px', borderRadius: 8,
    border, background: bg, color, cursor: 'pointer',
    fontSize: '0.78rem', fontWeight: 600,
  }
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function CartonCatalog() {
  const navigate              = useNavigate()
  const [cartons, setCartons] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [showForm, setShowForm]     = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [loading, setLoading]       = useState(true)
  const [importRows, setImportRows] = useState(null) // rows for preview modal
  const importRef = useRef(null)

  const load = useCallback(async () => {
    const res = await window.ipcRenderer.invoke('carton:getAll')
    if (res.success) {
      setCartons(res.cartons)
      if (!selectedId && res.cartons.length) setSelectedId(res.cartons[0].id)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = async (data) => {
    if (editTarget) {
      await window.ipcRenderer.invoke('carton:update', editTarget.id, data)
    } else {
      const res = await window.ipcRenderer.invoke('carton:add', data)
      if (res.success) setSelectedId(Number(res.id))
    }
    setShowForm(false)
    setEditTarget(null)
    await load()
  }

  const handleDelete = async (id) => {
    await window.ipcRenderer.invoke('carton:delete', id)
    setSelectedId(null)
    await load()
  }

  const openViewer = (carton) => {
    navigate('/carton-viewer', { state: { carton } })
  }

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const rows = await parseExcel(file)
      setImportRows(rows)
    } catch {
      alert('Could not read the Excel file. Make sure it is a valid .xlsx or .xls file.')
    }
  }

  const handleImportConfirm = async (validRows) => {
    for (const r of validRows) {
      await window.ipcRenderer.invoke('carton:add', {
        name:        r.name,
        description: r.description,
        width:       r.width_mm  / 1000,
        height:      r.height_mm / 1000,
        depth:       r.depth_mm  / 1000,
      })
    }
    setImportRows(null)
    await load()
  }

  const selectedCarton = cartons.find(c => c.id === selectedId)

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'linear-gradient(160deg,#0f172a 0%,#1e1b2e 60%,#0f172a 100%)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 28px 0',
      }}>
        <div>
          <p style={{ margin: 0, fontSize: '0.7rem', letterSpacing: '0.2em', color: '#f59e0b', textTransform: 'uppercase', fontWeight: 700 }}>
            Catalog
          </p>
          <h1 style={{ margin: '2px 0 0', fontSize: '1.6rem', fontWeight: 800, color: '#f9fafb' }}>
            Carton Library
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {/* Import from Excel */}
          <input ref={importRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleImportFile} />
          <button
            onClick={() => importRef.current?.click()}
            style={{
              padding: '10px 18px', borderRadius: 12,
              border: '1.5px solid rgba(245,158,11,0.4)',
              background: 'rgba(245,158,11,0.08)',
              color: '#f59e0b', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem',
            }}
          >⬆ Import Excel</button>
          <button
            onClick={() => { setEditTarget(null); setShowForm(true) }}
            style={{
              padding: '10px 20px', borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg,#f59e0b,#d97706)',
              color: '#1f2937', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem',
              boxShadow: '0 4px 16px rgba(245,158,11,0.3)',
            }}
          >+ New Carton</button>
        </div>
      </div>

      {/* ── Selected carton hero panel ── */}
      {selectedCarton && (
        <div style={{
          margin: '16px 28px 0',
          borderRadius: 18,
          background: 'rgba(245,158,11,0.07)',
          border: '1px solid rgba(245,158,11,0.2)',
          padding: '16px 24px',
          display: 'flex', alignItems: 'center', gap: 24,
        }}>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: '0.65rem', color: '#f59e0b', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Selected</p>
            <h2 style={{ margin: '4px 0 0', fontSize: '1.4rem', fontWeight: 800, color: '#f9fafb' }}>{selectedCarton.name}</h2>
            <p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: '#9ca3af', lineHeight: 1.5 }}>{selectedCarton.description || '—'}</p>
          </div>
          <div style={{ display: 'flex', gap: 20, textAlign: 'center' }}>
            {[['W', selectedCarton.width], ['H', selectedCarton.height], ['D', selectedCarton.depth]].map(([lbl, val]) => (
              <div key={lbl}>
                <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#f59e0b' }}>{Number(val).toFixed(1)}</p>
                <p style={{ margin: 0, fontSize: '0.65rem', color: '#6b7280', letterSpacing: '0.1em' }}>{lbl} (m)</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => openViewer(selectedCarton)}
            style={{
              padding: '12px 24px', borderRadius: 12, border: 'none', whiteSpace: 'nowrap',
              background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#1f2937',
              fontWeight: 800, cursor: 'pointer', fontSize: '0.95rem',
              boxShadow: '0 4px 20px rgba(245,158,11,0.4)',
            }}
          >▶ Open Viewer</button>
        </div>
      )}

      {/* ── Grid ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 28px 28px' }}>
        {loading ? (
          <div style={{ color: '#6b7280', textAlign: 'center', paddingTop: 60 }}>Loading…</div>
        ) : cartons.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 80 }}>
            <p style={{ fontSize: '2.5rem' }}>📦</p>
            <p style={{ color: '#6b7280', marginTop: 8, fontSize: '0.95rem' }}>No cartons yet. Create your first one.</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
            gap: 16,
          }}>
            {cartons.map(c => (
              <CartonCard
                key={c.id}
                carton={c}
                isSelected={c.id === selectedId}
                onClick={() => setSelectedId(c.id)}
                onEdit={() => { setEditTarget(c); setShowForm(true) }}
                onDelete={() => handleDelete(c.id)}
                onView={() => openViewer(c)}
              />
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <CartonForm
          initial={editTarget ? {
            name: editTarget.name,
            description: editTarget.description,
            width: editTarget.width,
            height: editTarget.height,
            depth: editTarget.depth,
          } : null}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditTarget(null) }}
        />
      )}

      {importRows && (
        <ImportPreview
          rows={importRows}
          onConfirm={handleImportConfirm}
          onCancel={() => setImportRows(null)}
        />
      )}
    </div>
  )
}
