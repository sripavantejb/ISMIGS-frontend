import { useState, useMemo, useEffect, useRef } from 'react'
import indiaMap from '@svg-maps/india'
import StateLabel from './StateLabel'
import { statesData, statePositions } from '../data/indiaStatesData'

const AUTO_CYCLE_MS = 2500

const stateIdsWithPosition = statesData
  .filter((s) => statePositions[s.id])
  .map((s) => s.id)

export default function IndiaMapVisualization({ highlightedId = null }) {
  const [hoveredId, setHoveredId] = useState(null)
  const [autoSelectedIndex, setAutoSelectedIndex] = useState(0)
  const intervalRef = useRef(null)

  const locations = useMemo(() => indiaMap.locations, [])

  const autoSelectedId =
    stateIdsWithPosition.length > 0
      ? stateIdsWithPosition[autoSelectedIndex % stateIdsWithPosition.length]
      : null

  const activeId = hoveredId ?? highlightedId ?? autoSelectedId
  const activeState = activeId
    ? statesData.find((s) => s.id === activeId) ?? null
    : null

  useEffect(() => {
    if (stateIdsWithPosition.length <= 1) return
    intervalRef.current = setInterval(() => {
      setAutoSelectedIndex((i) => i + 1)
    }, AUTO_CYCLE_MS)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  return (
    <div className="relative w-full h-[55vh] flex items-center justify-center">
      <div className="relative flex items-center justify-center">
        <svg
          viewBox={indiaMap.viewBox}
          className="h-[55vh] w-auto max-w-full"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid meet"
          style={{ filter: 'drop-shadow(0 0 40px rgba(139, 92, 246, 0.12))' }}
        >
          <defs>
            <filter id="ismigs-glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {locations.map((loc) => {
            const isActive = activeId === loc.id
            return (
              <path
                key={loc.id}
                d={loc.path}
                fill={isActive ? 'rgba(139, 92, 246, 0.35)' : 'rgba(139, 92, 246, 0.18)'}
                stroke={isActive ? 'rgb(167, 139, 250)' : 'rgba(255,255,255,0.35)'}
                strokeWidth={isActive ? 1.5 : 0.8}
                filter={isActive ? 'url(#ismigs-glow)' : undefined}
                className="transition-all duration-300 cursor-pointer"
                onMouseEnter={() => setHoveredId(loc.id)}
                onMouseLeave={() => setHoveredId(null)}
              />
            )
          })}
        </svg>

        {activeId && activeState && statePositions[activeState.id] && (
          <div className="absolute inset-0 pointer-events-none">
            <StateLabel
              key={activeState.id}
              data={activeState}
              position={statePositions[activeState.id]}
              visible
            />
          </div>
        )}
      </div>
    </div>
  )
}
