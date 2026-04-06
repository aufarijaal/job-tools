import { useRef, useState, useMemo, useCallback, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, ContactShadows } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'

// ── Constants ─────────────────────────────────────────────────────────────────
const FACE_COLORS = ['#D97706','#B45309','#F59E0B','#92400E','#FBBF24','#D97706']

const BUILT_IN_STICKERS = [
  { id: 'fragile', label: 'Fragile',     emoji: '⚠️', bg: '#fef9c3', aspect: 1 },
  { id: 'thisway', label: 'This Way Up', emoji: '⬆️', bg: '#dbeafe', aspect: 1 },
  { id: 'recycle', label: 'Recycle',     emoji: '♻️', bg: '#dcfce7', aspect: 1 },
  { id: 'star',    label: 'Star',        emoji: '⭐', bg: '#fef3c7', aspect: 1 },
  { id: 'heart',   label: 'Heart',       emoji: '❤️', bg: '#fee2e2', aspect: 1 },
  { id: 'check',   label: 'Approved',    emoji: '✅', bg: '#d1fae5', aspect: 1 },
]

const DEFAULT_DIMS = { w: 1.6, h: 2.0, d: 1.2 }

// ── Helpers ───────────────────────────────────────────────────────────────────
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y,     x + w, y + r,     r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x,     y + h, x,     y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y,         x + r, y,         r)
  ctx.closePath()
}

