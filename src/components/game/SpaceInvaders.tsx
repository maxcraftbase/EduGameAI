'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

const INVADER_COLS = 4
const INVADER_ROWS = 2
const SHIP_SPEED = 8
const BULLET_SPEED = 12
const INVADER_DROP = 28
const INVADER_SPEED_MS = 900
const LIVES_MAX = 3

interface Invader {
  id: number
  text: string
  isCorrect: boolean
  col: number
  row: number
  alive: boolean
  x: number
  y: number
}

interface Bullet {
  id: number
  x: number
  y: number
}

interface Props {
  text: string
  loesungen: string[]
  distraktoren: string[]
  feedback: { bei_korrekt: string; bei_falsch: string }
  onAntwort: (antworten: string[], korrekt: boolean) => void
}

function buildInvaders(loesungen: string[], distraktoren: string[]): Invader[] {
  const all = [
    ...loesungen.map((t) => ({ text: t, isCorrect: true })),
    ...distraktoren.map((t) => ({ text: t, isCorrect: false })),
  ]
  // shuffle
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]]
  }
  return all.map((item, idx) => {
    const col = idx % INVADER_COLS
    const row = Math.floor(idx / INVADER_COLS)
    return {
      id: idx,
      text: item.text,
      isCorrect: item.isCorrect,
      col,
      row,
      alive: true,
      x: col * 25 + 2,
      y: row * 14 + 8,
    }
  })
}

