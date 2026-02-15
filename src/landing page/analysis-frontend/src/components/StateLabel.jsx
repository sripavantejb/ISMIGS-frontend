/**
 * Floating card shown on map state hover. Styled with ismigs theme.
 */
export default function StateLabel({ data, position, visible }) {
  if (!visible) return null

  return (
    <div
      className="absolute pointer-events-none animate-fade-in"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -100%)',
        zIndex: 10,
      }}
    >
      <div className="bg-ismigs-card/90 backdrop-blur-md border border-ismigs-purple/50 rounded-lg px-3 py-2 min-w-[160px] shadow-xl">
        <div className="text-ismigs-purple font-semibold text-sm mb-1">
          {data.name}
        </div>
        <div className="space-y-0.5 font-mono text-[10px]">
          <div className="flex justify-between gap-3">
            <span className="text-gray-500">GDP</span>
            <span className="text-white">{data.gdp}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-gray-500">Industry</span>
            <span className="text-white">{data.majorIndustry}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-gray-500">Energy</span>
            <span className="text-white">{data.energyConsumption}</span>
          </div>
          <div className="mt-1 pt-1 border-t border-white/10">
            <span className="text-ismigs-purple/80 italic">{data.speciality}</span>
          </div>
        </div>
      </div>
      <div className="w-px h-4 bg-gradient-to-b from-ismigs-purple/60 to-transparent mx-auto" />
      <div className="w-1.5 h-1.5 rounded-full bg-ismigs-purple mx-auto animate-pulse" />
    </div>
  )
}