function makeEmojiTexture(emoji, bg) {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  roundRect(ctx, 12, 12, size - 24, size - 24, 28)
  ctx.fillStyle = bg
  ctx.fill()
  ctx.strokeStyle = 'rgba(0,0,0,0.2)'
  ctx.lineWidth = 5
  ctx.stroke()
  ctx.font = `${Math.floor(size * 0.56)}px serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(emoji, size / 2, size / 2)
  return new THREE.CanvasTexture(canvas)
}

function loadImageTexture(url) {
  const tex = new THREE.TextureLoader().load(url)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function getFaceName(n) {
  if (n.x >  0.5) return 'right'
  if (n.x < -0.5) return 'left'
  if (n.y >  0.5) return 'top'
  if (n.y < -0.5) return 'bottom'
  if (n.z >  0.5) return 'front'
  return 'back'
}

function getFaceRotation(n) {
  if (n.x >  0.5) return [0,  -Math.PI / 2, 0]
  if (n.x < -0.5) return [0,   Math.PI / 2, 0]
  if (n.y >  0.5) return [-Math.PI / 2, 0,  0]
  if (n.y < -0.5) return [ Math.PI / 2, 0,  0]
  if (n.z >  0.5) return [0, 0, 0]
  return [0, Math.PI, 0]
}

// ── 3D components ─────────────────────────────────────────────────────────────
function CartonBox({ dims, onFaceClick }) {
  return (
    <mesh position={[0, dims.h / 2, 0]} onClick={onFaceClick}>
      <boxGeometry args={[dims.w, dims.h, dims.d]} />
      {FACE_COLORS.map((color, i) => (
        <meshStandardMaterial key={i} attach={`material-${i}`} color={color} roughness={0.8} metalness={0.05} />
      ))}
    </mesh>
  )
}

function StickerMesh({ sticker, allTypes, isActive, onSelect, onMove, orbitRef }) {
  const { camera, gl } = useThree()
  const meshRef       = useRef(null)
  const isDragging    = useRef(false)
  const hasMoved      = useRef(false)
  const justSelected  = useRef(false)
  const downPos       = useRef({ x: 0, y: 0 })
  const dragPlane     = useRef(new THREE.Plane())

  // Keep refs fresh so effect closure never goes stale
  const stickerRef  = useRef(sticker)
  const isActiveRef = useRef(isActive)
  const onMoveRef   = useRef(onMove)
  const onSelectRef = useRef(onSelect)
  useEffect(() => { stickerRef.current  = sticker  }, [sticker])
  useEffect(() => { isActiveRef.current = isActive }, [isActive])
  useEffect(() => { onMoveRef.current   = onMove   }, [onMove])
  useEffect(() => { onSelectRef.current = onSelect }, [onSelect])

  const type   = useMemo(() => allTypes.find(t => t.id === sticker.typeId), [sticker.typeId, allTypes])
  const aspect = type?.aspect ?? 1
  const sz     = sticker.size ?? 0.3
  const planeW = sz * aspect
  const planeH = sz

  const texture = useMemo(() => {
    if (!type) return null
    if (type.imageUrl) return loadImageTexture(type.imageUrl)
    return makeEmojiTexture(type.emoji, type.bg)
  }, [sticker.typeId, allTypes])

  // ── Native capture-phase handlers ─────────────────────────────────────────
  // Capture phase fires BEFORE any bubble-phase listener (including OrbitControls),
  // regardless of addEventListener registration order.
  useEffect(() => {
    const el     = gl.domElement
    const ray    = new THREE.Raycaster()
    const THRESH = 5 // px to distinguish tap from drag

    const onDown = (e) => {
      if (!meshRef.current) return
      const rect = el.getBoundingClientRect()
      const nx   = ((e.clientX - rect.left) / rect.width)  *  2 - 1
      const ny   = -((e.clientY - rect.top) / rect.height) *  2 + 1
      ray.setFromCamera({ x: nx, y: ny }, camera)
      if (ray.intersectObject(meshRef.current, false).length === 0) return

      // We own this event — block OrbitControls entirely
      e.stopPropagation()

      isDragging.current   = true
      hasMoved.current     = false
      justSelected.current = !isActiveRef.current
      downPos.current      = { x: e.clientX, y: e.clientY }

      if (!isActiveRef.current) onSelectRef.current(stickerRef.current.id)

      if (orbitRef?.current) orbitRef.current.enabled = false

      const s = stickerRef.current
      const n = new THREE.Vector3(...(s.normal ?? [0, 0, 1]))
      dragPlane.current.setFromNormalAndCoplanarPoint(n, new THREE.Vector3(...s.position))

      try { el.setPointerCapture(e.pointerId) } catch (_) {}
    }

    const onMove = (e) => {
      if (!isDragging.current) return
      const dx = e.clientX - downPos.current.x
      const dy = e.clientY - downPos.current.y
      if (Math.sqrt(dx * dx + dy * dy) < THRESH) return
      hasMoved.current = true
      const rect = el.getBoundingClientRect()
      const nx   = ((e.clientX - rect.left) / rect.width)  *  2 - 1
      const ny   = -((e.clientY - rect.top) / rect.height) *  2 + 1
      ray.setFromCamera({ x: nx, y: ny }, camera)
      const pt = new THREE.Vector3()
      if (ray.ray.intersectPlane(dragPlane.current, pt))
        onMoveRef.current(stickerRef.current.id, [pt.x, pt.y, pt.z])
    }

    const onUp = () => {
      if (!isDragging.current) return
      isDragging.current = false
      if (orbitRef?.current) orbitRef.current.enabled = true
      // Tap on already-selected sticker (second tap, no drag) → deselect
      if (isActiveRef.current && !hasMoved.current && !justSelected.current)
        onSelectRef.current(stickerRef.current.id)
      justSelected.current = false
    }

    el.addEventListener('pointerdown', onDown, { capture: true })
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup',   onUp)
    return () => {
      el.removeEventListener('pointerdown', onDown, { capture: true })
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup',   onUp)
    }
  }, [gl, camera, orbitRef]) // everything else accessed via refs

  return (
    <group position={sticker.position} rotation={sticker.rotation}>
      {isActive && (
        <mesh>
          <planeGeometry args={[planeW + 0.06, planeH + 0.06]} />
          <meshBasicMaterial color="#3b82f6" transparent opacity={0.85} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      )}
      <mesh ref={meshRef}>
        <planeGeometry args={[planeW, planeH]} />
        <meshBasicMaterial map={texture} transparent alphaTest={0.02} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

function Ground({ dims }) {
  return (
    <ContactShadows
      position={[0, -0.01, 0]}
      opacity={0.45}
      scale={Math.max(dims.w, dims.d) * 5}
      blur={1.8}
      far={dims.h * 1.2}
      color="#000000"
    />
  )
}

// ── Shared button style ───────────────────────────────────────────────────────
const iconBtn = (active, extra = {}) => ({
  width: 38, height: 38, borderRadius: 8, cursor: 'pointer',
  border: `2px solid ${active ? '#3b82f6' : 'transparent'}`,
  background: active ? '#eff6ff' : '#f9fafb',
  outline: active ? '2px solid #93c5fd' : 'none',
  outlineOffset: '1px', fontSize: 18, flexShrink: 0,
  transform: active ? 'scale(1.12)' : 'scale(1)',
  transition: 'transform 0.1s, border-color 0.1s',
  ...extra,
})

// ── Page ──────────────────────────────────────────────────────────────────────
export default function CartonViewer() {
  const location = useLocation()
  const navigate = useNavigate()
  const catalogCarton = location.state?.carton ?? null

  const [stickerTypes,   setStickerTypes]   = useState(BUILT_IN_STICKERS)
  const [stickers,       setStickers]       = useState([])
  const [pendingTypeId,  setPendingTypeId]  = useState(null)
  const [activeId,       setActiveId]       = useState(null)
  const [boxDims,        setBoxDims]        = useState(
    catalogCarton
      ? { w: catalogCarton.width, h: catalogCarton.height, d: catalogCarton.depth }
      : DEFAULT_DIMS
  )
  const [showDims,       setShowDims]       = useState(false)
  const uploadRef = useRef(null)
  const orbitRef  = useRef(null)

  // ── handlers ──────────────────────────────────────────────────────────────
  const handleFaceClick = useCallback((e) => {
    if (!pendingTypeId) {
      setActiveId(null) // click on blank box area deselects
      return
    }
    e.stopPropagation()
    const { point, face, object } = e
    const wn  = face.normal.clone().transformDirection(object.matrixWorld).normalize()
    const OFF = 0.007
    setStickers(prev => [...prev, {
      id:       Date.now(),
      typeId:   pendingTypeId,
      position: [point.x + wn.x * OFF, point.y + wn.y * OFF, point.z + wn.z * OFF],
      rotation: getFaceRotation(wn),
      face:     getFaceName(wn),
      normal:   [wn.x, wn.y, wn.z],
      size:     0.3,
    }])
    setPendingTypeId(null)
  }, [pendingTypeId])

  const handleStickerSelect = useCallback((id) => {
    setActiveId(prev => prev === id ? null : id)
    setPendingTypeId(null)
  }, [])

  const handleStickerMove = useCallback((id, pos) => {
    setStickers(prev => prev.map(s => s.id === id ? { ...s, position: pos } : s))
  }, [])

  const deleteActive = () => {
    setStickers(prev => prev.filter(s => s.id !== activeId))
    setActiveId(null)
  }

  const updateActiveSize = (val) =>
    setStickers(prev => prev.map(s => s.id === activeId ? { ...s, size: Number(val) } : s))

  const handleUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const aspect = img.naturalWidth / img.naturalHeight
      const newType = {
        id:       `custom-${Date.now()}`,
        label:    file.name.replace(/\.[^.]+$/, ''),
        imageUrl: url,
        aspect,
        bg:       '#f3f4f6',
      }
      setStickerTypes(prev => [...prev, newType])
      setPendingTypeId(newType.id)
      setActiveId(null)
    }
    img.src = url
  }

  const activeSticker = stickers.find(s => s.id === activeId)

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#f3f4f6' }}>

      {/* Title */}
      <h1 style={{
        position: 'absolute', top: '0.75rem', left: 0, right: 0,
        textAlign: 'center', zIndex: 10, fontSize: '1.1rem',
        fontWeight: 600, color: '#374151', pointerEvents: 'none',
      }}>
        Carton Viewer
      </h1>

      {/* ── Catalog HUD (bottom-left) ── */}
      {catalogCarton && (
        <div style={{
          position: 'absolute', bottom: '1.5rem', left: '1.5rem', zIndex: 20,
          pointerEvents: 'none', userSelect: 'none',
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          {/* Decorative line */}
          <div style={{ width: 36, height: 3, background: '#f59e0b', borderRadius: 2 }} />
          <p style={{ margin: 0, fontSize: '0.65rem', letterSpacing: '0.18em', color: '#f59e0b', fontWeight: 700, textTransform: 'uppercase' }}>
            Carton
          </p>
          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#1f2937', lineHeight: 1.1 }}>
            {catalogCarton.name}
          </p>
          <p style={{ margin: 0, fontSize: '0.72rem', color: '#6b7280' }}>
            {catalogCarton.width.toFixed(1)} &times; {catalogCarton.height.toFixed(1)} &times; {catalogCarton.depth.toFixed(1)} m
          </p>
          {catalogCarton.description ? (
            <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#4b5563', maxWidth: 240, lineHeight: 1.4 }}>
              {catalogCarton.description}
            </p>
          ) : null}
          <button
            onClick={() => navigate('/carton-catalog')}
            style={{
              marginTop: 8, padding: '5px 12px', borderRadius: 7,
              border: '1.5px solid #d1d5db', background: 'rgba(255,255,255,0.85)',
              cursor: 'pointer', fontSize: '0.72rem', color: '#374151', fontWeight: 600,
              pointerEvents: 'all',
            }}
          >← Back to Catalog</button>
        </div>
      )}

      {/* ── Sticker toolbar ── */}
      <div style={{
        position: 'absolute', top: '3rem', left: '50%', transform: 'translateX(-50%)',
        zIndex: 20, display: 'flex', gap: '6px', alignItems: 'center',
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(10px)',
        borderRadius: '12px', padding: '6px 10px',
        boxShadow: '0 2px 14px rgba(0,0,0,0.13)',
        maxWidth: 'calc(100vw - 6rem)', flexWrap: 'wrap', justifyContent: 'center',
      }}>
        {stickerTypes.map(s => (
          <button
            key={s.id}
            title={s.label}
            onClick={() => { setPendingTypeId(prev => prev === s.id ? null : s.id); setActiveId(null) }}
            style={{ ...iconBtn(pendingTypeId === s.id, { padding: 2, overflow: 'hidden', background: s.bg ?? '#f9fafb' }) }}
          >
            {s.imageUrl
              ? <img src={s.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
              : s.emoji}
          </button>
        ))}

        <input ref={uploadRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload} />
        <button
          title="Upload custom sticker"
          onClick={() => uploadRef.current?.click()}
          style={{
            width: 38, height: 38, borderRadius: 8, flexShrink: 0,
            border: '2px dashed #9ca3af', background: '#f9fafb',
            cursor: 'pointer', fontSize: 18,
          }}
        >➕</button>

        {activeSticker && (
          <>
            <div style={{ width: 1, height: 28, background: '#e5e7eb', margin: '0 2px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: '0.72rem', color: '#6b7280', whiteSpace: 'nowrap' }}>Size</span>
              <input
                type="range" min="0.08" max="1.2" step="0.04"
                value={activeSticker.size ?? 0.3}
                onChange={e => updateActiveSize(e.target.value)}
                style={{ width: 80, cursor: 'pointer' }}
              />
            </div>
            <button
              onClick={deleteActive}
              title="Remove selected sticker"
              style={{ ...iconBtn(false, { border: '2px solid #ef4444', background: '#fee2e2' }) }}
            >🗑️</button>
          </>
        )}
      </div>

      {/* ── Dimensions toggle ── */}
      <button
        onClick={() => setShowDims(p => !p)}
        title="Box dimensions"
        style={{
          position: 'absolute', top: '3rem', right: '1rem', zIndex: 25,
          ...iconBtn(showDims, {
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: `2px solid ${showDims ? '#3b82f6' : '#d1d5db'}`,
            background: showDims ? '#eff6ff' : 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(10px)',
          }),
        }}
      >📐</button>

      {/* ── Dimensions panel ── */}
      {showDims && (
        <div style={{
          position: 'absolute', top: '5.5rem', right: '1rem', zIndex: 24,
          background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(10px)',
          borderRadius: 12, padding: '14px 16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)', minWidth: 190,
        }}>
          <p style={{ margin: '0 0 10px', fontSize: '0.8rem', fontWeight: 600, color: '#1f2937' }}>
            Box Dimensions
          </p>
          {[['w','Width'],['h','Height'],['d','Depth']].map(([key, label]) => (
            <label key={key} style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 10 }}>
              <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>
                {label}: <strong>{boxDims[key].toFixed(1)}</strong>
              </span>
              <input
                type="range" min="0.3" max="5.0" step="0.1"
                value={boxDims[key]}
                onChange={e => setBoxDims(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                style={{ width: '100%', cursor: 'pointer' }}
              />
            </label>
          ))}
          <button
            onClick={() => setBoxDims(DEFAULT_DIMS)}
            style={{
              width: '100%', padding: '5px 0', borderRadius: 6,
              border: '1px solid #d1d5db', background: '#f9fafb',
              cursor: 'pointer', fontSize: '0.75rem', color: '#374151',
            }}
          >Reset to default</button>
        </div>
      )}

      {/* Placement hint */}
      {pendingTypeId && (
        <div style={{
          position: 'absolute', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)',
          zIndex: 20, background: 'rgba(37,99,235,0.92)', color: '#fff',
          padding: '6px 18px', borderRadius: 9999, fontSize: '0.82rem',
          pointerEvents: 'none', whiteSpace: 'nowrap',
        }}>
          Click on the box to place · click button again to cancel
        </div>
      )}
      {activeSticker && !pendingTypeId && (
        <div style={{
          position: 'absolute', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)',
          zIndex: 20, background: 'rgba(55,65,81,0.88)', color: '#fff',
          padding: '6px 18px', borderRadius: 9999, fontSize: '0.82rem',
          pointerEvents: 'none', whiteSpace: 'nowrap',
        }}>
          Drag sticker to move · tap again to deselect
        </div>
      )}

      {/* ── 3D Canvas ── */}
      <div style={{ width: '100%', height: '100%' }}>
        <Canvas
          camera={{ position: [0, 1.8, 4.5], fov: 45, near: 0.1, far: 100 }}
          style={{ background: '#f3f4f6' }}
        >
          <ambientLight intensity={0.6} />
          <directionalLight position={[4, 8, 4]} intensity={1.4} />

          <CartonBox dims={boxDims} onFaceClick={handleFaceClick} />

          {stickers.map(s => (
            <StickerMesh
              key={s.id}
              sticker={s}
              allTypes={stickerTypes}
              isActive={s.id === activeId}
              onSelect={handleStickerSelect}
              onMove={handleStickerMove}
              orbitRef={orbitRef}
            />
          ))}

          <Ground dims={boxDims} />

          <OrbitControls
            ref={orbitRef}
            enableZoom={true}
            enablePan={true}
            enableRotate={true}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2.05}
            minDistance={2}
            maxDistance={10}
          />
        </Canvas>
      </div>
    </div>
  )
}