export function SpaceInvaders({ text, loesungen, distraktoren, feedback, onAntwort }: Props) {
  const [invaders, setInvaders] = useState<Invader[]>(() => buildInvaders(loesungen, distraktoren))
  const [shipX, setShipX] = useState(48) // percentage 0-96
  const [bullets, setBullets] = useState<Bullet[]>([])
  const [lives, setLives] = useState(LIVES_MAX)
  const [score, setScore] = useState(0)
  const [direction, setDirection] = useState<1 | -1>(1)
  const [hits, setHits] = useState<{ id: number; correct: boolean }[]>([])
  const [finished, setFinished] = useState(false)
  const [won, setWon] = useState(false)
  const [keysDown, setKeysDown] = useState<Set<string>>(new Set())

  const bulletIdRef = useRef(0)
  const animFrameRef = useRef<number>(0)
  const lastMoveRef = useRef<number>(0)
  const lastShipMoveRef = useRef<number>(0)
  const finishedRef = useRef(false)

  const totalCorrect = loesungen.length

  // Keyboard
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      setKeysDown((prev) => new Set([...prev, e.key]))
      if (e.key === ' ' || e.key === 'ArrowUp') e.preventDefault()
    }
    function onKeyUp(e: KeyboardEvent) {
      setKeysDown((prev) => { const n = new Set(prev); n.delete(e.key); return n })
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp) }
  }, [])

  // Game loop
  useEffect(() => {
    if (finished) return

    function loop(ts: number) {
      if (finishedRef.current) return

      // Move ship
      if (ts - lastShipMoveRef.current > 16) {
        lastShipMoveRef.current = ts
        setKeysDown((keys) => {
          if (keys.has('ArrowLeft') || keys.has('a') || keys.has('A')) {
            setShipX((x) => Math.max(0, x - SHIP_SPEED / 10))
          }
          if (keys.has('ArrowRight') || keys.has('d') || keys.has('D')) {
            setShipX((x) => Math.min(96, x + SHIP_SPEED / 10))
          }
          return keys
        })
      }

      // Move bullets
      setBullets((prev) => prev.map((b) => ({ ...b, y: b.y - BULLET_SPEED / 10 })).filter((b) => b.y > 0))

      animFrameRef.current = requestAnimationFrame(loop)
    }

    animFrameRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [finished])

  // Invader march
  useEffect(() => {
    if (finished) return
    const interval = setInterval(() => {
      if (finishedRef.current) return
      setInvaders((prev) => {
        const alive = prev.filter((i) => i.alive)
        if (alive.length === 0) return prev

        const minX = Math.min(...alive.map((i) => i.x))
        const maxX = Math.max(...alive.map((i) => i.x))

        let newDir = direction
        let drop = false
        if (maxX >= 96 && direction === 1) { newDir = -1; drop = true }
        if (minX <= 2 && direction === -1) { newDir = 1; drop = true }

        setDirection(newDir)
        return prev.map((inv) => ({
          ...inv,
          x: inv.alive ? inv.x + (drop ? 0 : newDir * 6) : inv.x,
          y: inv.alive ? inv.y + (drop ? INVADER_DROP / 10 : 0) : inv.y,
        }))
      })
    }, INVADER_SPEED_MS)
    return () => clearInterval(interval)
  }, [direction, finished])

  // Collision detection
  useEffect(() => {
    if (finished) return
    setBullets((prevBullets) => {
      if (prevBullets.length === 0) return prevBullets
      let bulletsChanged = false
      const remainingBullets = [...prevBullets]

      setInvaders((prevInvaders) => {
        let invadersChanged = false
        const nextInvaders = prevInvaders.map((inv) => {
          if (!inv.alive) return inv
          const hitIdx = remainingBullets.findIndex(
            (b) => Math.abs(b.x - inv.x) < 10 && Math.abs(b.y - inv.y) < 7
          )
          if (hitIdx !== -1) {
            remainingBullets.splice(hitIdx, 1)
            bulletsChanged = true
            invadersChanged = true
            setHits((h) => [...h, { id: inv.id, correct: inv.isCorrect }])
            if (inv.isCorrect) {
              setScore((s) => s + 1)
            } else {
              setLives((l) => l - 1)
            }
            return { ...inv, alive: false }
          }
          return inv
        })
        if (invadersChanged) return nextInvaders
        return prevInvaders
      })

      if (bulletsChanged) return remainingBullets
      return prevBullets
    })
  })

  // Check end conditions
  useEffect(() => {
    if (finished) return
    const aliveCorrect = invaders.filter((i) => i.alive && i.isCorrect).length
    const allCorrectDestroyed = aliveCorrect === 0
    const dead = lives <= 0

    if (allCorrectDestroyed || dead) {
      finishedRef.current = true
      setFinished(true)
      const isWon = allCorrectDestroyed && lives > 0
      setWon(isWon)
      const shot = hits.filter((h) => h.correct).map((h) => invaders.find((i) => i.id === h.id)?.text ?? '')
      setTimeout(() => onAntwort(shot, isWon), 1200)
    }
  }, [invaders, lives, finished, hits, onAntwort])

  function shoot() {
    if (finished) return
    setBullets((prev) => {
      if (prev.length >= 3) return prev
      return [...prev, { id: bulletIdRef.current++, x: shipX + 2, y: 82 }]
    })
  }

  function moveLeft() { setShipX((x) => Math.max(0, x - 8)) }
  function moveRight() { setShipX((x) => Math.min(96, x + 8)) }

  return (
    <div className="flex flex-col gap-3 select-none">
      <p className="text-sm font-medium leading-relaxed text-center px-2">{text}</p>

      {/* HUD */}
      <div className="flex justify-between items-center px-1 text-xs font-medium text-gray-600">
        <span>❤️ {Array.from({ length: lives }).map(() => '♥').join(' ')}</span>
        <span className="text-violet-600">{score} / {totalCorrect} Richtig</span>
      </div>

      {/* Arena */}
      <div
        className="relative w-full rounded-xl overflow-hidden border border-gray-800"
        style={{ height: 220, background: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a3a 100%)' }}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'ArrowUp') { e.preventDefault(); shoot() }
        }}
      >
        {/* Stars */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white opacity-40"
            style={{ width: 1.5, height: 1.5, left: `${(i * 37 + 13) % 100}%`, top: `${(i * 53 + 7) % 90}%` }}
          />
        ))}

        {/* Invaders */}
        {invaders.filter((inv) => inv.alive).map((inv) => (
          <div
            key={inv.id}
            className={`absolute flex items-center justify-center text-center rounded-md px-1 transition-none
              ${inv.isCorrect ? 'bg-green-700 border border-green-400 text-green-100' : 'bg-red-800 border border-red-500 text-red-100'}`}
            style={{
              left: `${inv.x}%`,
              top: `${inv.y}%`,
              fontSize: 8,
              fontWeight: 600,
              lineHeight: 1.2,
              width: '22%',
              minHeight: 26,
              transform: 'translateX(-50%)',
            }}
          >
            {inv.isCorrect ? '👾' : '💀'} {inv.text}
          </div>
        ))}

        {/* Hit flashes */}
        {hits.slice(-4).map((h) => {
          const inv = invaders.find((i) => i.id === h.id)
          if (!inv) return null
          return (
            <div
              key={`hit-${h.id}`}
              className="absolute text-xs font-bold animate-ping"
              style={{ left: `${inv.x}%`, top: `${inv.y}%`, color: h.correct ? '#4ade80' : '#f87171' }}
            >
              {h.correct ? '+1' : '-♥'}
            </div>
          )
        })}

        {/* Bullets */}
        {bullets.map((b) => (
          <div
            key={b.id}
            className="absolute rounded-full bg-yellow-300"
            style={{ width: 4, height: 10, left: `${b.x}%`, top: `${b.y}%`, transform: 'translateX(-50%)' }}
          />
        ))}

        {/* Ship */}
        <div
          className="absolute text-2xl transition-none"
          style={{ left: `${shipX}%`, bottom: '4%', transform: 'translateX(-50%)' }}
        >
          🚀
        </div>

        {/* Finish overlay */}
        {finished && (
          <div className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.6)' }}>
            <div className={`text-2xl font-bold ${won ? 'text-green-400' : 'text-red-400'}`}>
              {won ? '🎉 Mission erfüllt!' : '💥 Game Over'}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      {!finished && (
        <div className="flex gap-4 justify-center text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-green-700 border border-green-400" /> Richtig — abschießen</span>
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-red-800 border border-red-500" /> Falsch — nicht abschießen</span>
        </div>
      )}

      {/* Feedback */}
      {finished && (
        <div className={`text-sm px-4 py-3 rounded-xl font-medium text-center
          ${won ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {won ? feedback.bei_korrekt : feedback.bei_falsch}
        </div>
      )}

      {/* Touch controls */}
      <div className="flex gap-2 justify-center mt-1">
        <button
          onPointerDown={moveLeft}
          className="w-14 h-12 rounded-xl bg-gray-100 border border-gray-200 text-lg font-bold active:bg-violet-100"
        >←</button>
        <button
          onPointerDown={shoot}
          className="flex-1 h-12 rounded-xl font-semibold text-sm text-white active:opacity-80"
          style={{ background: 'linear-gradient(135deg, #7C3AED, #A855F7)' }}
        >🔫 Schießen</button>
        <button
          onPointerDown={moveRight}
          className="w-14 h-12 rounded-xl bg-gray-100 border border-gray-200 text-lg font-bold active:bg-violet-100"
        >→</button>
      </div>
    </div>
  )
}
