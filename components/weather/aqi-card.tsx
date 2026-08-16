import Card1 from "@/components/blocks/card-1"
import type { Snapshot } from "@/lib/weather/types"

const AQI_WORDS = {
  1: "Хорошо",
  2: "Удовлетворительно",
  3: "Умеренно",
  4: "Плохо",
  5: "Очень плохо",
} as const

function formatPollutant(value: number) {
  return value >= 10 ? String(Math.round(value)) : value.toFixed(1)
}

export function AqiCard({ snapshot }: { snapshot: Snapshot }) {
  const sample = snapshot.air.list[0]
  if (!sample) return null

  const label = AQI_WORDS[sample.main.aqi]
  const { pm2_5, pm10, no2, o3 } = sample.components

  return (
    <Card1 label={label}>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Pair name="PM2.5" value={formatPollutant(pm2_5)} />
        <Pair name="PM10" value={formatPollutant(pm10)} />
        <Pair name="NO₂" value={formatPollutant(no2)} />
        <Pair name="O₃" value={formatPollutant(o3)} />
      </dl>
    </Card1>
  )
}

function Pair({ name, value }: { name: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="text-xs text-[var(--fogline)]">{name}</dt>
      <dd className="font-mono text-sm text-[var(--mercury)]">{value}</dd>
    </div>
  )
}
