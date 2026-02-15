/**
 * Floating card shown on map state hover. Styled with dashboard theme.
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
      <div className="bg-card/90 backdrop-blur-md border border-primary/50 rounded-lg px-3 py-2 min-w-[160px] shadow-xl">
        <div className="text-primary font-semibold text-sm mb-1">
          {data.name}
        </div>
        <div className="space-y-0.5 font-mono text-[10px]">
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">GDP</span>
            <span className="text-foreground">{data.gdp}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Industry</span>
            <span className="text-foreground">{data.majorIndustry}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Energy</span>
            <span className="text-foreground">{data.energyConsumption}</span>
          </div>
          <div className="mt-1 pt-1 border-t border-border">
            <span className="text-primary/80 italic">{data.speciality}</span>
          </div>
        </div>
      </div>
      <div className="w-px h-4 bg-gradient-to-b from-primary/60 to-transparent mx-auto" />
      <div className="w-1.5 h-1.5 rounded-full bg-primary mx-auto animate-pulse" />
    </div>
  )
}
